import json
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from app.config.config import config
from app.schemas.chat import ArchitectureData
from app.tools.mermaid import quick_sanity_check, validate_mermaid_syntax
from app.utils.ai import agent, chat_utils


class TestMermaidToolAndChat(unittest.IsolatedAsyncioTestCase):
    # ── 1. Unit Tests for validate_mermaid_syntax ─────────────────────────────

    def test_valid_flowchart(self):
        code = """flowchart TD
    A[Client] --> B[API Gateway]
    B --> C[Auth Service]
    B --> D[Database]
"""
        res = validate_mermaid_syntax(code)
        self.assertTrue(res["valid"])
        self.assertIsNone(res["error"])

    def test_valid_with_markdown_fences(self):
        code = """```mermaid
flowchart LR
    Start --> Stop
```"""
        res = validate_mermaid_syntax(code)
        self.assertTrue(res["valid"])
        self.assertIsNone(res["error"])

    def test_valid_sequence_diagram(self):
        code = """sequenceDiagram
    autonumber
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: I am good thanks!
"""
        res = validate_mermaid_syntax(code)
        self.assertTrue(res["valid"])
        self.assertIsNone(res["error"])

    def test_invalid_syntax_caught_by_mermaidx(self):
        # Broken syntax that cannot parse into valid Mermaid SVG
        code = """flowchart TD
    A --> [broken syntax without closing
"""
        res = validate_mermaid_syntax(code)
        self.assertFalse(res["valid"])
        self.assertIsNotNone(res["error"])

    def test_invalid_header_caught_by_sanity_check(self):
        code = "random text that is not a diagram"
        res = validate_mermaid_syntax(code)
        self.assertFalse(res["valid"])
        self.assertIn("Invalid or missing diagram declaration", res["error"])

    def test_unbalanced_quotes(self):
        code = 'flowchart TD\nA["unbalanced quote] --> B'
        res = validate_mermaid_syntax(code)
        self.assertFalse(res["valid"])
        self.assertIn("Unbalanced double quotes", res["error"])

    def test_empty_or_non_string_input(self):
        self.assertFalse(validate_mermaid_syntax("")["valid"])
        self.assertFalse(validate_mermaid_syntax(None)["valid"])

    # ── 2. Mermaid Architect Agent Wiring ─────────────────────────────────────

    def test_mermaid_agent_has_validation_tool(self):
        self.assertIsNotNone(agent.mermaid_agent.tools)
        self.assertEqual(len(agent.mermaid_agent.tools), 1)
        tool = agent.mermaid_agent.tools[0]
        # In ADK, FunctionTool wraps the function
        func = getattr(tool, "func", None) or getattr(tool, "_func", None) or tool
        self.assertIn("validate_mermaid_syntax", str(func))
        self.assertIn("validate_mermaid_syntax", agent.mermaid_agent.instruction)

    # ── 3. generate_diagram with self-correction loop ─────────────────────────

    async def test_generate_diagram_valid_on_first_try(self):
        context = ArchitectureData(
            title="Test App",
            requirements="Test requirements",
            architecture="Test architecture",
            mermaid_code="flowchart TD\nA-->B",
            micro=[],
            tech_stack=[],
            repo=[],
        )

        valid_mermaid = "flowchart TD\n    Client --> Server\n    Server --> DB"

        mock_resp = MagicMock()
        mock_resp.text = f"```mermaid\n{valid_mermaid}\n```"

        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_resp)

        with patch.object(chat_utils, "client", mock_client):
            result = await chat_utils.generate_diagram(context, "flowchart", "Show flow")
            self.assertEqual(result, valid_mermaid)
            # Only called once because it was valid immediately
            self.assertEqual(mock_client.aio.models.generate_content.call_count, 1)

    async def test_generate_diagram_self_corrects_invalid_syntax(self):
        context = ArchitectureData(
            title="Test App",
            requirements="Test requirements",
            architecture="Test architecture",
            mermaid_code="flowchart TD\nA-->B",
            micro=[],
            tech_stack=[],
            repo=[],
        )

        invalid_mermaid = "flowchart TD\n    Client --> [Unclosed"
        valid_mermaid = "flowchart TD\n    Client --> Server"

        mock_resp_invalid = MagicMock()
        mock_resp_invalid.text = invalid_mermaid

        mock_resp_valid = MagicMock()
        mock_resp_valid.text = valid_mermaid

        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(
            side_effect=[mock_resp_invalid, mock_resp_valid]
        )

        with patch.object(chat_utils, "client", mock_client):
            result = await chat_utils.generate_diagram(context, "flowchart", "Show flow")
            self.assertEqual(result, valid_mermaid)
            self.assertEqual(mock_client.aio.models.generate_content.call_count, 2)
            # Second call must contain repair instructions with the validator error
            second_call_prompt = mock_client.aio.models.generate_content.call_args_list[1].kwargs["contents"]
            self.assertIn("The generated Mermaid diagram contains syntax errors", second_call_prompt)

    async def test_generate_diagram_stops_at_max_retries(self):
        context = ArchitectureData(
            title="Test App",
            requirements="Test requirements",
            architecture="Test architecture",
            mermaid_code="flowchart TD\nA-->B",
            micro=[],
            tech_stack=[],
            repo=[],
        )

        invalid_mermaid = "flowchart TD\n    A --> [Broken"
        mock_resp = MagicMock()
        mock_resp.text = invalid_mermaid

        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_resp)

        with patch.object(chat_utils, "client", mock_client):
            result = await chat_utils.generate_diagram(context, "flowchart", "Show flow")
            self.assertEqual(result, invalid_mermaid)
            # 1 initial call + 3 retry attempts = 4 total calls
            self.assertEqual(mock_client.aio.models.generate_content.call_count, 4)

    # ── 4. get_chat_response auto-correction ──────────────────────────────────

    async def test_chat_response_fixes_embedded_broken_mermaid(self):
        arch_data = json.dumps({
            "title": "Test",
            "requirements": "reqs",
            "architecture": "arch",
            "mermaid_code": "flowchart TD\nA-->B",
            "micro": [],
            "tech_stack": [],
            "repo": [],
        })

        with patch("app.utils.ai.chat_utils.get_redis_client") as mock_get_redis:
            mock_redis = AsyncMock()
            mock_redis.get.return_value = arch_data
            mock_redis.lrange.return_value = []
            mock_pipe = AsyncMock()
            mock_pipe_ctx = MagicMock()
            mock_pipe_ctx.__aenter__ = AsyncMock(return_value=mock_pipe)
            mock_pipe_ctx.__aexit__ = AsyncMock(return_value=None)
            mock_redis.pipeline = MagicMock(return_value=mock_pipe_ctx)
            mock_get_redis.return_value = mock_redis

            mock_chat = AsyncMock()
            # Initial answer with broken diagram
            initial_msg = MagicMock()
            initial_msg.text = "Here is the diagram:\n```mermaid\nflowchart TD\n    A --> [broken\n```"

            # Repaired response
            repaired_msg = MagicMock()
            repaired_msg.text = "```mermaid\nflowchart TD\n    A --> B\n```"

            mock_chat.send_message.side_effect = [initial_msg, repaired_msg]

            mock_client = MagicMock()
            mock_client.aio.chats.create = MagicMock(return_value=mock_chat)

            with patch.object(chat_utils, "client", mock_client):
                reply = await chat_utils.get_chat_response("user-1", "sess-1", "Give me a diagram")
                self.assertIn("flowchart TD\n    A --> B", reply)
                self.assertNotIn("[broken", reply)
                self.assertEqual(mock_chat.send_message.call_count, 2)


    # ── 5. Rate Limit Resilience & PacedGemini Tests ─────────────────────────

    def test_paced_gemini_and_retry_config(self):
        # 1. Model retry options must be configured with >= 5 attempts and include 429
        retry_opts = agent.gemini_model.retry_options
        self.assertIsNotNone(retry_opts)
        self.assertGreaterEqual(retry_opts.attempts, 5)
        self.assertIn(429, retry_opts.http_status_codes)
        self.assertGreaterEqual(retry_opts.initial_delay, 1.0)

        # 2. All 8 ADK agents must be wired to use the resilient gemini_model
        all_agents = [
            agent.architect,
            agent.at_large_validator,
            agent.architecture_at_small_generator,
            agent.at_small_validator,
            agent.tech_stack_agent,
            agent.mermaid_agent,
            agent.repo_structure_agent,
            agent.json_packager_agent,
        ]
        for ag in all_agents:
            self.assertEqual(ag.model, agent.gemini_model)

    async def test_paced_gemini_pacing_delay(self):
        import time
        from unittest.mock import AsyncMock

        paced = agent.PacedGemini(
            model="gemini-2.5-flash",
            pacing_delay=0.1,
        )

        mock_req = MagicMock()

        # Mock super().generate_content_async using an async generator
        async def mock_gen(req, stream=False):
            yield MagicMock()

        with patch.object(agent.Gemini, "generate_content_async", side_effect=mock_gen):
            # First call
            t0 = time.monotonic()
            async for _ in paced.generate_content_async(mock_req):
                pass

            # Second call should be delayed by at least 0.1s
            async for _ in paced.generate_content_async(mock_req):
                pass
            elapsed = time.monotonic() - t0
            self.assertGreaterEqual(elapsed, 0.08)

    def test_chat_utils_retry_options_configured(self):
        self.assertIsNotNone(chat_utils.RATE_LIMIT_RETRY_OPTIONS)
        self.assertGreaterEqual(chat_utils.RATE_LIMIT_RETRY_OPTIONS.attempts, 5)
        self.assertIn(429, chat_utils.RATE_LIMIT_RETRY_OPTIONS.http_status_codes)
        self.assertEqual(
            chat_utils.RATE_LIMIT_RETRY_OPTIONS, config.rate_limit_retry_options
        )
        self.assertEqual(
            agent.gemini_model.retry_options, config.rate_limit_retry_options
        )


if __name__ == "__main__":
    unittest.main()
