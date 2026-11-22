import json
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
from fastapi.testclient import TestClient

from app.main import app


class TestGatewayStreaming(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("app.middleware.auth.verify_token_string")
    @patch("httpx.AsyncClient.send")
    def test_stream_proxy_forwards_sse_stream(self, mock_send, mock_verify_token):
        # 1. Mock Auth
        mock_verify_token.return_value = {
            "sub": "user-uuid-123",
            "scope": "openid profile",
        }

        # 2. Mock upstream response from AI service
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = httpx.Headers({"content-type": "text/event-stream"})

        sample_chunks = [
            b'data: {"run_id": "r1", "type": "agent_start", "agent": "ArchitectureGenerator"}\n\n',
            b'data: {"run_id": "r1", "type": "final", "agent": "JSONPackager"}\n\n',
        ]

        async def fake_aiter_raw():
            for chunk in sample_chunks:
                yield chunk

        mock_response.aiter_raw = fake_aiter_raw
        mock_response.aclose = AsyncMock()

        mock_send.return_value = mock_response

        # 3. Send request through API Gateway
        response = self.client.post(
            "/api/ai/generate-architecture/stream",
            json={"user_idea": "E-commerce platform"},
            headers={"Authorization": "Bearer mock-token"},
        )

        # 4. Assertions on Gateway response
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/event-stream", response.headers["content-type"])
        self.assertEqual(response.headers.get("x-accel-buffering"), "no")
        self.assertEqual(response.headers.get("cache-control"), "no-cache")

        body = response.text
        self.assertIn("agent_start", body)
        self.assertIn("JSONPackager", body)

    @patch("app.middleware.auth.verify_token_string")
    @patch("httpx.AsyncClient.send")
    def test_stream_proxy_forwards_400_error(self, mock_send, mock_verify_token):
        mock_verify_token.return_value = {"sub": "user-uuid-123"}

        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 400
        mock_response.headers = httpx.Headers({"content-type": "application/json"})
        mock_response.aread = AsyncMock(return_value=b'{"detail": "requirement is required"}')
        mock_response.aclose = AsyncMock()

        mock_send.return_value = mock_response

        response = self.client.post(
            "/api/ai/generate-architecture/stream",
            json={"user_idea": ""},
            headers={"Authorization": "Bearer mock-token"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "requirement is required"})

    @patch("app.middleware.auth.verify_token_string")
    @patch("httpx.AsyncClient.send")
    def test_wildcard_proxy_streams_when_content_type_is_event_stream(
        self, mock_send, mock_verify_token
    ):
        mock_verify_token.return_value = {"sub": "user-uuid-123"}

        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = httpx.Headers({"content-type": "text/event-stream"})

        async def fake_aiter():
            yield b'data: {"status": "ok"}\n\n'

        mock_response.aiter_raw = fake_aiter
        mock_response.aclose = AsyncMock()

        mock_send.return_value = mock_response

        # Request via generic wildcard proxy
        response = self.client.post(
            "/api/ai/custom-stream-node",
            json={},
            headers={"Authorization": "Bearer mock-token"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/event-stream", response.headers["content-type"])
        self.assertIn('data: {"status": "ok"}', response.text)
