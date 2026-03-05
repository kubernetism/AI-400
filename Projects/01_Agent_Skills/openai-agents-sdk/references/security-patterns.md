# Security Patterns

## Contents
- Input Validation and Sanitization
- Output Filtering
- Credential Management
- Audit Logging
- Rate Limiting and Abuse Prevention
- Secure Session Handling

## Input Validation and Sanitization

Protect agents from malicious inputs:

```python
import re
from typing import Any
from pydantic import BaseModel, field_validator
from agents import Agent, GuardrailFunctionOutput, input_guardrail


class InputSanitizer:
    """Sanitize user inputs before agent processing."""

    # Patterns to detect injection attempts
    INJECTION_PATTERNS = [
        r"(?i)ignore\s+(previous|all)\s+(instructions?|prompts?)",
        r"(?i)you\s+are\s+now\s+(a|an)\s+",
        r"(?i)forget\s+(everything|all|your)",
        r"(?i)system\s*:\s*",
        r"(?i)assistant\s*:\s*",
        r"(?i)pretend\s+(to\s+be|you\s+are)",
        r"<\s*script\s*>",
        r"javascript\s*:",
    ]

    # PII patterns
    PII_PATTERNS = {
        "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
        "credit_card": r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b",
        "phone": r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",
        "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    }

    @classmethod
    def detect_injection(cls, text: str) -> list[str]:
        """Detect potential prompt injection attempts."""
        found = []
        for pattern in cls.INJECTION_PATTERNS:
            if re.search(pattern, text):
                found.append(pattern)
        return found

    @classmethod
    def detect_pii(cls, text: str) -> dict[str, list[str]]:
        """Detect PII in text."""
        found = {}
        for pii_type, pattern in cls.PII_PATTERNS.items():
            matches = re.findall(pattern, text)
            if matches:
                found[pii_type] = matches
        return found

    @classmethod
    def sanitize(cls, text: str, redact_pii: bool = True) -> str:
        """Sanitize input text."""
        result = text

        # Redact PII if requested
        if redact_pii:
            for pii_type, pattern in cls.PII_PATTERNS.items():
                result = re.sub(pattern, f"[REDACTED_{pii_type.upper()}]", result)

        # Remove potential control characters
        result = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", result)

        return result

    @classmethod
    def validate_length(
        cls,
        text: str,
        min_length: int = 1,
        max_length: int = 10000,
    ) -> bool:
        """Validate input length."""
        return min_length <= len(text) <= max_length


@input_guardrail
async def security_input_guardrail(ctx, agent, input_data) -> GuardrailFunctionOutput:
    """Comprehensive input security guardrail."""
    text = str(input_data)

    # Check for injection attempts
    injections = InputSanitizer.detect_injection(text)
    if injections:
        return GuardrailFunctionOutput(
            output_info={"type": "injection_attempt", "patterns": injections},
            tripwire_triggered=True,
        )

    # Validate length
    if not InputSanitizer.validate_length(text):
        return GuardrailFunctionOutput(
            output_info={"type": "invalid_length"},
            tripwire_triggered=True,
        )

    return GuardrailFunctionOutput(
        output_info={"status": "valid"},
        tripwire_triggered=False,
    )


# Pydantic model for validated input
class SecureInput(BaseModel):
    """Validated and sanitized input model."""
    content: str
    max_length: int = 10000

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        # Check for injection
        injections = InputSanitizer.detect_injection(v)
        if injections:
            raise ValueError("Potential prompt injection detected")

        # Sanitize
        return InputSanitizer.sanitize(v)
```

## Output Filtering

Filter sensitive information from agent outputs:

```python
import re
from typing import Any
from agents import output_guardrail, GuardrailFunctionOutput


class OutputFilter:
    """Filter sensitive data from agent outputs."""

    # Patterns to redact
    SENSITIVE_PATTERNS = {
        "api_key": r"(?i)(api[_-]?key|apikey)\s*[=:]\s*['\"]?[\w-]{20,}",
        "password": r"(?i)(password|passwd|pwd)\s*[=:]\s*['\"]?\S+",
        "token": r"(?i)(token|bearer)\s*[=:]\s*['\"]?[\w-]{20,}",
        "secret": r"(?i)(secret|private[_-]?key)\s*[=:]\s*['\"]?\S+",
        "connection_string": r"(?i)(mongodb|postgresql|mysql|redis):\/\/[^\s]+",
    }

    # Content policy violations
    POLICY_PATTERNS = {
        "code_execution": r"(?i)(exec|eval|system|subprocess|os\.)",
        "file_access": r"(?i)(open\s*\(|read_file|write_file|\/etc\/)",
        "network": r"(?i)(socket|urllib|requests\.get|http://|https://)",
    }

    @classmethod
    def filter_sensitive(cls, text: str) -> str:
        """Remove sensitive data from text."""
        result = text
        for name, pattern in cls.SENSITIVE_PATTERNS.items():
            result = re.sub(pattern, f"[FILTERED_{name.upper()}]", result)
        return result

    @classmethod
    def check_policy_violations(cls, text: str) -> list[str]:
        """Check for policy violations in output."""
        violations = []
        for name, pattern in cls.POLICY_PATTERNS.items():
            if re.search(pattern, text):
                violations.append(name)
        return violations

    @classmethod
    def filter_pii(cls, text: str) -> str:
        """Remove PII from output."""
        result = text
        for pii_type, pattern in InputSanitizer.PII_PATTERNS.items():
            result = re.sub(pattern, f"[REDACTED_{pii_type.upper()}]", result)
        return result


@output_guardrail
async def security_output_guardrail(ctx, agent, output) -> GuardrailFunctionOutput:
    """Comprehensive output security guardrail."""
    text = str(output)

    # Check for policy violations
    violations = OutputFilter.check_policy_violations(text)
    if violations:
        return GuardrailFunctionOutput(
            output_info={"type": "policy_violation", "violations": violations},
            tripwire_triggered=True,
        )

    # Filter sensitive data (could also modify output instead of blocking)
    filtered = OutputFilter.filter_sensitive(text)
    if filtered != text:
        # Output was modified - log this
        return GuardrailFunctionOutput(
            output_info={"type": "filtered", "had_sensitive": True},
            tripwire_triggered=False,
        )

    return GuardrailFunctionOutput(
        output_info={"status": "clean"},
        tripwire_triggered=False,
    )


class ContentModerator:
    """Moderate agent outputs for content policy."""

    def __init__(self, policies: list[str] | None = None):
        self.policies = policies or ["harmful", "illegal", "pii"]

    async def moderate(self, text: str) -> tuple[bool, str | None]:
        """
        Check content against policies.

        Returns:
            (is_allowed, violation_reason)
        """
        # Check each policy
        if "pii" in self.policies:
            pii = InputSanitizer.detect_pii(text)
            if pii:
                return False, f"Contains PII: {list(pii.keys())}"

        if "harmful" in self.policies:
            # Could integrate with OpenAI's moderation API
            pass

        return True, None

    async def filter(self, text: str) -> str:
        """Filter content to comply with policies."""
        result = text

        if "pii" in self.policies:
            result = OutputFilter.filter_pii(result)

        result = OutputFilter.filter_sensitive(result)

        return result
```

## Credential Management

Securely manage API keys and credentials:

```python
import os
from typing import Any
from dataclasses import dataclass
from cryptography.fernet import Fernet
from pydantic import BaseModel, SecretStr
from pydantic_settings import BaseSettings


class SecureSettings(BaseSettings):
    """Secure settings with encrypted secrets."""

    # API Keys (loaded from environment)
    openai_api_key: SecretStr
    database_url: SecretStr
    encryption_key: SecretStr

    # Non-sensitive settings
    environment: str = "development"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


class CredentialVault:
    """Secure credential storage and retrieval."""

    def __init__(self, encryption_key: bytes):
        self._fernet = Fernet(encryption_key)
        self._credentials: dict[str, bytes] = {}

    def store(self, name: str, value: str) -> None:
        """Store encrypted credential."""
        encrypted = self._fernet.encrypt(value.encode())
        self._credentials[name] = encrypted

    def retrieve(self, name: str) -> str | None:
        """Retrieve and decrypt credential."""
        encrypted = self._credentials.get(name)
        if encrypted:
            return self._fernet.decrypt(encrypted).decode()
        return None

    def rotate_key(self, new_key: bytes) -> None:
        """Rotate encryption key."""
        new_fernet = Fernet(new_key)

        # Re-encrypt all credentials
        for name, encrypted in self._credentials.items():
            decrypted = self._fernet.decrypt(encrypted)
            self._credentials[name] = new_fernet.encrypt(decrypted)

        self._fernet = new_fernet


class SecureToolContext:
    """Context for tools with secure credential access."""

    def __init__(self, vault: CredentialVault, user_id: str):
        self._vault = vault
        self._user_id = user_id
        self._allowed_credentials: set[str] = set()

    def grant_access(self, credential_name: str) -> None:
        """Grant access to a credential."""
        self._allowed_credentials.add(credential_name)

    def get_credential(self, name: str) -> str | None:
        """Get credential if access is granted."""
        if name not in self._allowed_credentials:
            raise PermissionError(f"Access to credential '{name}' not granted")
        return self._vault.retrieve(name)


# Environment-based secret loading
def load_secrets_from_env() -> dict[str, str]:
    """Load secrets from environment variables."""
    secret_prefix = "AGENT_SECRET_"
    secrets = {}

    for key, value in os.environ.items():
        if key.startswith(secret_prefix):
            secret_name = key[len(secret_prefix):].lower()
            secrets[secret_name] = value

    return secrets


# Secure configuration for agents
@dataclass
class AgentSecurityConfig:
    """Security configuration for an agent."""
    allowed_tools: list[str]
    allowed_handoffs: list[str]
    max_tokens_per_request: int = 4000
    require_auth: bool = True
    allowed_credentials: list[str] = None

    def validate_tool(self, tool_name: str) -> bool:
        return tool_name in self.allowed_tools

    def validate_handoff(self, agent_name: str) -> bool:
        return agent_name in self.allowed_handoffs
```

## Audit Logging

Comprehensive audit trail for agent actions:

```python
import json
from datetime import datetime
from typing import Any
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib


class AuditEventType(Enum):
    AGENT_START = "agent_start"
    AGENT_END = "agent_end"
    TOOL_INVOKE = "tool_invoke"
    TOOL_RESULT = "tool_result"
    HANDOFF = "handoff"
    GUARDRAIL_TRIGGERED = "guardrail_triggered"
    AUTH_SUCCESS = "auth_success"
    AUTH_FAILURE = "auth_failure"
    ERROR = "error"


@dataclass
class AuditEvent:
    """Audit log event."""
    event_id: str
    event_type: AuditEventType
    timestamp: datetime
    user_id: str | None
    session_id: str | None
    agent_name: str | None
    action: str
    details: dict[str, Any]
    ip_address: str | None = None
    user_agent: str | None = None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["event_type"] = self.event_type.value
        d["timestamp"] = self.timestamp.isoformat()
        return d

    def compute_hash(self) -> str:
        """Compute hash for integrity verification."""
        content = json.dumps(self.to_dict(), sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()


class AuditLogger:
    """Audit logger for agent operations."""

    def __init__(self, storage: "AuditStorage"):
        self._storage = storage
        self._event_counter = 0

    def _generate_event_id(self) -> str:
        self._event_counter += 1
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"audit-{timestamp}-{self._event_counter:06d}"

    async def log(
        self,
        event_type: AuditEventType,
        action: str,
        details: dict[str, Any],
        user_id: str | None = None,
        session_id: str | None = None,
        agent_name: str | None = None,
        ip_address: str | None = None,
    ) -> AuditEvent:
        """Log an audit event."""
        event = AuditEvent(
            event_id=self._generate_event_id(),
            event_type=event_type,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            session_id=session_id,
            agent_name=agent_name,
            action=action,
            details=details,
            ip_address=ip_address,
        )

        await self._storage.store(event)
        return event

    async def log_agent_start(
        self,
        agent_name: str,
        input_summary: str,
        **kwargs,
    ):
        return await self.log(
            AuditEventType.AGENT_START,
            f"Agent '{agent_name}' started",
            {"input_length": len(input_summary)},
            agent_name=agent_name,
            **kwargs,
        )

    async def log_tool_invoke(
        self,
        tool_name: str,
        arguments: dict,
        **kwargs,
    ):
        # Redact sensitive arguments
        safe_args = {
            k: "[REDACTED]" if "password" in k.lower() or "secret" in k.lower() else v
            for k, v in arguments.items()
        }
        return await self.log(
            AuditEventType.TOOL_INVOKE,
            f"Tool '{tool_name}' invoked",
            {"arguments": safe_args},
            **kwargs,
        )

    async def log_guardrail_triggered(
        self,
        guardrail_name: str,
        reason: str,
        **kwargs,
    ):
        return await self.log(
            AuditEventType.GUARDRAIL_TRIGGERED,
            f"Guardrail '{guardrail_name}' triggered",
            {"reason": reason},
            **kwargs,
        )


class AuditStorage:
    """Abstract storage for audit events."""

    async def store(self, event: AuditEvent) -> None:
        raise NotImplementedError

    async def query(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        event_types: list[AuditEventType] | None = None,
        user_id: str | None = None,
    ) -> list[AuditEvent]:
        raise NotImplementedError


class FileAuditStorage(AuditStorage):
    """File-based audit storage."""

    def __init__(self, file_path: str):
        self._file_path = file_path

    async def store(self, event: AuditEvent) -> None:
        with open(self._file_path, "a") as f:
            f.write(json.dumps(event.to_dict()) + "\n")

    async def query(self, **kwargs) -> list[AuditEvent]:
        # Implementation for querying file
        pass


class DatabaseAuditStorage(AuditStorage):
    """Database-backed audit storage."""

    def __init__(self, connection_string: str):
        self._connection_string = connection_string
        # Initialize database connection

    async def store(self, event: AuditEvent) -> None:
        # Store in database
        pass

    async def query(self, **kwargs) -> list[AuditEvent]:
        # Query database
        pass
```

## Rate Limiting and Abuse Prevention

Protect against abuse:

```python
import asyncio
from datetime import datetime, timedelta
from typing import Any
from collections import defaultdict


class RateLimiter:
    """Rate limiter with multiple windows."""

    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        requests_per_day: int = 10000,
    ):
        self._limits = {
            "minute": (requests_per_minute, timedelta(minutes=1)),
            "hour": (requests_per_hour, timedelta(hours=1)),
            "day": (requests_per_day, timedelta(days=1)),
        }
        self._requests: dict[str, list[datetime]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def check(self, key: str) -> tuple[bool, str | None]:
        """
        Check if request is allowed.

        Returns:
            (allowed, reason_if_blocked)
        """
        async with self._lock:
            now = datetime.utcnow()
            self._cleanup(key, now)

            for window_name, (limit, duration) in self._limits.items():
                cutoff = now - duration
                count = sum(1 for t in self._requests[key] if t > cutoff)

                if count >= limit:
                    return False, f"Rate limit exceeded: {limit} per {window_name}"

            return True, None

    async def record(self, key: str) -> None:
        """Record a request."""
        async with self._lock:
            self._requests[key].append(datetime.utcnow())

    def _cleanup(self, key: str, now: datetime) -> None:
        """Remove old entries."""
        max_duration = max(d for _, d in self._limits.values())
        cutoff = now - max_duration
        self._requests[key] = [t for t in self._requests[key] if t > cutoff]


class AbuseDetector:
    """Detect and prevent abuse patterns."""

    def __init__(self):
        self._suspicious_patterns: list[str] = []
        self._blocked_users: set[str] = set()
        self._user_scores: dict[str, float] = defaultdict(float)

    def add_suspicious_pattern(self, pattern: str) -> None:
        """Add pattern to watch for."""
        self._suspicious_patterns.append(pattern)

    def check_input(self, user_id: str, text: str) -> tuple[bool, str | None]:
        """
        Check input for abuse.

        Returns:
            (is_allowed, reason_if_blocked)
        """
        if user_id in self._blocked_users:
            return False, "User is blocked"

        # Check patterns
        import re
        for pattern in self._suspicious_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                self._user_scores[user_id] += 1.0
                if self._user_scores[user_id] >= 5.0:
                    self._blocked_users.add(user_id)
                    return False, "User blocked due to repeated abuse"

        return True, None

    def block_user(self, user_id: str) -> None:
        """Block a user."""
        self._blocked_users.add(user_id)

    def unblock_user(self, user_id: str) -> None:
        """Unblock a user."""
        self._blocked_users.discard(user_id)
        self._user_scores[user_id] = 0.0


class SecurityMiddleware:
    """Middleware combining security checks."""

    def __init__(
        self,
        rate_limiter: RateLimiter,
        abuse_detector: AbuseDetector,
        audit_logger: AuditLogger,
    ):
        self._rate_limiter = rate_limiter
        self._abuse_detector = abuse_detector
        self._audit = audit_logger

    async def check(
        self,
        user_id: str,
        input_text: str,
        ip_address: str | None = None,
    ) -> tuple[bool, str | None]:
        """Run all security checks."""
        # Rate limit check
        allowed, reason = await self._rate_limiter.check(user_id)
        if not allowed:
            await self._audit.log(
                AuditEventType.AUTH_FAILURE,
                "Rate limit exceeded",
                {"user_id": user_id, "reason": reason},
                user_id=user_id,
                ip_address=ip_address,
            )
            return False, reason

        # Abuse check
        allowed, reason = self._abuse_detector.check_input(user_id, input_text)
        if not allowed:
            await self._audit.log(
                AuditEventType.AUTH_FAILURE,
                "Abuse detected",
                {"user_id": user_id, "reason": reason},
                user_id=user_id,
                ip_address=ip_address,
            )
            return False, reason

        # Record successful request
        await self._rate_limiter.record(user_id)
        return True, None
```

## Secure Session Handling

Secure session management:

```python
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Any
from cryptography.fernet import Fernet


class SecureSessionManager:
    """Manage secure sessions."""

    def __init__(
        self,
        encryption_key: bytes,
        session_ttl: timedelta = timedelta(hours=24),
    ):
        self._fernet = Fernet(encryption_key)
        self._session_ttl = session_ttl
        self._sessions: dict[str, dict] = {}

    def create_session(self, user_id: str, metadata: dict | None = None) -> str:
        """Create a new secure session."""
        # Generate secure session ID
        session_id = secrets.token_urlsafe(32)

        # Store session data
        self._sessions[session_id] = {
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "last_accessed": datetime.utcnow(),
            "metadata": metadata or {},
        }

        return session_id

    def validate_session(self, session_id: str) -> tuple[bool, dict | None]:
        """
        Validate a session.

        Returns:
            (is_valid, session_data)
        """
        session = self._sessions.get(session_id)
        if not session:
            return False, None

        # Check expiration
        if datetime.utcnow() - session["created_at"] > self._session_ttl:
            del self._sessions[session_id]
            return False, None

        # Update last accessed
        session["last_accessed"] = datetime.utcnow()
        return True, session

    def destroy_session(self, session_id: str) -> None:
        """Destroy a session."""
        self._sessions.pop(session_id, None)

    def encrypt_session_data(self, data: dict) -> bytes:
        """Encrypt session data for storage."""
        import json
        return self._fernet.encrypt(json.dumps(data).encode())

    def decrypt_session_data(self, encrypted: bytes) -> dict:
        """Decrypt session data."""
        import json
        return json.loads(self._fernet.decrypt(encrypted).decode())
```
