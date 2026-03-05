# Voice and Realtime Patterns

## Contents
- Voice Pipeline Basics
- Realtime Agents
- Audio Streaming
- Voice-Specific Guardrails
- Interruption Handling
- SIP Integration

## Voice Pipeline Basics

Build voice-enabled agents:

```python
import asyncio
import numpy as np
from agents import Agent, function_tool
from agents.voice import (
    AudioInput,
    StreamedAudioInput,
    SingleAgentVoiceWorkflow,
    VoicePipeline,
)
from agents.extensions.handoff_prompt import prompt_with_handoff_instructions


# Define tools for voice agent
@function_tool
def get_weather(city: str) -> str:
    """Get weather for a city.

    Args:
        city: Name of the city
    """
    return f"The weather in {city} is sunny and 72 degrees."


@function_tool
def set_reminder(message: str, minutes: int) -> str:
    """Set a reminder.

    Args:
        message: Reminder message
        minutes: Minutes from now
    """
    return f"Reminder set: '{message}' in {minutes} minutes."


# Create voice-optimized agent
voice_agent = Agent(
    name="Voice Assistant",
    instructions=prompt_with_handoff_instructions("""
    You are a voice assistant. Keep responses brief and conversational.

    Guidelines for voice:
    - Use short sentences
    - Avoid complex formatting (no bullets, no numbered lists)
    - Spell out numbers when appropriate
    - Use natural speech patterns
    - Confirm actions verbally
    """),
    model="gpt-5.2",
    tools=[get_weather, set_reminder],
)


async def run_voice_pipeline():
    """Run a basic voice pipeline."""
    # Create pipeline
    pipeline = VoicePipeline(
        workflow=SingleAgentVoiceWorkflow(voice_agent)
    )

    # Create audio input (16-bit PCM, 24kHz)
    # In practice, this comes from a microphone
    audio_buffer = np.zeros(24000 * 3, dtype=np.int16)  # 3 seconds
    audio_input = AudioInput(buffer=audio_buffer)

    # Run pipeline
    result = await pipeline.run(audio_input)

    # Stream output audio
    async for event in result.stream():
        if event.type == "voice_stream_event_audio":
            # event.data contains audio samples
            yield event.data


async def run_streaming_voice():
    """Run voice pipeline with streaming input."""
    pipeline = VoicePipeline(
        workflow=SingleAgentVoiceWorkflow(voice_agent)
    )

    # Streaming audio input
    streamed_input = StreamedAudioInput()

    # Start pipeline
    result = await pipeline.run(streamed_input)

    # Simulate streaming audio in
    async def feed_audio():
        for _ in range(10):  # 10 chunks
            chunk = np.zeros(2400, dtype=np.int16)  # 100ms chunks
            await streamed_input.add_audio(chunk)
            await asyncio.sleep(0.1)
        await streamed_input.add_audio(None)  # Signal end

    # Run feeding and processing concurrently
    await asyncio.gather(
        feed_audio(),
        process_output(result),
    )


async def process_output(result):
    """Process streaming output."""
    async for event in result.stream():
        if event.type == "voice_stream_event_audio":
            # Play or forward audio
            pass
        elif event.type == "voice_stream_event_lifecycle":
            print(f"Lifecycle event: {event.event}")
```

## Realtime Agents

Build realtime conversational agents:

```python
import asyncio
from agents.realtime import RealtimeAgent, RealtimeRunner, realtime_handoff
from agents import function_tool


@function_tool
def lookup_account(account_id: str) -> dict:
    """Look up customer account.

    Args:
        account_id: Customer account ID
    """
    return {
        "account_id": account_id,
        "name": "John Doe",
        "balance": 1500.00,
        "status": "active",
    }


@function_tool
def transfer_to_human() -> str:
    """Transfer call to human agent."""
    return "Transferring you to a human agent now."


# Specialized agents
billing_agent = RealtimeAgent(
    name="Billing Support",
    instructions="""You specialize in billing inquiries.
    Help with account balances, payment methods, and billing questions.
    Be concise - this is a voice conversation.""",
    tools=[lookup_account],
)

tech_agent = RealtimeAgent(
    name="Technical Support",
    instructions="""You handle technical issues.
    Help with troubleshooting, connectivity, and technical problems.
    Keep explanations simple for voice.""",
)

# Main agent with handoffs
main_agent = RealtimeAgent(
    name="Customer Service",
    instructions="""You are the main customer service agent.
    Greet callers warmly and understand their needs.

    For billing questions, hand off to Billing Support.
    For technical issues, hand off to Technical Support.
    If they want a human, use the transfer tool.""",
    handoffs=[
        realtime_handoff(billing_agent, tool_description="Transfer to billing support"),
        realtime_handoff(tech_agent, tool_description="Transfer to technical support"),
    ],
    tools=[transfer_to_human],
)


async def run_realtime_session():
    """Run a realtime voice session."""
    runner = RealtimeRunner(
        starting_agent=main_agent,
        config={
            "model_settings": {
                "model_name": "gpt-realtime",
                "voice": "ash",  # ash, ballad, coral, sage, verse
                "modalities": ["audio"],
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "gpt-4o-mini-transcribe"
                },
                "turn_detection": {
                    "type": "semantic_vad",
                    "interrupt_response": True,
                },
            }
        },
    )

    # Start session
    session = await runner.run()

    async with session:
        print("Session started!")

        async for event in session:
            await handle_realtime_event(event)


async def handle_realtime_event(event):
    """Handle realtime session events."""
    match event.type:
        case "agent_start":
            print(f"Agent started: {event.agent.name}")

        case "agent_end":
            print(f"Agent ended: {event.agent.name}")

        case "handoff":
            print(f"Handoff: {event.from_agent.name} -> {event.to_agent.name}")

        case "tool_start":
            print(f"Tool invoked: {event.tool.name}")

        case "tool_end":
            print(f"Tool completed: {event.tool.name}")

        case "audio":
            # Audio data to play
            # event.data contains PCM16 audio samples
            pass

        case "audio_end":
            print("Audio response complete")

        case "audio_interrupted":
            print("User interrupted - stop playback")

        case "error":
            print(f"Error: {event.error}")

        case "history_updated":
            # Conversation history updated
            pass
```

## Audio Streaming

Handle audio streaming efficiently:

```python
import asyncio
import numpy as np
from collections import deque
from typing import AsyncIterator


class AudioBuffer:
    """Buffer for audio streaming with jitter handling."""

    def __init__(
        self,
        sample_rate: int = 24000,
        buffer_duration_ms: int = 200,
    ):
        self.sample_rate = sample_rate
        self.buffer_size = int(sample_rate * buffer_duration_ms / 1000)
        self._buffer: deque[np.ndarray] = deque()
        self._lock = asyncio.Lock()

    async def add(self, audio: np.ndarray) -> None:
        """Add audio to buffer."""
        async with self._lock:
            self._buffer.append(audio)

    async def get(self, num_samples: int) -> np.ndarray | None:
        """Get audio from buffer."""
        async with self._lock:
            if not self._buffer:
                return None

            # Collect enough samples
            collected = []
            remaining = num_samples

            while remaining > 0 and self._buffer:
                chunk = self._buffer[0]
                if len(chunk) <= remaining:
                    collected.append(self._buffer.popleft())
                    remaining -= len(chunk)
                else:
                    # Split chunk
                    collected.append(chunk[:remaining])
                    self._buffer[0] = chunk[remaining:]
                    remaining = 0

            if collected:
                return np.concatenate(collected)
            return None

    @property
    def buffered_samples(self) -> int:
        """Number of samples currently buffered."""
        return sum(len(chunk) for chunk in self._buffer)


class AudioPlayer:
    """Play audio with buffering and interruption support."""

    def __init__(self, sample_rate: int = 24000):
        self.sample_rate = sample_rate
        self._buffer = AudioBuffer(sample_rate)
        self._playing = False
        self._interrupted = False

    async def start(self):
        """Start playback."""
        self._playing = True
        self._interrupted = False

    async def stop(self):
        """Stop playback gracefully."""
        self._playing = False

    async def interrupt(self):
        """Interrupt playback immediately."""
        self._interrupted = True
        self._playing = False
        # Clear buffer
        self._buffer._buffer.clear()

    async def add_audio(self, audio: np.ndarray):
        """Add audio to playback queue."""
        if not self._interrupted:
            await self._buffer.add(audio)

    async def playback_loop(self) -> AsyncIterator[np.ndarray]:
        """Yield audio chunks for playback."""
        chunk_size = int(self.sample_rate * 0.02)  # 20ms chunks

        while self._playing:
            chunk = await self._buffer.get(chunk_size)
            if chunk is not None:
                yield chunk
            else:
                await asyncio.sleep(0.01)  # Wait for more audio


class VoiceSessionManager:
    """Manage voice session state."""

    def __init__(self):
        self._active_sessions: dict[str, dict] = {}

    async def create_session(self, session_id: str) -> dict:
        """Create a new voice session."""
        session = {
            "id": session_id,
            "created_at": asyncio.get_event_loop().time(),
            "player": AudioPlayer(),
            "state": "idle",
            "current_agent": None,
        }
        self._active_sessions[session_id] = session
        return session

    async def get_session(self, session_id: str) -> dict | None:
        """Get an active session."""
        return self._active_sessions.get(session_id)

    async def end_session(self, session_id: str):
        """End a voice session."""
        session = self._active_sessions.pop(session_id, None)
        if session:
            await session["player"].stop()
```

## Voice-Specific Guardrails

Guardrails optimized for voice:

```python
from agents.guardrail import GuardrailFunctionOutput, OutputGuardrail
from agents.realtime import RealtimeAgent


def voice_content_filter(context, agent, output) -> GuardrailFunctionOutput:
    """Filter inappropriate content from voice output.

    Note: Voice guardrails are debounced and run periodically,
    not on every audio chunk.
    """
    text = str(output).lower()

    # Check for sensitive topics
    sensitive_keywords = ["password", "credit card", "social security"]
    for keyword in sensitive_keywords:
        if keyword in text:
            return GuardrailFunctionOutput(
                tripwire_triggered=True,
                output_info={"reason": f"Contains sensitive term: {keyword}"},
            )

    return GuardrailFunctionOutput(
        tripwire_triggered=False,
        output_info=None,
    )


def voice_length_filter(context, agent, output) -> GuardrailFunctionOutput:
    """Ensure voice responses aren't too long."""
    text = str(output)
    word_count = len(text.split())

    # Voice responses should be concise
    if word_count > 100:
        return GuardrailFunctionOutput(
            tripwire_triggered=True,
            output_info={"reason": "Response too long for voice"},
        )

    return GuardrailFunctionOutput(
        tripwire_triggered=False,
        output_info=None,
    )


# Create agent with voice guardrails
voice_agent_with_guardrails = RealtimeAgent(
    name="Safe Voice Assistant",
    instructions="You are a helpful voice assistant. Keep responses brief.",
    output_guardrails=[
        OutputGuardrail(guardrail_function=voice_content_filter),
        OutputGuardrail(guardrail_function=voice_length_filter),
    ],
)
```

## Interruption Handling

Handle user interruptions gracefully:

```python
import asyncio
from dataclasses import dataclass
from enum import Enum


class InterruptionState(Enum):
    LISTENING = "listening"
    SPEAKING = "speaking"
    PROCESSING = "processing"
    INTERRUPTED = "interrupted"


@dataclass
class ConversationTurn:
    """Track a single turn in the conversation."""
    user_input: str | None = None
    agent_response: str | None = None
    was_interrupted: bool = False
    audio_played_percent: float = 0.0


class InterruptionHandler:
    """Handle interruptions in voice conversations."""

    def __init__(self):
        self._state = InterruptionState.LISTENING
        self._current_turn = ConversationTurn()
        self._pending_audio: list[bytes] = []
        self._audio_played = 0
        self._total_audio = 0

    async def on_user_speech_start(self):
        """Called when user starts speaking."""
        if self._state == InterruptionState.SPEAKING:
            # User interrupted agent
            await self._handle_interruption()

        self._state = InterruptionState.LISTENING

    async def on_user_speech_end(self, transcription: str):
        """Called when user stops speaking."""
        self._current_turn.user_input = transcription
        self._state = InterruptionState.PROCESSING

    async def on_agent_response_start(self):
        """Called when agent starts responding."""
        self._state = InterruptionState.SPEAKING
        self._audio_played = 0
        self._pending_audio.clear()

    async def on_audio_chunk(self, audio: bytes):
        """Track audio playback progress."""
        self._pending_audio.append(audio)
        self._total_audio += len(audio)

    async def on_audio_played(self, audio: bytes):
        """Called when audio chunk is actually played."""
        self._audio_played += len(audio)

    async def on_agent_response_end(self, response: str):
        """Called when agent finishes responding."""
        self._current_turn.agent_response = response

        if self._total_audio > 0:
            self._current_turn.audio_played_percent = (
                self._audio_played / self._total_audio * 100
            )

        # Start new turn
        self._current_turn = ConversationTurn()
        self._state = InterruptionState.LISTENING

    async def _handle_interruption(self):
        """Handle an interruption."""
        self._current_turn.was_interrupted = True

        if self._total_audio > 0:
            self._current_turn.audio_played_percent = (
                self._audio_played / self._total_audio * 100
            )

        self._state = InterruptionState.INTERRUPTED

        # Clear pending audio
        self._pending_audio.clear()

        # Log for analytics
        print(f"Interrupted at {self._current_turn.audio_played_percent:.1f}%")


class SmartVAD:
    """Smart Voice Activity Detection."""

    def __init__(
        self,
        silence_threshold_ms: int = 500,
        energy_threshold: float = 0.01,
    ):
        self.silence_threshold_ms = silence_threshold_ms
        self.energy_threshold = energy_threshold
        self._last_voice_time = 0.0
        self._is_speaking = False

    def process_audio(self, audio: np.ndarray, sample_rate: int = 24000) -> bool:
        """
        Process audio and detect speech.

        Returns True if speech is detected.
        """
        # Calculate energy
        energy = np.sqrt(np.mean(audio.astype(np.float32) ** 2))

        current_time = asyncio.get_event_loop().time()

        if energy > self.energy_threshold:
            self._last_voice_time = current_time
            self._is_speaking = True
            return True

        # Check for silence duration
        silence_duration = (current_time - self._last_voice_time) * 1000
        if silence_duration > self.silence_threshold_ms:
            self._is_speaking = False

        return self._is_speaking
```

## SIP Integration

Integrate with phone systems via SIP:

```python
from agents.realtime import RealtimeAgent, RealtimeRunner
from agents.realtime.openai_realtime import OpenAIRealtimeSIPModel


async def handle_incoming_call(call_id: str, caller_info: dict):
    """Handle an incoming SIP call."""

    # Create agent for phone calls
    phone_agent = RealtimeAgent(
        name="Phone Assistant",
        instructions="""You are handling a phone call.
        - Speak clearly and at a moderate pace
        - Use simple language
        - Confirm important information by repeating it
        - If you can't help, offer to transfer to a human""",
    )

    # Create runner with SIP model
    runner = RealtimeRunner(
        starting_agent=phone_agent,
        model=OpenAIRealtimeSIPModel(),
    )

    # Start session with call
    async with await runner.run(
        model_config={
            "call_id": call_id,
            "initial_model_settings": {
                "turn_detection": {
                    "type": "semantic_vad",
                    "interrupt_response": True,
                },
                "voice": "sage",  # Choose appropriate voice
            },
        },
    ) as session:

        print(f"Call connected: {call_id}")

        async for event in session:
            if event.type == "error":
                print(f"Call error: {event.error}")
                break
            elif event.type == "session_end":
                print("Caller hung up")
                break

        print(f"Call ended: {call_id}")


# Webhook handler for incoming calls
async def call_webhook(request: dict):
    """Handle incoming call webhook."""
    call_id = request.get("call_id")
    caller_number = request.get("from")
    called_number = request.get("to")

    # Log call
    print(f"Incoming call from {caller_number} to {called_number}")

    # Handle call
    await handle_incoming_call(
        call_id,
        {
            "from": caller_number,
            "to": called_number,
        },
    )
```
