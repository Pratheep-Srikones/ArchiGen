import inspect
import json
import unittest
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException

from app.controllers.architecture_controllers import generate_architecture
from app.controllers.chat_controllers import (
    _resolve_architecture_context,
    create_new_chat,
    generate_diagram,
)
from app.schemas.architecture import ArchitectureData
from app.schemas.chat import GenerateDiagramRequest
from app.utils.ai import agent, chat_utils
from app.utils.auth import get_current_user_id


class TestB5B9Fixes(unittest.IsolatedAsyncioTestCase):
    # ── B5: Auth Tests ────────────────────────────────────────────────────────
    def test_b5_get_current_user_id_enforcement(self):
        """B5: Missing X-User-Id header must raise 401 Unauthorized."""
        with self.assertRaises(HTTPException) as cm:
            get_current_user_id(None)
        self.assertEqual(cm.exception.status_code, 401)
        self.assertEqual(cm.exception.detail, "Unauthorized")

        # When header is present, it returns the user id
        user_id = get_current_user_id("user-uuid-123")
        self.assertEqual(user_id, "user-uuid-123")

    async def test_b5_generate_architecture_requires_user_id(self):
        """B5: generate_architecture controller requires valid user_id."""
        with self.assertRaises(HTTPException) as cm:
            await generate_architecture("Build an API", user_id="")
        self.assertEqual(cm.exception.status_code, 401)

    # ── B6: session_id parameter removal ─────────────────────────────────────
    def test_b6_session_id_removed_from_run_architecture_generator(self):
        """B6: run_architecture_generator must not accept session_id parameter."""
        sig = inspect.signature(agent.run_architecture_generator)
        params = list(sig.parameters.keys())
        self.assertEqual(params, ["user_requirement", "user_id"])
        self.assertNotIn("session_id", params)

    # ── B7: Error handling with HTTPException and run_id ──────────────────────
    async def test_b7_chat_raises_404_when_session_expired(self):
        """B7: get_chat_response raises 404 when architecture key is missing in Redis."""
        with patch("app.utils.ai.chat_utils.get_redis_client") as mock_get_redis:
            mock_redis = AsyncMock()
            mock_redis.get.return_value = None
            mock_get_redis.return_value = mock_redis

            with self.assertRaises(HTTPException) as cm:
                await chat_utils.get_chat_response("user-1", "expired-session", "Hi")

            self.assertEqual(cm.exception.status_code, 404)
            self.assertIn("Session expired or architecture not found", cm.exception.detail)

    async def test_b7_chat_raises_500_with_run_id_on_unhandled_error(self):
        """B7: Unhandled exceptions in chat raise 500 HTTPException with run_id."""
        with patch("app.utils.ai.chat_utils.get_redis_client") as mock_get_redis:
            mock_redis = AsyncMock()
            mock_redis.get.side_effect = RuntimeError("Redis connection dropped")
            mock_get_redis.return_value = mock_redis

            with self.assertRaises(HTTPException) as cm:
                await chat_utils.get_chat_response("user-1", "sess-1", "Hi")

            self.assertEqual(cm.exception.status_code, 500)
            self.assertIn("run_id:", cm.exception.detail)

    async def test_b7_controller_logs_run_id_on_invalid_json(self):
        """B7: generate_architecture raises 502 with run_id when agent returns non-JSON."""
        with patch("app.utils.ai.agent.run_architecture_generator", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = "Non-JSON response from LLM"

            with self.assertRaises(HTTPException) as cm:
                await generate_architecture("Build an API", user_id="user-1")

            self.assertEqual(cm.exception.status_code, 502)
            self.assertIn("run_id:", cm.exception.detail)

    # ── B8: Secure server-side context resolution ─────────────────────────────
    async def test_b8_resolve_context_from_redis_session(self):
        """B8: Resolves architecture from Redis session when session_id is provided."""
        sample_arch = {
            "title": "Redis Cached Architecture",
            "requirements": "Real-time chat",
            "architecture": "Overview",
            "mermaid_code": "graph TD\nA-->B",
            "micro": [],
            "tech_stack": [],
            "repo": [],
        }

        with patch("app.controllers.chat_controllers.get_redis_client") as mock_get_redis:
            mock_redis = AsyncMock()
            mock_redis.get.return_value = json.dumps(sample_arch)
            mock_get_redis.return_value = mock_redis

            req = GenerateDiagramRequest(
                session_id="active-session-123",
                diagram_type="flowchart",
                prompt="Show data flow",
            )
            context = await _resolve_architecture_context(req, "user-1")
            self.assertEqual(context.title, "Redis Cached Architecture")

    async def test_b8_resolve_context_fallback_to_context_when_unsaved(self):
        """B8: Resolves architecture from request.context for temporary previews."""
        sample_arch = ArchitectureData(
            title="Draft Unsaved Architecture",
            requirements="Draft",
            architecture="Draft overview",
            mermaid_code="graph LR\nA-->B",
            micro=[],
            tech_stack=[],
            repo=[],
        )

        with patch("app.controllers.chat_controllers.get_redis_client") as mock_get_redis:
            mock_redis = AsyncMock()
            mock_redis.get.return_value = None
            mock_get_redis.return_value = mock_redis

            req = GenerateDiagramRequest(
                context=sample_arch,
                diagram_type="sequence",
                prompt="Show auth sequence",
            )
            context = await _resolve_architecture_context(req, "user-1")
            self.assertEqual(context.title, "Draft Unsaved Architecture")

    async def test_b8_resolve_context_raises_400_when_no_context_found(self):
        """B8: Raises 400 when no architecture context can be found anywhere."""
        with patch("app.controllers.chat_controllers.get_redis_client") as mock_get_redis:
            mock_redis = AsyncMock()
            mock_redis.get.return_value = None
            mock_get_redis.return_value = mock_redis

            req = GenerateDiagramRequest(
                diagram_type="sequence",
                prompt="Show auth sequence",
            )
            with self.assertRaises(HTTPException) as cm:
                await _resolve_architecture_context(req, "user-1")

            self.assertEqual(cm.exception.status_code, 400)
            self.assertIn("Architecture context could not be resolved", cm.exception.detail)

    # ── B9: Dependencies check ────────────────────────────────────────────────
    def test_b9_trimmed_requirements(self):
        """B9: requirements.txt must not contain deprecated or bloated packages."""
        with open("/code/requirements.txt") as f:
            content = f.read().lower()

        # Deprecated SDK must NOT be present
        self.assertNotIn("google-generativeai", content)

        # Unused bloated cloud packages must NOT be present
        self.assertNotIn("google-cloud-bigquery", content)
        self.assertNotIn("google-cloud-spanner", content)
        self.assertNotIn("google-cloud-bigtable", content)
        self.assertNotIn("google-cloud-speech", content)
        self.assertNotIn("google-cloud-storage", content)
        self.assertNotIn("google-cloud-trace", content)
        self.assertNotIn("sqlalchemy-spanner", content)
        self.assertNotIn("alembic", content)

        # Required packages MUST be present
        self.assertIn("fastapi", content)
        self.assertIn("google-adk", content)
        self.assertIn("google-genai", content)
        self.assertIn("redis", content)
        self.assertIn("uvicorn", content)
        self.assertIn("httpx", content)


if __name__ == "__main__":
    unittest.main()

