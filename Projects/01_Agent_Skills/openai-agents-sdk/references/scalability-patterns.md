# Scalability Patterns

## Contents
- Horizontal Scaling Strategies
- Load Balancing Agents
- Caching Patterns
- Resource Management
- Batching and Queuing
- Distributed Agent Execution

## Horizontal Scaling Strategies

Scale agent workloads across multiple instances:

```python
import asyncio
from typing import Any
from dataclasses import dataclass
import hashlib

@dataclass
class AgentInstance:
    """Represents an agent instance in the pool."""
    id: str
    agent: "Agent"
    current_load: int = 0
    max_concurrent: int = 10
    healthy: bool = True


class AgentPool:
    """Pool of agent instances for horizontal scaling."""

    def __init__(self):
        self._instances: dict[str, list[AgentInstance]] = {}
        self._lock = asyncio.Lock()

    async def register(
        self,
        agent_type: str,
        agent: "Agent",
        instance_id: str,
        max_concurrent: int = 10,
    ):
        """Register an agent instance."""
        async with self._lock:
            if agent_type not in self._instances:
                self._instances[agent_type] = []

            self._instances[agent_type].append(
                AgentInstance(
                    id=instance_id,
                    agent=agent,
                    max_concurrent=max_concurrent,
                )
            )

    async def acquire(self, agent_type: str) -> AgentInstance | None:
        """Acquire an available agent instance."""
        async with self._lock:
            instances = self._instances.get(agent_type, [])

            # Find instance with lowest load
            available = [
                i for i in instances
                if i.healthy and i.current_load < i.max_concurrent
            ]

            if not available:
                return None

            # Select least loaded
            instance = min(available, key=lambda x: x.current_load)
            instance.current_load += 1
            return instance

    async def release(self, agent_type: str, instance_id: str):
        """Release an agent instance."""
        async with self._lock:
            instances = self._instances.get(agent_type, [])
            for instance in instances:
                if instance.id == instance_id:
                    instance.current_load = max(0, instance.current_load - 1)
                    break

    async def mark_unhealthy(self, agent_type: str, instance_id: str):
        """Mark an instance as unhealthy."""
        async with self._lock:
            instances = self._instances.get(agent_type, [])
            for instance in instances:
                if instance.id == instance_id:
                    instance.healthy = False
                    break


class ScalableRunner:
    """Runner that distributes work across agent pool."""

    def __init__(self, pool: AgentPool):
        self._pool = pool

    async def run(
        self,
        agent_type: str,
        input_data: str,
        session=None,
        timeout: float = 60.0,
    ):
        """Run with automatic instance selection."""
        instance = await self._pool.acquire(agent_type)
        if not instance:
            raise RuntimeError(f"No available instances for {agent_type}")

        try:
            from agents import Runner
            result = await asyncio.wait_for(
                Runner.run(instance.agent, input_data, session=session),
                timeout=timeout,
            )
            return result

        except asyncio.TimeoutError:
            await self._pool.mark_unhealthy(agent_type, instance.id)
            raise

        except Exception as e:
            # Log error but don't mark unhealthy for all errors
            raise

        finally:
            await self._pool.release(agent_type, instance.id)
```

## Load Balancing Agents

Implement various load balancing strategies:

```python
from abc import ABC, abstractmethod
from typing import TypeVar
import random
import time

T = TypeVar("T")


class LoadBalancer(ABC):
    """Abstract load balancer for agent selection."""

    @abstractmethod
    def select(self, instances: list[AgentInstance]) -> AgentInstance | None:
        pass


class RoundRobinBalancer(LoadBalancer):
    """Round-robin load balancing."""

    def __init__(self):
        self._index = 0

    def select(self, instances: list[AgentInstance]) -> AgentInstance | None:
        available = [i for i in instances if i.healthy]
        if not available:
            return None

        instance = available[self._index % len(available)]
        self._index += 1
        return instance


class LeastConnectionsBalancer(LoadBalancer):
    """Select instance with fewest active connections."""

    def select(self, instances: list[AgentInstance]) -> AgentInstance | None:
        available = [
            i for i in instances
            if i.healthy and i.current_load < i.max_concurrent
        ]
        if not available:
            return None

        return min(available, key=lambda x: x.current_load)


class WeightedRandomBalancer(LoadBalancer):
    """Weighted random selection based on capacity."""

    def select(self, instances: list[AgentInstance]) -> AgentInstance | None:
        available = [
            i for i in instances
            if i.healthy and i.current_load < i.max_concurrent
        ]
        if not available:
            return None

        # Weight by remaining capacity
        weights = [i.max_concurrent - i.current_load for i in available]
        total = sum(weights)
        if total == 0:
            return None

        r = random.uniform(0, total)
        cumulative = 0
        for i, weight in zip(available, weights):
            cumulative += weight
            if r <= cumulative:
                return i

        return available[-1]


class ConsistentHashBalancer(LoadBalancer):
    """Consistent hashing for session affinity."""

    def __init__(self, replicas: int = 100):
        self._replicas = replicas
        self._ring: dict[int, str] = {}
        self._instances: dict[str, AgentInstance] = {}

    def add_instance(self, instance: AgentInstance):
        """Add instance to hash ring."""
        self._instances[instance.id] = instance
        for i in range(self._replicas):
            key = self._hash(f"{instance.id}:{i}")
            self._ring[key] = instance.id

    def remove_instance(self, instance_id: str):
        """Remove instance from hash ring."""
        if instance_id in self._instances:
            del self._instances[instance_id]
            self._ring = {
                k: v for k, v in self._ring.items()
                if v != instance_id
            }

    def select(
        self,
        instances: list[AgentInstance],
        key: str | None = None,
    ) -> AgentInstance | None:
        """Select instance, optionally using a key for affinity."""
        if not key:
            # Fall back to random selection
            available = [i for i in instances if i.healthy]
            return random.choice(available) if available else None

        hash_key = self._hash(key)
        sorted_keys = sorted(self._ring.keys())

        for ring_key in sorted_keys:
            if ring_key >= hash_key:
                instance_id = self._ring[ring_key]
                instance = self._instances.get(instance_id)
                if instance and instance.healthy:
                    return instance

        # Wrap around
        if sorted_keys:
            instance_id = self._ring[sorted_keys[0]]
            return self._instances.get(instance_id)

        return None

    def _hash(self, key: str) -> int:
        return int(hashlib.md5(key.encode()).hexdigest(), 16)


# Load-balanced agent pool
class LoadBalancedPool:
    """Agent pool with configurable load balancing."""

    def __init__(self, balancer: LoadBalancer):
        self._instances: dict[str, list[AgentInstance]] = {}
        self._balancer = balancer
        self._lock = asyncio.Lock()

    async def run(
        self,
        agent_type: str,
        input_data: str,
        session_key: str | None = None,
    ):
        """Run with load-balanced instance selection."""
        async with self._lock:
            instances = self._instances.get(agent_type, [])
            if isinstance(self._balancer, ConsistentHashBalancer):
                instance = self._balancer.select(instances, key=session_key)
            else:
                instance = self._balancer.select(instances)

        if not instance:
            raise RuntimeError(f"No available instances for {agent_type}")

        instance.current_load += 1
        try:
            from agents import Runner
            return await Runner.run(instance.agent, input_data)
        finally:
            instance.current_load -= 1
```

## Caching Patterns

Implement caching for agent responses and tool results:

```python
from typing import Any, Callable, Awaitable
from dataclasses import dataclass
from datetime import datetime, timedelta
import hashlib
import json
import asyncio


@dataclass
class CacheEntry:
    value: Any
    created_at: datetime
    ttl: timedelta
    hits: int = 0

    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.created_at + self.ttl


class AgentCache:
    """Cache for agent responses and tool results."""

    def __init__(self, max_size: int = 1000):
        self._cache: dict[str, CacheEntry] = {}
        self._max_size = max_size
        self._lock = asyncio.Lock()

    def _make_key(self, agent_name: str, input_data: str) -> str:
        """Create cache key from agent and input."""
        content = f"{agent_name}:{input_data}"
        return hashlib.sha256(content.encode()).hexdigest()

    async def get(self, agent_name: str, input_data: str) -> Any | None:
        """Get cached response if available."""
        key = self._make_key(agent_name, input_data)
        async with self._lock:
            entry = self._cache.get(key)
            if entry and not entry.is_expired:
                entry.hits += 1
                return entry.value
            elif entry:
                del self._cache[key]
            return None

    async def set(
        self,
        agent_name: str,
        input_data: str,
        value: Any,
        ttl: timedelta = timedelta(minutes=5),
    ):
        """Cache a response."""
        key = self._make_key(agent_name, input_data)
        async with self._lock:
            # Evict if at capacity
            if len(self._cache) >= self._max_size:
                await self._evict_lru()

            self._cache[key] = CacheEntry(
                value=value,
                created_at=datetime.utcnow(),
                ttl=ttl,
            )

    async def _evict_lru(self):
        """Evict least recently used entries."""
        # Sort by hits (LFU-style), then by age
        sorted_entries = sorted(
            self._cache.items(),
            key=lambda x: (x[1].hits, x[1].created_at),
        )
        # Remove bottom 10%
        to_remove = len(sorted_entries) // 10 or 1
        for key, _ in sorted_entries[:to_remove]:
            del self._cache[key]


class ToolResultCache:
    """Cache for deterministic tool results."""

    def __init__(self, ttl: timedelta = timedelta(minutes=10)):
        self._cache: dict[str, CacheEntry] = {}
        self._default_ttl = ttl
        self._cacheable_tools: set[str] = set()

    def mark_cacheable(self, tool_name: str):
        """Mark a tool as cacheable."""
        self._cacheable_tools.add(tool_name)

    def _make_key(self, tool_name: str, args: dict) -> str:
        content = f"{tool_name}:{json.dumps(args, sort_keys=True)}"
        return hashlib.sha256(content.encode()).hexdigest()

    def get(self, tool_name: str, args: dict) -> Any | None:
        if tool_name not in self._cacheable_tools:
            return None

        key = self._make_key(tool_name, args)
        entry = self._cache.get(key)
        if entry and not entry.is_expired:
            return entry.value
        return None

    def set(self, tool_name: str, args: dict, value: Any):
        if tool_name not in self._cacheable_tools:
            return

        key = self._make_key(tool_name, args)
        self._cache[key] = CacheEntry(
            value=value,
            created_at=datetime.utcnow(),
            ttl=self._default_ttl,
        )


# Cached tool decorator
def cached_tool(
    cache: ToolResultCache,
    ttl: timedelta | None = None,
):
    """Decorator to cache tool results."""
    def decorator(func: Callable):
        tool_name = func.__name__
        cache.mark_cacheable(tool_name)

        async def wrapper(*args, **kwargs):
            # Extract arguments for cache key
            cache_args = kwargs.copy()

            # Check cache
            cached = cache.get(tool_name, cache_args)
            if cached is not None:
                return cached

            # Execute tool
            result = await func(*args, **kwargs)

            # Cache result
            cache.set(tool_name, cache_args, result)
            return result

        return wrapper
    return decorator


# Usage
tool_cache = ToolResultCache()

@cached_tool(tool_cache)
async def get_exchange_rate(from_currency: str, to_currency: str) -> float:
    """Get exchange rate (cacheable)."""
    # API call...
    return 1.0


class CachedRunner:
    """Runner with response caching."""

    def __init__(self, cache: AgentCache):
        self._cache = cache

    async def run(
        self,
        agent: "Agent",
        input_data: str,
        use_cache: bool = True,
        cache_ttl: timedelta = timedelta(minutes=5),
        **kwargs,
    ):
        """Run agent with optional caching."""
        # Check cache
        if use_cache:
            cached = await self._cache.get(agent.name, input_data)
            if cached is not None:
                return cached

        # Run agent
        from agents import Runner
        result = await Runner.run(agent, input_data, **kwargs)

        # Cache result
        if use_cache:
            await self._cache.set(
                agent.name,
                input_data,
                result.final_output,
                ttl=cache_ttl,
            )

        return result
```

## Resource Management

Manage resources and rate limits:

```python
import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any


@dataclass
class RateLimitConfig:
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    max_concurrent: int = 10
    burst_size: int = 20


class TokenBucket:
    """Token bucket rate limiter."""

    def __init__(self, rate: float, capacity: int):
        self._rate = rate  # tokens per second
        self._capacity = capacity
        self._tokens = capacity
        self._last_update = datetime.utcnow()
        self._lock = asyncio.Lock()

    async def acquire(self, tokens: int = 1) -> bool:
        """Acquire tokens, return True if successful."""
        async with self._lock:
            self._refill()

            if self._tokens >= tokens:
                self._tokens -= tokens
                return True
            return False

    async def wait_for_token(self, tokens: int = 1):
        """Wait until tokens are available."""
        while not await self.acquire(tokens):
            await asyncio.sleep(1 / self._rate)

    def _refill(self):
        """Refill tokens based on elapsed time."""
        now = datetime.utcnow()
        elapsed = (now - self._last_update).total_seconds()
        self._tokens = min(
            self._capacity,
            self._tokens + elapsed * self._rate,
        )
        self._last_update = now


class ConcurrencySemaphore:
    """Semaphore for limiting concurrent operations."""

    def __init__(self, max_concurrent: int):
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._active = 0

    async def __aenter__(self):
        await self._semaphore.acquire()
        self._active += 1
        return self

    async def __aexit__(self, *args):
        self._active -= 1
        self._semaphore.release()

    @property
    def active_count(self) -> int:
        return self._active


class ResourceManager:
    """Manage rate limits and resources for agents."""

    def __init__(self, config: RateLimitConfig):
        self._config = config
        self._minute_bucket = TokenBucket(
            rate=config.requests_per_minute / 60,
            capacity=config.burst_size,
        )
        self._hour_bucket = TokenBucket(
            rate=config.requests_per_hour / 3600,
            capacity=config.requests_per_hour // 10,
        )
        self._semaphore = ConcurrencySemaphore(config.max_concurrent)

    async def acquire(self):
        """Acquire permission to make a request."""
        # Wait for rate limits
        await self._minute_bucket.wait_for_token()
        await self._hour_bucket.wait_for_token()

        # Wait for concurrency slot
        await self._semaphore.__aenter__()

    async def release(self):
        """Release resources."""
        await self._semaphore.__aexit__(None, None, None)

    async def run_with_limits(self, coro):
        """Run coroutine with resource limits."""
        await self.acquire()
        try:
            return await coro
        finally:
            await self.release()


class ResourceLimitedRunner:
    """Runner with resource management."""

    def __init__(self, manager: ResourceManager):
        self._manager = manager

    async def run(self, agent: "Agent", input_data: str, **kwargs):
        """Run agent with resource limits."""
        from agents import Runner

        async def _run():
            return await Runner.run(agent, input_data, **kwargs)

        return await self._manager.run_with_limits(_run())
```

## Batching and Queuing

Batch operations for efficiency:

```python
import asyncio
from typing import Any, Callable, Awaitable
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class QueuedRequest:
    """A request waiting in the queue."""
    id: str
    agent_type: str
    input_data: str
    future: asyncio.Future
    created_at: datetime = field(default_factory=datetime.utcnow)
    priority: int = 0


class RequestQueue:
    """Priority queue for agent requests."""

    def __init__(self, max_size: int = 10000):
        self._queue: asyncio.PriorityQueue = asyncio.PriorityQueue(maxsize=max_size)
        self._pending: dict[str, QueuedRequest] = {}

    async def enqueue(
        self,
        request_id: str,
        agent_type: str,
        input_data: str,
        priority: int = 0,
    ) -> asyncio.Future:
        """Add request to queue."""
        future = asyncio.get_event_loop().create_future()
        request = QueuedRequest(
            id=request_id,
            agent_type=agent_type,
            input_data=input_data,
            future=future,
            priority=priority,
        )

        # Priority queue uses (priority, timestamp, request)
        await self._queue.put((
            -priority,  # Higher priority = lower number
            request.created_at.timestamp(),
            request,
        ))

        self._pending[request_id] = request
        return future

    async def dequeue(self) -> QueuedRequest:
        """Get next request from queue."""
        _, _, request = await self._queue.get()
        return request

    def complete(self, request_id: str, result: Any):
        """Complete a request with result."""
        if request_id in self._pending:
            request = self._pending.pop(request_id)
            request.future.set_result(result)

    def fail(self, request_id: str, error: Exception):
        """Fail a request with error."""
        if request_id in self._pending:
            request = self._pending.pop(request_id)
            request.future.set_exception(error)


class BatchProcessor:
    """Process requests in batches."""

    def __init__(
        self,
        queue: RequestQueue,
        batch_size: int = 10,
        batch_timeout: float = 1.0,
    ):
        self._queue = queue
        self._batch_size = batch_size
        self._batch_timeout = batch_timeout
        self._running = False

    async def start(self, agent_pool: "AgentPool"):
        """Start processing batches."""
        self._running = True

        while self._running:
            batch = await self._collect_batch()
            if batch:
                await self._process_batch(batch, agent_pool)

    async def stop(self):
        """Stop processing."""
        self._running = False

    async def _collect_batch(self) -> list[QueuedRequest]:
        """Collect a batch of requests."""
        batch = []
        deadline = asyncio.get_event_loop().time() + self._batch_timeout

        while len(batch) < self._batch_size:
            remaining = deadline - asyncio.get_event_loop().time()
            if remaining <= 0:
                break

            try:
                request = await asyncio.wait_for(
                    self._queue.dequeue(),
                    timeout=remaining,
                )
                batch.append(request)
            except asyncio.TimeoutError:
                break

        return batch

    async def _process_batch(
        self,
        batch: list[QueuedRequest],
        agent_pool: "AgentPool",
    ):
        """Process a batch of requests concurrently."""
        tasks = []
        for request in batch:
            task = asyncio.create_task(
                self._process_single(request, agent_pool)
            )
            tasks.append(task)

        await asyncio.gather(*tasks, return_exceptions=True)

    async def _process_single(
        self,
        request: QueuedRequest,
        agent_pool: "AgentPool",
    ):
        """Process a single request."""
        try:
            instance = await agent_pool.acquire(request.agent_type)
            if not instance:
                self._queue.fail(request.id, RuntimeError("No available agent"))
                return

            try:
                from agents import Runner
                result = await Runner.run(instance.agent, request.input_data)
                self._queue.complete(request.id, result)
            finally:
                await agent_pool.release(request.agent_type, instance.id)

        except Exception as e:
            self._queue.fail(request.id, e)


# Usage
async def main():
    queue = RequestQueue()
    processor = BatchProcessor(queue, batch_size=5, batch_timeout=0.5)
    pool = AgentPool()

    # Start processor
    processor_task = asyncio.create_task(processor.start(pool))

    # Submit requests
    futures = []
    for i in range(100):
        future = await queue.enqueue(
            request_id=f"req-{i}",
            agent_type="assistant",
            input_data=f"Request {i}",
        )
        futures.append(future)

    # Wait for results
    results = await asyncio.gather(*futures)
```
