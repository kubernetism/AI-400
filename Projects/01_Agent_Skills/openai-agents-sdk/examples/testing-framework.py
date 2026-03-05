"""
Testing Framework for OpenAI Agents SDK

Comprehensive testing utilities for:
- Unit testing agents and tools
- Integration testing multi-agent workflows
- Mocking external services
- Performance benchmarking
"""

import asyncio
import time
from typing import Any, Callable, Awaitable
from dataclasses import dataclass, field
from unittest.mock import AsyncMock, MagicMock
import pytest
from agents import Agent, Runner, function_tool


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def mock_runner():
    """Create a mock runner for testing."""
    mock = AsyncMock()
    mock.run = AsyncMock(return_value=MagicMock(
        final_output="Mock response",
        new_items=[],
    ))
    return mock


@pytest.fixture
def test_agent():
    """Create a basic test agent."""
    return Agent(
        name="Test Agent",
        instructions="You are a test agent. Respond with 'Test passed.'",
        model="gpt-5.2",
    )


@pytest.fixture
def test_session():
    """Create an in-memory test session."""
    from agents import SQLiteSession
    return SQLiteSession("test-session", ":memory:")


# =============================================================================
# Test Utilities
# =============================================================================

@dataclass
class AgentTestCase:
    """Test case for agent behavior."""
    name: str
    input_message: str
    expected_output: str | None = None
    expected_tool_calls: list[str] = field(default_factory=list)
    expected_handoff: str | None = None
    should_trigger_guardrail: bool = False
    max_turns: int = 10


@dataclass
class TestResult:
    """Result of a test execution."""
    test_name: str
    passed: bool
    actual_output: str
    expected_output: str | None
    tool_calls: list[str]
    handoffs: list[str]
    duration_ms: float
    error: str | None = None


class AgentTester:
    """Utility for testing agent behavior."""

    def __init__(self, agent: Agent):
        self.agent = agent
        self.results: list[TestResult] = []

    async def run_test(self, test_case: AgentTestCase) -> TestResult:
        """Run a single test case."""
        start_time = time.time()
        tool_calls = []
        handoffs = []
        error = None

        try:
            result = await Runner.run(
                self.agent,
                test_case.input_message,
                max_turns=test_case.max_turns,
            )

            actual_output = result.final_output

            # Track tool calls and handoffs from result
            for item in result.new_items:
                if hasattr(item, "tool_name"):
                    tool_calls.append(item.tool_name)
                if hasattr(item, "agent_name"):
                    handoffs.append(item.agent_name)

            # Check expectations
            passed = True
            if test_case.expected_output:
                passed = passed and (test_case.expected_output in str(actual_output))

            if test_case.expected_tool_calls:
                passed = passed and all(
                    tc in tool_calls for tc in test_case.expected_tool_calls
                )

            if test_case.expected_handoff:
                passed = passed and (test_case.expected_handoff in handoffs)

        except Exception as e:
            actual_output = ""
            passed = test_case.should_trigger_guardrail
            error = str(e)

        duration_ms = (time.time() - start_time) * 1000

        test_result = TestResult(
            test_name=test_case.name,
            passed=passed,
            actual_output=str(actual_output),
            expected_output=test_case.expected_output,
            tool_calls=tool_calls,
            handoffs=handoffs,
            duration_ms=duration_ms,
            error=error,
        )

        self.results.append(test_result)
        return test_result

    async def run_tests(self, test_cases: list[AgentTestCase]) -> list[TestResult]:
        """Run multiple test cases."""
        results = []
        for tc in test_cases:
            result = await self.run_test(tc)
            results.append(result)
        return results

    def summary(self) -> dict:
        """Get test summary."""
        passed = sum(1 for r in self.results if r.passed)
        total = len(self.results)
        total_time = sum(r.duration_ms for r in self.results)

        return {
            "total": total,
            "passed": passed,
            "failed": total - passed,
            "pass_rate": (passed / total * 100) if total > 0 else 0,
            "total_time_ms": total_time,
            "avg_time_ms": total_time / total if total > 0 else 0,
        }


# =============================================================================
# Mock Tools
# =============================================================================

def create_mock_tool(
    name: str,
    return_value: Any = "mock result",
    side_effect: Exception | None = None,
):
    """Create a mock tool for testing."""

    @function_tool(name_override=name)
    async def mock_tool(**kwargs) -> Any:
        if side_effect:
            raise side_effect
        return return_value

    return mock_tool


class MockToolRegistry:
    """Registry for mock tools in tests."""

    def __init__(self):
        self._tools: dict[str, Any] = {}
        self._call_history: dict[str, list[dict]] = {}

    def register(
        self,
        name: str,
        return_value: Any = "mock result",
        side_effect: Exception | None = None,
    ):
        """Register a mock tool."""
        self._call_history[name] = []

        @function_tool(name_override=name)
        async def mock_tool(**kwargs) -> Any:
            self._call_history[name].append(kwargs)
            if side_effect:
                raise side_effect
            return return_value

        self._tools[name] = mock_tool
        return mock_tool

    def get(self, name: str):
        """Get a mock tool."""
        return self._tools.get(name)

    def get_calls(self, name: str) -> list[dict]:
        """Get call history for a tool."""
        return self._call_history.get(name, [])

    def reset(self):
        """Reset all call histories."""
        for name in self._call_history:
            self._call_history[name] = []


# =============================================================================
# Performance Benchmarking
# =============================================================================

@dataclass
class BenchmarkResult:
    """Result of a performance benchmark."""
    name: str
    iterations: int
    total_time_ms: float
    avg_time_ms: float
    min_time_ms: float
    max_time_ms: float
    p50_time_ms: float
    p95_time_ms: float
    p99_time_ms: float
    throughput_per_sec: float


class AgentBenchmark:
    """Benchmark agent performance."""

    def __init__(self, agent: Agent):
        self.agent = agent

    async def run(
        self,
        name: str,
        message: str,
        iterations: int = 100,
        warmup: int = 5,
    ) -> BenchmarkResult:
        """Run performance benchmark."""
        times = []

        # Warmup runs
        for _ in range(warmup):
            await Runner.run(self.agent, message)

        # Timed runs
        for _ in range(iterations):
            start = time.time()
            await Runner.run(self.agent, message)
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)

        times.sort()
        total_time = sum(times)

        return BenchmarkResult(
            name=name,
            iterations=iterations,
            total_time_ms=total_time,
            avg_time_ms=total_time / iterations,
            min_time_ms=min(times),
            max_time_ms=max(times),
            p50_time_ms=times[int(iterations * 0.50)],
            p95_time_ms=times[int(iterations * 0.95)],
            p99_time_ms=times[int(iterations * 0.99)],
            throughput_per_sec=(iterations / total_time) * 1000,
        )


# =============================================================================
# Integration Test Utilities
# =============================================================================

class MultiAgentTestHarness:
    """Test harness for multi-agent workflows."""

    def __init__(self, agents: dict[str, Agent]):
        self.agents = agents
        self.conversation_history: list[dict] = []
        self.handoff_trace: list[tuple[str, str]] = []

    async def run_conversation(
        self,
        messages: list[str],
        starting_agent: str,
    ) -> list[str]:
        """Run a multi-turn conversation."""
        current_agent = starting_agent
        responses = []

        for message in messages:
            agent = self.agents[current_agent]
            result = await Runner.run(agent, message)

            self.conversation_history.append({
                "agent": current_agent,
                "input": message,
                "output": result.final_output,
            })

            responses.append(result.final_output)

            # Track handoffs
            for item in result.new_items:
                if hasattr(item, "agent_name") and item.agent_name != current_agent:
                    self.handoff_trace.append((current_agent, item.agent_name))
                    current_agent = item.agent_name

        return responses

    def assert_handoff_occurred(self, from_agent: str, to_agent: str) -> bool:
        """Assert that a specific handoff occurred."""
        return (from_agent, to_agent) in self.handoff_trace

    def assert_conversation_length(self, expected_length: int) -> bool:
        """Assert conversation has expected number of turns."""
        return len(self.conversation_history) == expected_length


# =============================================================================
# Example Tests
# =============================================================================

@pytest.mark.asyncio
async def test_agent_basic_response(test_agent):
    """Test that agent responds correctly."""
    result = await Runner.run(test_agent, "Hello")
    assert result.final_output is not None


@pytest.mark.asyncio
async def test_agent_with_tools():
    """Test agent with mock tools."""
    mock_registry = MockToolRegistry()
    weather_tool = mock_registry.register(
        "get_weather",
        return_value={"temperature": 72, "condition": "sunny"},
    )

    agent = Agent(
        name="Weather Agent",
        instructions="Use the weather tool to answer weather questions.",
        tools=[weather_tool],
    )

    result = await Runner.run(agent, "What's the weather?")

    # Check tool was called
    calls = mock_registry.get_calls("get_weather")
    assert len(calls) > 0


@pytest.mark.asyncio
async def test_guardrail_triggers():
    """Test that guardrails trigger correctly."""
    from agents import input_guardrail, GuardrailFunctionOutput
    from agents.exceptions import InputGuardrailTripwireTriggered

    @input_guardrail
    async def block_test(ctx, agent, input):
        return GuardrailFunctionOutput(
            output_info={"blocked": True},
            tripwire_triggered="block" in str(input).lower(),
        )

    agent = Agent(
        name="Guarded Agent",
        instructions="You are a guarded agent.",
        input_guardrails=[block_test],
    )

    # This should trigger guardrail
    with pytest.raises(InputGuardrailTripwireTriggered):
        await Runner.run(agent, "Please block this message")

    # This should succeed
    result = await Runner.run(agent, "Hello there")
    assert result.final_output is not None


# =============================================================================
# CLI Runner
# =============================================================================

async def run_test_suite():
    """Run the complete test suite."""
    print("Running OpenAI Agents SDK Test Suite")
    print("=" * 50)

    # Create test agent
    @function_tool
    async def echo(message: str) -> str:
        """Echo back a message."""
        return f"Echo: {message}"

    test_agent = Agent(
        name="Test Agent",
        instructions="You are a test agent. Use echo tool when asked to repeat.",
        tools=[echo],
    )

    # Define test cases
    test_cases = [
        AgentTestCase(
            name="Basic greeting",
            input_message="Hello",
            expected_output=None,
        ),
        AgentTestCase(
            name="Tool invocation",
            input_message="Please repeat: Hello World",
            expected_tool_calls=["echo"],
        ),
    ]

    # Run tests
    tester = AgentTester(test_agent)
    results = await tester.run_tests(test_cases)

    # Print results
    for result in results:
        status = "PASS" if result.passed else "FAIL"
        print(f"[{status}] {result.test_name} ({result.duration_ms:.1f}ms)")
        if not result.passed and result.error:
            print(f"  Error: {result.error}")

    # Print summary
    summary = tester.summary()
    print("\n" + "=" * 50)
    print(f"Results: {summary['passed']}/{summary['total']} passed")
    print(f"Pass rate: {summary['pass_rate']:.1f}%")
    print(f"Total time: {summary['total_time_ms']:.1f}ms")


if __name__ == "__main__":
    asyncio.run(run_test_suite())
