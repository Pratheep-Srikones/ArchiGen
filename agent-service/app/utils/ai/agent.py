import os
import asyncio
from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk import Workflow, Context
from google.adk.runners import Runner                          
from google.adk.sessions import InMemorySessionService         
from google.genai import types                                 
from google.adk.events import Event
import json

from app.utils.uuid import generate_uuid
# ── env/config ───────────────────────────────────────────────────────────────
load_dotenv()

MODEL = os.getenv("MODEL", "gemini-2.5-flash")

# ── 1. Phase One: Architecture At Large ──────────────────────────────────────
architect = Agent(
    name="ArchitectureGenerator",
    model=MODEL,
    description="Generates a detailed architecture at large for a given requirement",
    instruction="""
    You are an experienced software architect. Given a requirement, propose a detailed architecture at large. Focus on the key components, their interactions, and the rationale behind your choices.
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
    instruction="""
    You are a senior software architect reviewing a proposed architecture.
    Check the architecture in state `architecture_outline`. If it is a reasonable architecture that supports scalability, security, and has valid rationale behind it, respond exactly "ok".
    Otherwise respond exactly "retry" and list missing pieces.
    """,
    output_key="at_large_validation_result",
)

# ── 2. Phase Two: Architecture At Small ──────────────────────────────────────
architecture_at_small_generator = Agent(
    name="ArchitectureAtSmallGenerator",
    model=MODEL,
    instruction="""
    Generate a detailed technical architecture description based on the outline in `architecture_outline`.
    - Make sure to cover the core components, their interactions, and the rationale behind the design choices.
    - Do not concern with tech stack choices, focus on the technical design and architecture.
    """,
    output_key="architecture_at_small",
)

at_small_validator = Agent(
    name="ArchitectureAtSmallValidator",
    model=MODEL,
    instruction="""
    Check `architecture_at_small` for architectural feasibility, security, scalability, and technical soundness. 
    If passes, respond "ok". Else respond "retry" with the specific fixes.
    """,
    output_key="at_small_validation_result",
)

# ── 3. Phase Three: The Specialists ──────────────────────────────────────────
tech_stack_agent = Agent(
    name="TechStackSelector",
    model=MODEL,
    instruction="""You are a Principal Software Architect. 
    Review the original user requirement stored in the state memory. 
    Select a technology stack that is explicitly tailored to that specific product domain.
    
    For example:
    - If it's a gaming forum, focus on web/community features (e.g., Next.js, Node/Go, Postgres for relational threads, Redis for caching/sessions).
    - Avoid high-throughput stream-processing infrastructure (like Kafka or Flink) unless the user explicitly requested big-data stream computing.
    
    Provide a clear, structured list of the chosen technologies with a brief 1-sentence justification for each."""
)

mermaid_agent = Agent(
    name="MermaidArchitect",
    model=MODEL,
    instruction="""You are a System Designer. 
    Generate a Mermaid.js flowchart mapping out the system architecture and data flow. 
    Return ONLY valid Mermaid syntax enclosed in a markdown ```mermaid code block."""
)

repo_structure_agent = Agent(
    name="RepoBuilder",
    model=MODEL,
    instruction="""You are a Lead Developer setting up a new project. 
    Based on the established tech stack and detailed architecture, generate a complete and standard repository file tree structure using ASCII/markdown format."""
)

json_packager_agent = Agent(
    name="JSONPackager",
    model=MODEL,
    instruction="""You are an API Response Formatter. 
    Review the entire conversation history and session state. Extract and map the generated architecture into a strict JSON payload.
    
    You must map the data exactly to this flat JSON schema structure:
    {
      "projectId": "string (leave empty or use a placeholder)",
      "title": "string (generate a professional project title)",
      "requirements": "string (leave empty or use a placeholder)",
      "architecture": "string (The comprehensive architecture macro overview text)",
      "micro": [
        { "title": "string", "body": "string" }
      ],
      "tech_stack": [
        { 
          "name": "string", 
          "layer": "Frontend|Backend|Database|Infrastructure|DevOps|Messaging", 
          "role": "string", 
          "justification": "string" 
        }
      ],
      "mermaid_code": "string (The raw Mermaid.js syntax ONLY. Strip all markdown code blocks)",
      "repo": [
        { 
          "name": "string", 
          "type": "directory|file", 
          "annotation": "string",
          "children": [] 
        }
      ]
    }
    
    CRITICAL: Return ONLY valid, parseable JSON. Do not include any conversational filler or markdown blocks. Ensure all strings are properly escaped.
    """
)

# ── 4. Edge Condition Functions (Replacing Lambdas) ──────────────────────────
# Defining these as standard functions gives them valid names for Pydantic to read.

def at_large_needs_retry(state):
    return "retry" in state.get("at_large_validation_result", "").lower()

def at_large_is_ok(state):
    return "ok" in state.get("at_large_validation_result", "").lower()

def at_small_needs_retry(state):
    return "retry" in state.get("at_small_validation_result", "").lower()

def at_small_is_ok(state):
    return "ok" in state.get("at_small_validation_result", "").lower()

def route_at_large(at_large_validation_result, architecture_outline) -> Event:
    text = str(at_large_validation_result).lower()
    path = "retry" if "retry" in text else "ok"
    
    if path == "ok":
        # Pass the actual architecture forward to the next agent instead of "ok"!
        next_prompt = f"Validation passed. Generate the detailed Architecture At Small based on this approved outline:\n\n{architecture_outline}"
        return Event(route=path, output=next_prompt)
    else:
        # Pass the critique back to the architect so it can fix it
        retry_prompt = f"Validation failed. Please fix the architecture based on this feedback:\n\n{text}"
        return Event(route=path, output=retry_prompt)

def route_at_small(at_small_validation_result, architecture_at_small) -> Event:
    text = str(at_small_validation_result).lower()
    path = "retry" if "retry" in text else "ok"
    
    if path == "ok":
        next_prompt = f"Validation passed. Recommend the exact Technology Stack for this architecture:\n\n{architecture_at_small}"
        return Event(route=path, output=next_prompt)
    else:
        retry_prompt = f"Validation failed. Please fix the detailed architecture based on this feedback:\n\n{text}"
        return Event(route=path, output=retry_prompt)

# ── 5. Main Workflow Orchestration ───────────────────────────────────────────
architecture_workflow = Workflow(
    name="EndToEndArchitectureWorkflow",
    edges=[
        # 1. Start the process
        ("START", architect),
        
        # 2. Architect -> Validator -> Router
        (architect, at_large_validator),
        (at_large_validator, route_at_large),
        
        # 3. Branching Logic! The dictionary matches the string returned by route_at_large
        (route_at_large, {
            "retry": architect,
            "ok": architecture_at_small_generator
        }),
        
        # 4. Small Generator -> Small Validator -> Router
        (architecture_at_small_generator, at_small_validator),
        (at_small_validator, route_at_small),
        
        # 5. Branching Logic for the small validator
        (route_at_small, {
            "retry": architecture_at_small_generator,
            "ok": tech_stack_agent
        }),
        
        # 6. Linear sequence to the finish line
        # ADK chains these final 3 agents back-to-back automatically
       (tech_stack_agent, mermaid_agent, repo_structure_agent, json_packager_agent)
    ]
)

# ── Execution Block ──────────────────────────────────────────────────────────
async def run_architecture_generator(user_requirement: str, user_id: str, session_id: str=None) -> str:
    print("Initializing ADK Architecture Generator...")
    
    # 1. Initialize ADK's native session memory and execution engine
    session_service = InMemorySessionService()
    runner = Runner(
        agent=architecture_workflow, 
        app_name="arch_generator", 
        session_service=session_service
    )
    
    # 2. Create an isolated session for this specific conversation
    session = await session_service.create_session(
        app_name="arch_generator", 
        user_id=user_id
    )
    
    print("\nAgents are collaborating... (This might take a minute as they loop and validate)")
    
    # 3. Format the user input natively
    message = types.Content(role="user", parts=[types.Part(text=user_requirement)])
    final_output = ""

    if session_id != None:
        session_id = session_id
    else:
        session_id = session.id

    # 4. Stream the events through the runner
    async for event in runner.run_async(
        user_id=user_id, 
        session_id=session_id, 
        new_message=message
    ):
        # We catch the text streams yielded by the agents in the pipeline
        if hasattr(event, 'content') and event.content and event.content.parts:
            for part in event.content.parts:
                if hasattr(part, 'text') and part.text:
                    final_output += part.text

    print("*"*50)
    print("\n\nFinal raw output from the agents:\n", final_output)
    print("*"*50)


    # 1. Find the boundaries of the JSON object in the massive accumulated string
    start_idx = final_output.find('{')
    end_idx = final_output.rfind('}')
    
    if start_idx != -1 and end_idx != -1:
        raw_json = final_output[start_idx:end_idx+1]
        
        try:
            parsed_json = json.loads(raw_json)
            
            # Inject deterministic fields
            parsed_json["requirements"] = user_requirement
            
            # CRITICAL: Wrap generate_uuid() in str() to prevent JSON serialization crashes
            parsed_json["projectId"] = str(generate_uuid())
            
            # Return the valid string
            return json.dumps(parsed_json, indent=2)  
            
        except json.JSONDecodeError as e:
            # DO NOT JUST PRINT! Raise the error so the controller catches it.
            raise ValueError(f"LLM produced invalid JSON: {e}\nRaw output: {raw_json}")
        except Exception as e:
            # Catch TypeError if UUID serialization fails
            raise ValueError(f"Internal processing error: {e}")
    else:
        # DO NOT JUST PRINT! Raise the error!
        raise ValueError("Core framework error: No JSON boundaries found in output.")
