import asyncio
import json
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient
from google.adk.events import Event
from google.adk.events.event_actions import EventActions
from google.genai import types

from app.main import app
from app.schemas.architecture import ArchitectureData
from app.schemas.stream import ResponseType, StreamEvent
from app.utils.ai import agent


class TestStreamEventSchema(unittest.TestCase):
    def test_stream_event_serialization(self):
        event = StreamEvent(
            run_id="run-456",
            type=ResponseType.START,
            agent="ArchitectureGenerator",
            iteration=0,
            data={"message": "started"},
            timestamp=150.25,
        )

        d = event.to_dict()
        self.assertEqual(d["run_id"], "run-456")
        self.assertEqual(d["type"], "agent_start")
        self.assertEqual(d["agent"], "ArchitectureGenerator")
        self.assertEqual(d["iteration"], 0)
        self.assertEqual(d["data"], {"message": "started"})
        self.assertEqual(d["timestamp"], 150.25)
        self.assertEqual(d["ms"], 150.25)

        # JSON roundtrip
        j_str = event.to_json()
        parsed = json.loads(j_str)
        self.assertEqual(parsed["type"], "agent_start")

        # SSE formatting
        sse_str = event.to_sse()
        self.assertTrue(sse_str.startswith("data: "))
        self.assertTrue(sse_str.endswith("\n\n"))
        self.assertEqual(json.loads(sse_str[6:].strip())["run_id"], "run-456")

    def test_stream_event_string_type_conversion(self):
        event = StreamEvent(
            run_id="run-789",
            type="verdict",
            agent="ArchitectureAtLargeValidator",
            iteration=1,
            data={"verdict": "ok"},
            timestamp=200.0,
        )
        self.assertEqual(event.type, ResponseType.VERDICT)
        self.assertEqual(event.to_dict()["type"], "verdict")


class TestStreamEndpointHTTP(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_missing_auth_header_returns_401(self):
        response = self.client.post(
            "/generate-architecture/stream",
            json={"user_idea": "Build a ride sharing platform"},
        )
        self.assertEqual(response.status_code, 401)
        self.assertIn("Unauthorized", response.text)

    def test_empty_user_idea_returns_400(self):
        response = self.client.post(
            "/generate-architecture/stream",
            json={"user_idea": "   "},
            headers={"x-user-id": "user-123"},
        )
        self.assertEqual(response.status_code, 400)


class TestStreamGeneratorFlow(unittest.IsolatedAsyncioTestCase):
    @patch("app.utils.ai.agent.InMemorySessionService")
    @patch("app.utils.ai.agent.Runner")
    async def test_full_stream_flow_and_events(self, mock_runner_cls, mock_session_service_cls):
        # 1. Setup Session & Runner mocks
        mock_session_service = MagicMock()
        mock_session = MagicMock()
        mock_session.id = "test-session-1"
        mock_session.state = {}

        mock_session_service.create_session = AsyncMock(return_value=mock_session)
        mock_session_service.get_session = AsyncMock(return_value=mock_session)
        mock_session_service_cls.return_value = mock_session_service

        mock_runner = MagicMock()
        mock_runner_cls.return_value = mock_runner

        # 2. Prepare sample ArchitectureData
        sample_arch = ArchitectureData(
            title="Distributed Food Delivery",
            architecture="Macro overview architecture",
            mermaid_code="graph TD\nClient-->API Gateway",
            micro=[],
            tech_stack=[],
            repo=[],
        )

        # 3. Simulate sequence of ADK Events:
        #    a) Generator start + output chunk
        #    b) Validator verdict (retry)
        #    c) Router edge (retry)
        #    d) Generator revised output chunk
        #    e) Validator verdict (ok)
        #    f) Tool call & tool response
        #    g) Final packager output
        fc = types.FunctionCall(
            name="validate_mermaid", args={"code": "graph TD\nClient-->API"}
        )
        fr = types.FunctionResponse(
            name="validate_mermaid", response={"valid": True}
        )

        tool_call_event = Event(
            author="MermaidArchitect",
            content=types.Content(parts=[types.Part(function_call=fc)]),
        )
        tool_resp_event = Event(
            author="MermaidArchitect",
            content=types.Content(parts=[types.Part(function_response=fr)]),
        )

        events_sequence = [
            # Agent start + chunk
            Event(
                author="ArchitectureGenerator",
                content=types.Content(parts=[types.Part(text="Designing the high level components...")]),
            ),
            # Validator verdict: retry
            Event(
                author="ArchitectureAtLargeValidator",
                actions=EventActions(
                    state_delta={
                        "at_large_validation_result": {
                            "verdict": "retry",
                            "issues": ["Missing cache layer"],
                            "score": 5,
                        }
                    }
                ),
            ),
            # Router: retry
            Event(
                author="",
                actions=EventActions(route="retry"),
            ),
            # Generator revising
            Event(
                author="ArchitectureGenerator",
                content=types.Content(parts=[types.Part(text="Adding Redis caching layer...")]),
            ),
            # Validator verdict: ok
            Event(
                author="ArchitectureAtLargeValidator",
                actions=EventActions(
                    state_delta={
                        "at_large_validation_result": {
                            "verdict": "ok",
                            "issues": [],
                            "score": 9,
                        }
                    }
                ),
            ),
            # Tool call & response
            tool_call_event,
            tool_resp_event,
            # Packager completes with final architecture
            Event(
                author="JSONPackager",
                actions=EventActions(state_delta={"final_architecture": sample_arch.model_dump()}),
            ),
        ]

        async def fake_run_async(*args, **kwargs):
            for ev in events_sequence:
                yield ev

        mock_runner.run_async = fake_run_async

        # 4. Consume the stream
        received_events = []
        async for chunk in agent.run_architecture_generator_stream("Build food delivery app", "user-456"):
            for line in chunk.strip().split("\n\n"):
                if line.startswith("data: "):
                    payload = json.loads(line[6:])
                    received_events.append(payload)

        # 5. Assertions on the emitted events
        event_types = [e["type"] for e in received_events]

        # Verify all lifecycle types are emitted
        self.assertIn("agent_start", event_types)
        self.assertIn("agent_output", event_types)
        self.assertIn("verdict", event_types)
        self.assertIn("tool_call", event_types)
        self.assertIn("tool_result", event_types)
        self.assertIn("final", event_types)

        # Check verdict details
        verdicts = [e for e in received_events if e["type"] == "verdict"]
        self.assertEqual(len(verdicts), 2)
        self.assertEqual(verdicts[0]["data"]["verdict"], "retry")
        self.assertEqual(verdicts[0]["data"]["issues"], ["Missing cache layer"])
        self.assertEqual(verdicts[1]["data"]["verdict"], "ok")

        # Check iteration increments on retry
        # After the retry router fired, subsequent events should have iteration >= 1
        final_event = [e for e in received_events if e["type"] == "final"][0]
        self.assertGreaterEqual(final_event["iteration"], 1)
        self.assertEqual(final_event["data"]["title"], "Distributed Food Delivery")
        self.assertEqual(final_event["agent"], "JSONPackager")

    @patch("app.utils.ai.agent.InMemorySessionService")
    @patch("app.utils.ai.agent.Runner")
    async def test_stream_error_handling(self, mock_runner_cls, mock_session_service_cls):
        mock_session_service = MagicMock()
        mock_session_service.create_session = AsyncMock(side_effect=RuntimeError("ADK Engine Failure"))
        mock_session_service_cls.return_value = mock_session_service

        received_events = []
        async for chunk in agent.run_architecture_generator_stream("Build app", "user-456"):
            for line in chunk.strip().split("\n\n"):
                if line.startswith("data: "):
                    received_events.append(json.loads(line[6:]))

        self.assertEqual(len(received_events), 1)
        self.assertEqual(received_events[0]["type"], "error")
        self.assertIn("ADK Engine Failure", received_events[0]["data"]["error"])


class TestStreamEndpointWithClient(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("app.utils.ai.agent.run_architecture_generator_stream")
    def test_stream_endpoint_returns_sse_headers_and_chunks(self, mock_generator_stream):
        sample_event = StreamEvent(
            run_id="run-test",
            type=ResponseType.START,
            agent="ArchitectureGenerator",
            iteration=0,
            data={"message": "Starting"},
            timestamp=50.0,
        )

        async def fake_stream(req, user_id):
            yield sample_event.to_sse()

        mock_generator_stream.side_effect = fake_stream

        response = self.client.post(
            "/generate-architecture/stream",
            json={"user_idea": "Social network app"},
            headers={"x-user-id": "user-abc"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/event-stream", response.headers["content-type"])
        self.assertEqual(response.headers.get("x-accel-buffering"), "no")
        self.assertEqual(response.headers.get("cache-control"), "no-cache")

        body = response.text
        self.assertTrue(body.startswith("data: "))
        parsed = json.loads(body[6:].strip())
        self.assertEqual(parsed["run_id"], "run-test")
        self.assertEqual(parsed["type"], "agent_start")
