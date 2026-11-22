import json
import logging
import os
from typing import Any

from dotenv import load_dotenv
from google.adk import Context, Workflow
from google.adk.agents import Agent
from google.adk.events import Event
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.schemas.architecture import ArchitectureData, ValidationVerdict
from app.utils.uuid import generate_uuid

logger = logging.getLogger(__name__)

# ── env/config ───────────────────────────────────────────────────────────────
load_dotenv()

MODEL = os.getenv("MODEL", "gemini-2.5-flash")

# B1: Maximum allowed retries per validator stage before forcing progress
MAX_GENERATION_RETRIES = 2

# ── 1. Phase One: Architecture At Large ──────────────────────────────────────
architect = Agent(
    name="ArchitectureGenerator",
    model=MODEL,
    description="Generates a detailed architecture at large for a given requirement",
    instruction="""
    You are an experienced software architect. Propose a detailed architecture at large based on the user's requirements.
    Focus on the key components, their interactions, and the rationale behind your choices.
    Use the following outline: 
     - Core components and their responsibilities
     - Data flow between components
     - Choices and rationale
    """,
    output_key="architecture_outline",
)

at_large_validator = Agent(
    name="ArchitectureAtLargeValidator",
    model=MODEL,
    description="Validates the proposed macro architecture against scalability, security, and feasibility criteria.",
    instruction="""
    You are a senior software architect reviewing a proposed architecture outline.
    Evaluate the architecture in state `architecture_outline` for architectural feasibility, scalability, security, and valid design rationale.
    
    You MUST return a structured evaluation conforming to the output schema:
    - verdict: "ok" if it meets production architectural standards, or "retry" if critical flaws or omissions exist.
    - issues: list of specific actionable issues or missing pieces (must be an empty list if verdict is "ok").
    - score: integer score from 0 to 10 (where 7 or higher is passing/ok).
    """,
    output_schema=ValidationVerdict,
    output_key="at_large_validation_result",
)

# ── 2. Phase Two: Architecture At Small ──────────────────────────────────────
architecture_at_small_generator = Agent(
    name="ArchitectureAtSmallGenerator",
    model=MODEL,
    description="Generates detailed technical specifications from an approved architecture outline",
    instruction="""
    Generate a detailed technical architecture description based on the approved outline in `architecture_outline`.
    - Cover the core components, their interactions, and the rationale behind design choices.
    - Focus on the internal technical design, subsystem breakdown, and communication patterns.
    """,
    output_key="architecture_at_small",
)

at_small_validator = Agent(
    name="ArchitectureAtSmallValidator",
    model=MODEL,
    description="Validates detailed technical specifications for soundness, security, and scalability.",
    instruction="""
    You are a senior technical architect reviewing detailed technical specifications.
    Evaluate `architecture_at_small` for architectural feasibility, security, scalability, and technical soundness.
    
    You MUST return a structured evaluation conforming to the output schema:
    - verdict: "ok" if it is technically sound and ready for implementation, or "retry" if critical fixes are needed.
    - issues: list of specific actionable fixes or omissions (must be an empty list if verdict is "ok").
    - score: integer score from 0 to 10 (where 7 or higher is passing/ok).
    """,
    output_schema=ValidationVerdict,
    output_key="at_small_validation_result",
)

# ── 3. Phase Three: The Specialists ──────────────────────────────────────────
tech_stack_agent = Agent(
    name="TechStackSelector",
    model=MODEL,
    description="Selects an optimal technology stack tailored to the architecture specifications.",
    instruction="""You are a Principal Software Architect. 
    Review the original user requirement and the architecture in state (`architecture_outline` and `architecture_at_small`). 
    Select a technology stack that is explicitly tailored to that specific product domain.
    
    For example:
    - If it's a gaming forum, focus on web/community features (e.g., Next.js, Node/Go, Postgres for relational threads, Redis for caching/sessions).
    - Avoid high-throughput stream-processing infrastructure (like Kafka or Flink) unless the user explicitly requested big-data stream computing.
    
    Categorize technologies by layer (Frontend, Backend, Database, Infrastructure, DevOps, Messaging).
    Provide a clear, structured list of the chosen technologies with a brief 1-sentence justification for each.""",
    output_key="tech_stack_selection",
)

mermaid_agent = Agent(
    name="MermaidArchitect",
    model=MODEL,
    description="Generates a Mermaid.js flowchart mapping out the system architecture and data flow.",
    instruction="""You are a System Designer. 
    Review the architecture in `architecture_outline`, `architecture_at_small`, and the chosen stack in `tech_stack_selection`.
    Generate a Mermaid.js flowchart (starting with flowchart TD or graph TD) mapping out the system architecture and data flow. 
    Return ONLY valid Mermaid syntax enclosed in a markdown ```mermaid code block.""",
    output_key="mermaid_diagram",
)

repo_structure_agent = Agent(
    name="RepoBuilder",
    model=MODEL,
    description="Generates an exhaustive repository file tree structure.",
    instruction="""You are a Lead Developer setting up a new project. 
    Based on the established tech stack in `tech_stack_selection` and detailed architecture in `architecture_at_small`, generate a complete and standard repository file tree structure using ASCII/markdown format.""",
    output_key="repo_structure",
)

json_packager_agent = Agent(
    name="JSONPackager",
    model=MODEL,
    description="Synthesizes all specialist outputs into a structured ArchitectureData payload.",
    instruction="""You are an API Response Formatter. 
    Synthesize all architectural specifications from the session state into a structured ArchitectureData payload conforming to the output schema.
    
    Explicitly map data from the session state keys:
    1. Title: Generate a concise, professional title for this project.
    2. Architecture Overview: Extract comprehensive macro overview text from `architecture_outline`.
    3. Micro Sections: Summarize the subsystems and components from `architecture_at_small` into micro sections with title and body.
    4. Tech Stack: Parse the chosen technologies from `tech_stack_selection` into tech stack items with name, layer (Frontend|Backend|Database|Infrastructure|DevOps|Messaging), role, and justification.
    5. Mermaid Code: Extract raw Mermaid syntax from `mermaid_diagram`. Strip any enclosing ``` or ```mermaid markdown code blocks — return raw Mermaid syntax ONLY.
    6. Repository Structure: Parse the tree from `repo_structure` into hierarchical repo nodes (name, type: "directory"|"file", annotation, children).
    
    CRITICAL RULES:
    1. Return data strictly conforming to the ArchitectureData schema.
    2. EXHAUSTIVE MAPPING: You are strictly forbidden from compressing, summarizing, or truncating the `repo` hierarchy. Map every single directory and file generated by RepoBuilder. Leave no items behind.
    3. Mermaid code must be valid raw Mermaid syntax without markdown formatting.
    """,
    output_schema=ArchitectureData,
    output_key="final_architecture",
)


# ── 4. Edge Condition & Routing Functions ─────────────────────────────────────
def _parse_validation_verdict(val: Any) -> tuple[str, list[str], int]:
    """Extracts verdict ('ok'|'retry'), issues list, and score safely."""
    if isinstance(val, ValidationVerdict):
        return val.verdict, val.issues, val.score

    if isinstance(val, dict):
        verdict = str(val.get("verdict", "ok")).strip().lower()
        path = "retry" if verdict == "retry" else "ok"
        issues = val.get("issues", [])
        if not isinstance(issues, list):
            issues = [str(issues)]
        score = int(val.get("score", 10))
        return path, issues, score

    # Fallback parsing for text / unexpected types
    text = str(val or "").strip().lower()
    path = "retry" if "retry" in text else "ok"
    return path, [text] if path == "retry" else [], 5


def route_at_large(
    ctx: Context,
    at_large_validation_result: Any,
    architecture_outline: str,
) -> Event:
    """B1 & B2: Structured routing with bounded retries for Architecture At Large."""
    path, issues, score = _parse_validation_verdict(at_large_validation_result)
    retries = ctx.state.get("at_large_retry_count", 0)

    # B1: Unbounded retry protection — force 'ok' after MAX_GENERATION_RETRIES
    if path == "retry" and retries >= MAX_GENERATION_RETRIES:
        warning_msg = (
            f"ArchitectureAtLargeValidator requested retry, but max retries ({MAX_GENERATION_RETRIES}) reached. "
            f"Forcing 'ok'. Unresolved issues: {', '.join(issues) if issues else 'None specified'}."
        )
        logger.warning(warning_msg)
        ctx.state["at_large_warning"] = warning_msg
        path = "ok"

    if path == "ok":
        next_prompt = (
            f"Validation passed (score: {score}/10). "
            f"Generate the detailed Architecture At Small based on this approved outline:\n\n{architecture_outline}"
        )
        return Event(route="ok", output=next_prompt)
    else:
        ctx.state["at_large_retry_count"] = retries + 1
        issue_lines = "\n- ".join(issues) if issues else "General revisions needed."
        retry_prompt = (
            f"Validation failed (score: {score}/10, attempt {retries + 1}/{MAX_GENERATION_RETRIES}). "
            f"Please revise the architecture to address the following feedback:\n- {issue_lines}"
        )
        return Event(route="retry", output=retry_prompt)


def route_at_small(
    ctx: Context,
    at_small_validation_result: Any,
    architecture_at_small: str,
) -> Event:
    """B1 & B2: Structured routing with bounded retries for Architecture At Small."""
    path, issues, score = _parse_validation_verdict(at_small_validation_result)
    retries = ctx.state.get("at_small_retry_count", 0)

    if path == "retry" and retries >= MAX_GENERATION_RETRIES:
        warning_msg = (
            f"ArchitectureAtSmallValidator requested retry, but max retries ({MAX_GENERATION_RETRIES}) reached. "
            f"Forcing 'ok'. Unresolved issues: {', '.join(issues) if issues else 'None specified'}."
        )
        logger.warning(warning_msg)
        ctx.state["at_small_warning"] = warning_msg
        path = "ok"

    if path == "ok":
        next_prompt = (
            f"Validation passed (score: {score}/10). "
            f"Recommend the exact Technology Stack for this architecture:\n\n{architecture_at_small}"
        )
        return Event(route="ok", output=next_prompt)
    else:
        ctx.state["at_small_retry_count"] = retries + 1
        issue_lines = "\n- ".join(issues) if issues else "General revisions needed."
        retry_prompt = (
            f"Validation failed (score: {score}/10, attempt {retries + 1}/{MAX_GENERATION_RETRIES}). "
            f"Please revise the detailed architecture based on this feedback:\n- {issue_lines}"
        )
        return Event(route="retry", output=retry_prompt)


# ── 5. Main Workflow Orchestration ───────────────────────────────────────────
architecture_workflow = Workflow(
    name="EndToEndArchitectureWorkflow",
    edges=[
        # 1. Start the process
        ("START", architect),
        # 2. Architect -> Validator -> Router
        (architect, at_large_validator),
        (at_large_validator, route_at_large),
        # 3. Branching Logic for at large
        (route_at_large, {"retry": architect, "ok": architecture_at_small_generator}),
        # 4. Small Generator -> Small Validator -> Router
        (architecture_at_small_generator, at_small_validator),
        (at_small_validator, route_at_small),
        # 5. Branching Logic for at small
        (
            route_at_small,
            {"retry": architecture_at_small_generator, "ok": tech_stack_agent},
        ),
        # 6. Linear sequence to the finish line
        (tech_stack_agent, mermaid_agent, repo_structure_agent, json_packager_agent),
    ],
)


# ── Execution Block ──────────────────────────────────────────────────────────
def _clean_mermaid_code(code: str) -> str:
    """Strips enclosing markdown code fences from mermaid syntax if present."""
    trimmed = code.strip()
    if trimmed.startswith("```"):
        lines = trimmed.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        return "\n".join(lines).strip()
    return trimmed


async def run_architecture_generator(
    user_requirement: str, user_id: str
) -> str:
    print("Initializing ADK Architecture Generator...")

    # 1. Initialize ADK's native session memory and execution engine
    session_service = InMemorySessionService()
    runner = Runner(
        agent=architecture_workflow,
        app_name="arch_generator",
        session_service=session_service,
    )

    # 2. Create an isolated session for this specific conversation
    session = await session_service.create_session(
        app_name="arch_generator", user_id=user_id
    )

    print(
        "\nAgents are collaborating... (This might take a minute as they loop and validate)"
    )

    # 3. Format the user input natively
    message = types.Content(role="user", parts=[types.Part(text=user_requirement)])
    final_output = ""
    streamed_final_architecture = None
    session_id = session.id

    # 4. Stream the events through the runner
    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=message
    ):
        # Capture final_architecture from state deltas if present
        if hasattr(event, "actions") and event.actions and event.actions.state_delta:
            if "final_architecture" in event.actions.state_delta:
                streamed_final_architecture = event.actions.state_delta[
                    "final_architecture"
                ]

        if hasattr(event, "content") and event.content and event.content.parts:
            for part in event.content.parts:
                if hasattr(part, "text") and part.text:
                    final_output += part.text

    # B3: Read structured output from session state by output_key
    active_session = await session_service.get_session(
        app_name="arch_generator", user_id=user_id, session_id=session_id
    )
    raw_data = None
    if active_session and "final_architecture" in active_session.state:
        raw_data = active_session.state["final_architecture"]
    elif streamed_final_architecture is not None:
        raw_data = streamed_final_architecture

    # Resilient fallback to JSON text parsing only if output_key was missing in state
    if raw_data is None:
        logger.warning(
            "final_architecture not found in session state, attempting fallback extraction"
        )
        start_idx = final_output.find("{")
        end_idx = final_output.rfind("}")
        if start_idx != -1 and end_idx != -1:
            raw_data = json.loads(final_output[start_idx : end_idx + 1])
        else:
            raise ValueError(
                "Core framework error: Failed to extract architecture from agent state."
            )

    # Validate output with ArchitectureData
    if isinstance(raw_data, ArchitectureData):
        arch_model = raw_data
    elif isinstance(raw_data, dict):
        arch_model = ArchitectureData.model_validate(raw_data)
    elif isinstance(raw_data, str):
        arch_model = ArchitectureData.model_validate_json(raw_data)
    else:
        raise ValueError(
            f"Unexpected data type for final_architecture: {type(raw_data)}"
        )

    # Inject deterministic fields
    arch_model.requirements = user_requirement
    arch_model.projectId = str(generate_uuid())
    arch_model.mermaid_code = _clean_mermaid_code(arch_model.mermaid_code)

    return arch_model.model_dump_json(indent=2)
