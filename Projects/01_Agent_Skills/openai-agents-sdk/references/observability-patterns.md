# Observability Patterns

## Contents
- Custom Trace Processors
- OpenTelemetry Integration
- Metrics Collection
- Structured Logging
- Distributed Tracing
- Health Checks

## Custom Trace Processors

Implement processors to capture and export trace data:

```python
from typing import Any
from collections import defaultdict
from datetime import datetime
import json
from agents.tracing import TracingProcessor, Trace, Span

class MetricsProcessor(TracingProcessor):
    """Collect metrics from traces and spans."""

    def __init__(self):
        self._trace_count = 0
        self._span_count = 0
        self._span_durations: dict[str, list[float]] = defaultdict(list)
        self._error_count = 0
        self._agent_invocations: dict[str, int] = defaultdict(int)
        self._tool_invocations: dict[str, int] = defaultdict(int)

    def on_trace_start(self, trace: Trace) -> None:
        self._trace_count += 1

    def on_trace_end(self, trace: Trace) -> None:
        pass

    def on_span_start(self, span: Span[Any]) -> None:
        self._span_count += 1

        # Track by span type
        span_type = span.span_data.__class__.__name__
        if "Agent" in span_type:
            self._agent_invocations[span.span_data.name] += 1
        elif "Tool" in span_type:
            self._tool_invocations[span.span_data.name] += 1

    def on_span_end(self, span: Span[Any]) -> None:
        # Calculate duration
        if span.started_at and span.ended_at:
            start = datetime.fromisoformat(span.started_at.replace("Z", "+00:00"))
            end = datetime.fromisoformat(span.ended_at.replace("Z", "+00:00"))
            duration = (end - start).total_seconds()

            span_type = span.span_data.__class__.__name__
            self._span_durations[span_type].append(duration)

        # Track errors
        if span.error:
            self._error_count += 1

    def shutdown(self) -> None:
        pass

    def force_flush(self) -> None:
        pass

    def get_metrics(self) -> dict:
        """Get collected metrics."""
        return {
            "traces": self._trace_count,
            "spans": self._span_count,
            "errors": self._error_count,
            "agent_invocations": dict(self._agent_invocations),
            "tool_invocations": dict(self._tool_invocations),
            "durations": {
                k: {
                    "count": len(v),
                    "avg": sum(v) / len(v) if v else 0,
                    "max": max(v) if v else 0,
                    "min": min(v) if v else 0,
                }
                for k, v in self._span_durations.items()
            },
        }


class AuditLogProcessor(TracingProcessor):
    """Log all agent actions for audit trail."""

    def __init__(self, log_file: str = "agent_audit.jsonl"):
        self._log_file = log_file
        self._file = open(log_file, "a")

    def on_trace_start(self, trace: Trace) -> None:
        self._log({
            "event": "trace_start",
            "trace_id": trace.trace_id,
            "workflow": trace.workflow_name,
            "timestamp": datetime.utcnow().isoformat(),
        })

    def on_trace_end(self, trace: Trace) -> None:
        self._log({
            "event": "trace_end",
            "trace_id": trace.trace_id,
            "timestamp": datetime.utcnow().isoformat(),
        })

    def on_span_start(self, span: Span[Any]) -> None:
        data = span.export()
        self._log({
            "event": "span_start",
            "span_id": span.span_id,
            "trace_id": span.trace_id,
            "parent_id": span.parent_id,
            "type": span.span_data.__class__.__name__,
            "timestamp": span.started_at,
        })

    def on_span_end(self, span: Span[Any]) -> None:
        data = span.export()
        self._log({
            "event": "span_end",
            "span_id": span.span_id,
            "trace_id": span.trace_id,
            "duration_ms": self._calc_duration_ms(span),
            "error": span.error,
            "timestamp": span.ended_at,
        })

    def _calc_duration_ms(self, span: Span) -> float | None:
        if span.started_at and span.ended_at:
            start = datetime.fromisoformat(span.started_at.replace("Z", "+00:00"))
            end = datetime.fromisoformat(span.ended_at.replace("Z", "+00:00"))
            return (end - start).total_seconds() * 1000
        return None

    def _log(self, data: dict):
        self._file.write(json.dumps(data) + "\n")
        self._file.flush()

    def shutdown(self) -> None:
        self._file.close()

    def force_flush(self) -> None:
        self._file.flush()


# Register processors
from agents.tracing import add_trace_processor

metrics = MetricsProcessor()
audit = AuditLogProcessor()

add_trace_processor(metrics)
add_trace_processor(audit)
```

## OpenTelemetry Integration

Export traces to OpenTelemetry-compatible backends:

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from agents.tracing import TracingProcessor, Trace, Span
from typing import Any


class OpenTelemetryExporter(TracingProcessor):
    """Export agent traces to OpenTelemetry."""

    def __init__(
        self,
        service_name: str = "agent-service",
        otlp_endpoint: str = "http://localhost:4317",
    ):
        # Set up OpenTelemetry
        resource = Resource.create({"service.name": service_name})
        provider = TracerProvider(resource=resource)

        exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
        provider.add_span_processor(BatchSpanProcessor(exporter))

        trace.set_tracer_provider(provider)
        self._tracer = trace.get_tracer(__name__)

        # Map agent spans to OTel spans
        self._otel_spans: dict[str, trace.Span] = {}

    def on_trace_start(self, agent_trace: Trace) -> None:
        # Create root span for the trace
        span = self._tracer.start_span(
            f"trace:{agent_trace.workflow_name or 'unknown'}",
            attributes={
                "agent.trace_id": agent_trace.trace_id,
                "agent.workflow": agent_trace.workflow_name,
            },
        )
        self._otel_spans[agent_trace.trace_id] = span

    def on_trace_end(self, agent_trace: Trace) -> None:
        span = self._otel_spans.pop(agent_trace.trace_id, None)
        if span:
            span.end()

    def on_span_start(self, agent_span: Span[Any]) -> None:
        # Get parent span
        parent_span = None
        if agent_span.parent_id:
            parent_span = self._otel_spans.get(agent_span.parent_id)

        context = None
        if parent_span:
            context = trace.set_span_in_context(parent_span)

        # Create OTel span
        span_data = agent_span.span_data
        span_name = getattr(span_data, "name", span_data.__class__.__name__)

        otel_span = self._tracer.start_span(
            name=span_name,
            context=context,
            attributes=self._extract_attributes(agent_span),
        )
        self._otel_spans[agent_span.span_id] = otel_span

    def on_span_end(self, agent_span: Span[Any]) -> None:
        otel_span = self._otel_spans.pop(agent_span.span_id, None)
        if otel_span:
            if agent_span.error:
                otel_span.set_status(
                    trace.Status(trace.StatusCode.ERROR, agent_span.error.get("message", ""))
                )
                otel_span.record_exception(Exception(agent_span.error.get("message", "")))
            otel_span.end()

    def _extract_attributes(self, span: Span) -> dict:
        """Extract attributes from agent span for OTel."""
        attrs = {
            "agent.span_id": span.span_id,
            "agent.trace_id": span.trace_id,
        }

        span_data = span.span_data
        if hasattr(span_data, "name"):
            attrs["agent.name"] = span_data.name
        if hasattr(span_data, "model"):
            attrs["llm.model"] = span_data.model

        return attrs

    def shutdown(self) -> None:
        trace.get_tracer_provider().shutdown()

    def force_flush(self) -> None:
        trace.get_tracer_provider().force_flush()
```

## Metrics Collection

Collect and expose metrics for monitoring:

```python
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Callable
import threading
import time


@dataclass
class Metric:
    name: str
    value: float
    labels: dict[str, str] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)


class MetricsRegistry:
    """Central registry for agent metrics."""

    def __init__(self):
        self._counters: dict[str, float] = {}
        self._gauges: dict[str, float] = {}
        self._histograms: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def counter(self, name: str, value: float = 1, labels: dict | None = None):
        """Increment a counter."""
        key = self._make_key(name, labels)
        with self._lock:
            self._counters[key] = self._counters.get(key, 0) + value

    def gauge(self, name: str, value: float, labels: dict | None = None):
        """Set a gauge value."""
        key = self._make_key(name, labels)
        with self._lock:
            self._gauges[key] = value

    def histogram(self, name: str, value: float, labels: dict | None = None):
        """Record a histogram observation."""
        key = self._make_key(name, labels)
        with self._lock:
            if key not in self._histograms:
                self._histograms[key] = []
            self._histograms[key].append(value)

    def _make_key(self, name: str, labels: dict | None) -> str:
        if not labels:
            return name
        label_str = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
        return f"{name}{{{label_str}}}"

    def export_prometheus(self) -> str:
        """Export metrics in Prometheus format."""
        lines = []

        with self._lock:
            for key, value in self._counters.items():
                lines.append(f"{key} {value}")

            for key, value in self._gauges.items():
                lines.append(f"{key} {value}")

            for key, values in self._histograms.items():
                if values:
                    count = len(values)
                    total = sum(values)
                    lines.append(f"{key}_count {count}")
                    lines.append(f"{key}_sum {total}")

        return "\n".join(lines)


# Global registry
metrics = MetricsRegistry()


# Metrics collection processor
class PrometheusMetricsProcessor(TracingProcessor):
    """Collect Prometheus-style metrics from traces."""

    def __init__(self, registry: MetricsRegistry):
        self._registry = registry
        self._span_start_times: dict[str, datetime] = {}

    def on_trace_start(self, trace: Trace) -> None:
        self._registry.counter(
            "agent_traces_total",
            labels={"workflow": trace.workflow_name or "unknown"},
        )

    def on_trace_end(self, trace: Trace) -> None:
        pass

    def on_span_start(self, span: Span[Any]) -> None:
        self._span_start_times[span.span_id] = datetime.utcnow()

        span_type = span.span_data.__class__.__name__
        self._registry.counter(
            "agent_spans_total",
            labels={"type": span_type},
        )

    def on_span_end(self, span: Span[Any]) -> None:
        start = self._span_start_times.pop(span.span_id, None)
        if start:
            duration = (datetime.utcnow() - start).total_seconds()
            span_type = span.span_data.__class__.__name__

            self._registry.histogram(
                "agent_span_duration_seconds",
                duration,
                labels={"type": span_type},
            )

        if span.error:
            self._registry.counter(
                "agent_errors_total",
                labels={"type": span.span_data.__class__.__name__},
            )

    def shutdown(self) -> None:
        pass

    def force_flush(self) -> None:
        pass


# HTTP endpoint for metrics
from http.server import HTTPServer, BaseHTTPRequestHandler


class MetricsHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/metrics":
            output = metrics.export_prometheus()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(output.encode())
        else:
            self.send_response(404)
            self.end_headers()


def start_metrics_server(port: int = 9090):
    """Start metrics HTTP server."""
    server = HTTPServer(("", port), MetricsHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server
```

## Structured Logging

Implement structured logging with correlation IDs:

```python
import logging
import json
from contextvars import ContextVar
from typing import Any
from datetime import datetime

# Context variable for correlation ID
correlation_id: ContextVar[str] = ContextVar("correlation_id", default="")


class StructuredFormatter(logging.Formatter):
    """Format logs as JSON with correlation ID."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": correlation_id.get(""),
        }

        # Add extra fields
        if hasattr(record, "extra"):
            log_data.update(record.extra)

        # Add exception info
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


class AgentLogger:
    """Structured logger for agent operations."""

    def __init__(self, name: str):
        self._logger = logging.getLogger(name)
        handler = logging.StreamHandler()
        handler.setFormatter(StructuredFormatter())
        self._logger.addHandler(handler)
        self._logger.setLevel(logging.INFO)

    def _log(self, level: int, message: str, **extra):
        record = self._logger.makeRecord(
            self._logger.name,
            level,
            "",
            0,
            message,
            (),
            None,
        )
        record.extra = extra
        self._logger.handle(record)

    def info(self, message: str, **extra):
        self._log(logging.INFO, message, **extra)

    def warning(self, message: str, **extra):
        self._log(logging.WARNING, message, **extra)

    def error(self, message: str, **extra):
        self._log(logging.ERROR, message, **extra)

    def agent_start(self, agent_name: str, input_summary: str):
        self.info(
            "Agent started",
            agent=agent_name,
            input_length=len(input_summary),
            event="agent_start",
        )

    def agent_end(self, agent_name: str, duration_ms: float, success: bool):
        self.info(
            "Agent completed",
            agent=agent_name,
            duration_ms=duration_ms,
            success=success,
            event="agent_end",
        )

    def tool_invoked(self, tool_name: str, args: dict):
        self.info(
            "Tool invoked",
            tool=tool_name,
            args_keys=list(args.keys()),
            event="tool_invoke",
        )

    def handoff(self, from_agent: str, to_agent: str):
        self.info(
            "Agent handoff",
            from_agent=from_agent,
            to_agent=to_agent,
            event="handoff",
        )


# Logging trace processor
class LoggingProcessor(TracingProcessor):
    """Log all trace events with structured logging."""

    def __init__(self):
        self._logger = AgentLogger("agents.tracing")

    def on_trace_start(self, trace: Trace) -> None:
        # Set correlation ID
        correlation_id.set(trace.trace_id)
        self._logger.info(
            "Trace started",
            trace_id=trace.trace_id,
            workflow=trace.workflow_name,
            event="trace_start",
        )

    def on_trace_end(self, trace: Trace) -> None:
        self._logger.info(
            "Trace ended",
            trace_id=trace.trace_id,
            event="trace_end",
        )

    def on_span_start(self, span: Span[Any]) -> None:
        span_type = span.span_data.__class__.__name__
        name = getattr(span.span_data, "name", "unknown")
        self._logger.info(
            "Span started",
            span_id=span.span_id,
            span_type=span_type,
            name=name,
            event="span_start",
        )

    def on_span_end(self, span: Span[Any]) -> None:
        span_type = span.span_data.__class__.__name__
        self._logger.info(
            "Span ended",
            span_id=span.span_id,
            span_type=span_type,
            error=span.error is not None,
            event="span_end",
        )

    def shutdown(self) -> None:
        pass

    def force_flush(self) -> None:
        pass
```

## Health Checks

Implement health checks for agent services:

```python
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Callable, Awaitable
import asyncio


class HealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


@dataclass
class HealthCheckResult:
    name: str
    status: HealthStatus
    message: str | None = None
    latency_ms: float | None = None
    checked_at: datetime = None

    def __post_init__(self):
        if self.checked_at is None:
            self.checked_at = datetime.utcnow()


class HealthChecker:
    """Health check manager for agent services."""

    def __init__(self):
        self._checks: dict[str, Callable[[], Awaitable[HealthCheckResult]]] = {}
        self._last_results: dict[str, HealthCheckResult] = {}

    def register(
        self,
        name: str,
        check: Callable[[], Awaitable[HealthCheckResult]],
    ):
        """Register a health check."""
        self._checks[name] = check

    async def run_all(self) -> dict[str, HealthCheckResult]:
        """Run all health checks."""
        results = {}
        for name, check in self._checks.items():
            try:
                start = datetime.utcnow()
                result = await asyncio.wait_for(check(), timeout=10.0)
                result.latency_ms = (datetime.utcnow() - start).total_seconds() * 1000
                results[name] = result
            except asyncio.TimeoutError:
                results[name] = HealthCheckResult(
                    name=name,
                    status=HealthStatus.UNHEALTHY,
                    message="Health check timed out",
                )
            except Exception as e:
                results[name] = HealthCheckResult(
                    name=name,
                    status=HealthStatus.UNHEALTHY,
                    message=str(e),
                )

        self._last_results = results
        return results

    def get_overall_status(self) -> HealthStatus:
        """Get overall health status."""
        if not self._last_results:
            return HealthStatus.UNHEALTHY

        statuses = [r.status for r in self._last_results.values()]

        if all(s == HealthStatus.HEALTHY for s in statuses):
            return HealthStatus.HEALTHY
        elif any(s == HealthStatus.UNHEALTHY for s in statuses):
            return HealthStatus.UNHEALTHY
        else:
            return HealthStatus.DEGRADED


# Common health checks
async def check_database(db_session_factory) -> HealthCheckResult:
    """Check database connectivity."""
    try:
        session = db_session_factory()
        await session.execute("SELECT 1")
        return HealthCheckResult(
            name="database",
            status=HealthStatus.HEALTHY,
        )
    except Exception as e:
        return HealthCheckResult(
            name="database",
            status=HealthStatus.UNHEALTHY,
            message=str(e),
        )


async def check_openai_api() -> HealthCheckResult:
    """Check OpenAI API connectivity."""
    import openai
    try:
        client = openai.AsyncOpenAI()
        await client.models.list()
        return HealthCheckResult(
            name="openai_api",
            status=HealthStatus.HEALTHY,
        )
    except Exception as e:
        return HealthCheckResult(
            name="openai_api",
            status=HealthStatus.UNHEALTHY,
            message=str(e),
        )


async def check_mcp_server(server_name: str, server) -> HealthCheckResult:
    """Check MCP server connectivity."""
    try:
        await server.list_tools()
        return HealthCheckResult(
            name=f"mcp_{server_name}",
            status=HealthStatus.HEALTHY,
        )
    except Exception as e:
        return HealthCheckResult(
            name=f"mcp_{server_name}",
            status=HealthStatus.UNHEALTHY,
            message=str(e),
        )


# Health check endpoint
async def health_endpoint(checker: HealthChecker) -> dict:
    """Health check HTTP endpoint response."""
    results = await checker.run_all()
    overall = checker.get_overall_status()

    return {
        "status": overall.value,
        "checks": {
            name: {
                "status": r.status.value,
                "message": r.message,
                "latency_ms": r.latency_ms,
                "checked_at": r.checked_at.isoformat(),
            }
            for name, r in results.items()
        },
    }
```
