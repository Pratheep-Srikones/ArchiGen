import asyncio
import json
import unittest

from google.adk import Context, Workflow
from google.adk.events import Event
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.schemas.architecture import (
    ArchitectureData,
    MicroSectionSchema,
    RepoNodeSchema,
    TechItemSchema,
    ValidationVerdict,
)
from app.utils.ai.agent import (
    MAX_GENERATION_RETRIES,
    _clean_mermaid_code,
    _parse_validation_verdict,
    architecture_workflow,
    at_large_validator,
    at_small_validator,
    json_packager_agent,
    mermaid_agent,
    repo_structure_agent,
    route_at_large,
    route_at_small,
    run_architecture_generator,
    tech_stack_agent,
)


class DummyContext:
    def __init__(self, state=None):
        self.state = state if state is not None else {}
        self.actions = EventActionsDummy()


class EventActionsDummy:
    def __init__(self):
        self.state_delta = {}


class TestB1B4Fixes(unittest.TestCase):
    def test_b4_specialist_output_keys(self):
        """B4: Specialists must have explicit output_keys and be referenced downstream."""
        self.assertEqual(tech_stack_agent.output_key, "tech_stack_selection")
        self.assertEqual(mermaid_agent.output_key, "mermaid_diagram")
        self.assertEqual(repo_structure_agent.output_key, "repo_structure")
        self.assertEqual(json_packager_agent.output_key, "final_architecture")

        # Downstream packager must explicitly reference the specialist keys
        packager_inst = json_packager_agent.instruction
        self.assertIn("architecture_outline", packager_inst)
        self.assertIn("architecture_at_small", packager_inst)
        self.assertIn("tech_stack_selection", packager_inst)
        self.assertIn("mermaid_diagram", packager_inst)
        self.assertIn("repo_structure", packager_inst)

    def test_b2_validators_have_output_schema(self):
        """B2: Validators must have output_schema set to ValidationVerdict."""
        self.assertEqual(at_large_validator.output_schema, ValidationVerdict)
        self.assertEqual(at_small_validator.output_schema, ValidationVerdict)
        self.assertEqual(at_large_validator.output_key, "at_large_validation_result")
        self.assertEqual(at_small_validator.output_key, "at_small_validation_result")

    def test_b2_structured_verdict_parsing(self):
        """B2: _parse_validation_verdict correctly parses models, dicts, and handles tricky phrases."""
        # Pydantic model
        v_model = ValidationVerdict(
            verdict="retry", issues=["Missing load balancer"], score=6
        )
        path, issues, score = _parse_validation_verdict(v_model)
        self.assertEqual(path, "retry")
        self.assertEqual(issues, ["Missing load balancer"])
        self.assertEqual(score, 6)

        # Dict representation
        v_dict = {"verdict": "ok", "issues": [], "score": 9}
        path, issues, score = _parse_validation_verdict(v_dict)
        self.assertEqual(path, "ok")
        self.assertEqual(issues, [])
        self.assertEqual(score, 9)

        # Tricky string case that would fail old regex/substring checks
        # With structured verdict, verdict="ok" is never confused with "no need to retry"
        v_structured_ok = ValidationVerdict(
            verdict="ok", issues=["No need to retry, looks great"], score=10
        )
        path, _, _ = _parse_validation_verdict(v_structured_ok)
        self.assertEqual(path, "ok")

    def test_b1_bounded_retries_at_large(self):
        """B1: route_at_large must bound retries to MAX_GENERATION_RETRIES and force 'ok'."""
        ctx = DummyContext()
        verdict = ValidationVerdict(
            verdict="retry", issues=["Security layer missing"], score=5
        )

        # Attempt 1
        event1 = route_at_large(ctx, verdict, "Outline v1")
        self.assertEqual(event1.actions.route, "retry")
        self.assertEqual(ctx.state.get("at_large_retry_count"), 1)
        self.assertIn("attempt 1/2", event1.output)
        self.assertIn("Security layer missing", event1.output)

        # Attempt 2
        event2 = route_at_large(ctx, verdict, "Outline v2")
        self.assertEqual(event2.actions.route, "retry")
        self.assertEqual(ctx.state.get("at_large_retry_count"), 2)
        self.assertIn("attempt 2/2", event2.output)

        # Attempt 3: retries reached max -> force 'ok'
        event3 = route_at_large(ctx, verdict, "Outline v3")
        self.assertEqual(event3.actions.route, "ok")
        self.assertIn("at_large_warning", ctx.state)
        self.assertIn("max retries (2) reached", ctx.state["at_large_warning"])

    def test_b1_bounded_retries_at_small(self):
        """B1: route_at_small must bound retries to MAX_GENERATION_RETRIES and force 'ok'."""
        ctx = DummyContext()
        verdict = ValidationVerdict(
            verdict="retry", issues=["Database schema incomplete"], score=4
        )

        # Attempt 1
        event1 = route_at_small(ctx, verdict, "Small v1")
        self.assertEqual(event1.actions.route, "retry")
        self.assertEqual(ctx.state.get("at_small_retry_count"), 1)

        # Attempt 2
        event2 = route_at_small(ctx, verdict, "Small v2")
        self.assertEqual(event2.actions.route, "retry")
        self.assertEqual(ctx.state.get("at_small_retry_count"), 2)

        # Attempt 3: force 'ok'
        event3 = route_at_small(ctx, verdict, "Small v3")
        self.assertEqual(event3.actions.route, "ok")
        self.assertIn("at_small_warning", ctx.state)
        self.assertIn("max retries (2) reached", ctx.state["at_small_warning"])

    def test_b3_packager_has_output_schema(self):
        """B3: json_packager_agent must have ArchitectureData as output_schema."""
        self.assertEqual(json_packager_agent.output_schema, ArchitectureData)

    def test_clean_mermaid_code(self):
        """Helper _clean_mermaid_code cleanly strips markdown blocks."""
        raw = "```mermaid\nflowchart TD\n  A --> B\n```"
        cleaned = _clean_mermaid_code(raw)
        self.assertEqual(cleaned, "flowchart TD\n  A --> B")

        already_clean = "flowchart TD\n  A --> B"
        self.assertEqual(_clean_mermaid_code(already_clean), "flowchart TD\n  A --> B")

    def test_b3_architecture_data_validation(self):
        """B3: ArchitectureData validates and formats JSON correctly with deterministic fields."""
        payload = {
            "title": "E-Commerce System",
            "requirements": "",
            "architecture": "Macro architecture description",
            "mermaid_code": "```mermaid\nflowchart TD\n  A[Frontend] --> B[API]\n```",
            "micro": [{"title": "Auth Service", "body": "Handles JWT authentication"}],
            "tech_stack": [
                {
                    "name": "FastAPI",
                    "layer": "Backend",
                    "role": "API Service",
                    "justification": "High performance async framework",
                }
            ],
            "repo": [
                {
                    "name": "src",
                    "type": "directory",
                    "annotation": "Source root",
                    "children": [
                        {"name": "main.py", "type": "file", "annotation": "Entrypoint"}
                    ],
                }
            ],
        }

        arch = ArchitectureData.model_validate(payload)
        arch.requirements = "Build an e-commerce backend"
        arch.projectId = "test-uuid-1234"
        arch.mermaid_code = _clean_mermaid_code(arch.mermaid_code)

        result_json = arch.model_dump_json(indent=2)
        parsed = json.loads(result_json)

        self.assertEqual(parsed["title"], "E-Commerce System")
        self.assertEqual(parsed["projectId"], "test-uuid-1234")
        self.assertEqual(parsed["requirements"], "Build an e-commerce backend")
        self.assertEqual(parsed["mermaid_code"], "flowchart TD\n  A[Frontend] --> B[API]")
        self.assertEqual(len(parsed["micro"]), 1)
        self.assertEqual(len(parsed["tech_stack"]), 1)
        self.assertEqual(len(parsed["repo"]), 1)
        self.assertEqual(parsed["repo"][0]["children"][0]["name"], "main.py")

    def test_workflow_edges_graph(self):
        """Workflow structure has proper edges."""
        self.assertIsNotNone(architecture_workflow)
        self.assertEqual(len(architecture_workflow.edges), 8)

    def test_b3_session_state_reading_in_runner(self):
        """B3: Runner reads final_architecture directly from InMemorySessionService state."""
        async def run_test():
            session_service = InMemorySessionService()
            user_id = "test-user-b3"
            session = await session_service.create_session(
                app_name="arch_generator", user_id=user_id
            )
            raw_arch = {
                "title": "Cloud Native Architecture",
                "requirements": "",
                "architecture": "High level overview",
                "mermaid_code": "```mermaid\nflowchart LR\n  Client --> Gateway\n```",
                "micro": [{"title": "API Gateway", "body": "Routes requests"}],
                "tech_stack": [
                    {
                        "name": "Go",
                        "layer": "Backend",
                        "role": "Gateway Service",
                        "justification": "Low latency and high concurrency",
                    }
                ],
                "repo": [
                    {
                        "name": "cmd",
                        "type": "directory",
                        "children": [{"name": "server.go", "type": "file"}],
                    }
                ],
            }
            # Simulate packager setting output_key via event state_delta
            event = Event(state={"final_architecture": raw_arch})
            await session_service.append_event(session, event)

            # Test retrieving and processing
            active_session = await session_service.get_session(
                app_name="arch_generator", user_id=user_id, session_id=session.id
            )
            self.assertIn("final_architecture", active_session.state)

            arch_model = ArchitectureData.model_validate(active_session.state["final_architecture"])
            arch_model.requirements = "Real-time payment gateway"
            arch_model.projectId = "test-session-uuid"
            arch_model.mermaid_code = _clean_mermaid_code(arch_model.mermaid_code)

            result_json = arch_model.model_dump_json(indent=2)
            parsed = json.loads(result_json)

            self.assertEqual(parsed["projectId"], "test-session-uuid")
            self.assertEqual(parsed["requirements"], "Real-time payment gateway")
            self.assertEqual(parsed["mermaid_code"], "flowchart LR\n  Client --> Gateway")
            self.assertEqual(parsed["tech_stack"][0]["name"], "Go")

        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main()
