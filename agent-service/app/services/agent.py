import json
import re
import traceback
import asyncio

from google.adk.runners import InMemoryRunner
from google.adk.agents import Agent, SequentialAgent
from google.adk.tools import google_search
from google.genai import types

import google.generativeai as genai


# Assuming these imports exist in your project structure
from app.config.config import config
from app.data import prompts
from app.utils.agent_utils import list_to_json

# --- 1. Global Initialization (Do this ONCE, not per request) ---
genai.configure(api_key= config.gemini_api_key)

MODEL = "gemini-2.5-flash-lite"
# Define Sub-Agents
prompt_agent = Agent(
    name="Prompt_Engineer_Agent",
    instruction=prompts.PROMPT_ENGINEER_AGENT_PROMPT,
    model=MODEL, 
    output_key="refined_prompt",
)

architect_agent = Agent(
    name="System_Architect_Agent",
    instruction=prompts.MAIN_ARCHITECT_PROMPT,
    model=MODEL, 
    output_key="architecture_design"
)

explainer_agent = Agent(
    name="Architecture_Explainer_Agent",
    instruction=prompts.ARCHITECTURE_AT_SMALL,
    model=MODEL, 
    output_key="explained_architecture"
)

tech_agent = Agent(
    name="Tech_Stack_Suggester_Agent",
    instruction=prompts.TECH_STACK_SUGGESTER_PROMPT,
    model=MODEL, 
    output_key="tech_stack_suggestion",
    tools=[google_search]

)

diagram_agent = Agent(
    name="Diagram_Generator_Agent",
    instruction=prompts.DIAGRAM_PROMPT,
    model=MODEL, 
    output_key="architecture_diagram"
)

STRICT_ROOT_AGENT_PROMPT = """
Task Execution Order:
Step1 → Call Prompt_Engineer_Agent(input=user_prompt) → returns refined_prompt
Step2 → Call System_Architect_Agent(input=refined_prompt) → returns architecture_design
Step3 → Call Architecture_Explainer_Agent(input=architecture_design) → returns explained_architecture
Step4 → Call Tech_Stack_Suggester_Agent(input=explained_architecture) → returns tech_stack_suggestion
Step5 → Call Diagram_Generator_Agent(input=architecture_design) → returns architecture_diagram

FINAL OUTPUT MUST BE A JSON OBJECT:
{
  "main_architecture_design": "...",
  "elaborated_architecture": "...",
  "suggested_tech_stack": "...",
  "diagram_mermaid_js": "..."
}
"""
generation_pipeline_agent = SequentialAgent(
    name="Generation_Pipeline_Agent",
    sub_agents=[
        prompt_agent,
        architect_agent,
        explainer_agent,
        tech_agent,
        diagram_agent
    ],
    description="An agent that runs a series of sub-agents to generate a complete system design.",
)
# Define Root Agent with Tools
root_agent = generation_pipeline_agent


# --- 2. Helper Functions ---

def clean_and_parse_json(text: str) -> dict:
    if not text:
        return {"error": "LLM returned empty response"}

    # Remove markdown fences if present (e.g., ```json ... ```)
    text = re.sub(r"```(\w+)?", "", text).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Fallback: Try to find the first '{' and last '}'
        try:
            s, e = text.find("{"), text.rfind("}")
            if s != -1 and e != -1:
                return json.loads(text[s:e+1])
        except Exception:
            pass
            
    return {"error": "JSON Parse Failed", "raw": text}


# --- 3. Request Handler ---

async def run_agent(user_prompt: str, user_id: str):
    try:
        app_name = config.app_name
        
        # Initialize Runner with the pre-configured global agent
        runner = InMemoryRunner(agent=root_agent, app_name=app_name)

        # Create Session
        newSession = await runner.session_service.create_session(
            user_id=user_id,
            app_name=app_name
        )

        message_content = types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_prompt)]
        )

        print(f"--- Starting Agent Trace for User: {user_id} ---")
        responses = []
        # Execute Event Loop
        async for event in runner.run_async(
            user_id=user_id,
            session_id=newSession.id,
            new_message=message_content
        ):
            # Debug: Print the event type to track progress (Tool calls, etc.)
            # This helps confirm the agent is actually working through the steps.
            # print(f"Event Received: {type(event).__name__}") 

            if event.is_final_response():
                # Check if parts exist and specifically if the first part has text.
                # This avoids the 'non-text parts' warning if the final event is weirdly formatted.
                if event.content and event.content.parts and event.content.parts[0].text:
                    response_text = event.content.parts[0].text
                    responses.append(response_text)
            
            # Check for Errors
            elif event.error_message:
                error_msg = event.error_message
                print(f"Agent Error: {error_msg}")
                return {"error": "Agent execution error", "details": error_msg}

        # If loop finishes without returning
        if responses:
            return responses[1:]
        return {"error": "Agent finished but returned no final response."}

    except Exception as e:
        print("========= ERROR DURING AGENT RUN =========")
        traceback.print_exc()
        return {"error": "Fatal execution failure", "details": str(e)}

