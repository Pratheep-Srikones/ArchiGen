from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from google.genai.types import Content, Part
from google.adk.apps.app import App, EventsCompactionConfig
from google.adk.apps.llm_event_summarizer import LlmEventSummarizer
from google.adk.models import Gemini
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

import google.generativeai as genai

from app.data import prompts
from app.config.config import config
from app.tools.state_tools import save_architecture_decision

MODEL = "gemini-2.5-flash-lite"

genai.configure(api_key=config.gemini_api_key)
gemini_model = Gemini(model=MODEL)
summarizer = LlmEventSummarizer(llm=gemini_model)
session_service = InMemorySessionService()

state_tool = FunctionTool(
    func=save_architecture_decision,
)

chat_agent = LlmAgent(
    name="chat_agent",
    model=gemini_model,
    instruction=prompts.CHAT_AGENT_PROMPT,
    tools=[state_tool],
    description="An agent that answers user questions about software architecture design.",
)
initial_state = {"user_preferences": {"language": "en-US"}}

app = App(
    name=config.app_name,
    root_agent=chat_agent,
    events_compaction_config=EventsCompactionConfig(
        compaction_interval=2,
        overlap_size=1,
        summarizer=summarizer,
    )
)

runner = Runner(session_service=session_service,app=app)

async def get_chat_reponse(user_id: str, session_id: str, user_question: str) -> str:
    session = await session_service.get_session(
        app_name=config.app_name, 
        user_id=user_id, 
        session_id=session_id 
    )
    if not session:
        session = await session_service.create_session(
            user_id=user_id, 
            session_id=session_id, 
            app_name=config.app_name, 
            state=initial_state
        )

    context_str = get_current_state_info(session)
    formatted_message = Content(
        role="user",
        parts=[Part(text=f"""
        [SYSTEM NOTE: The following architectural decisions have already been made: {context_str}. 
        Do not ask about these again unless the user wants to change them.]
        
        User Question: {user_question}
        """)]
    )

    full_text = ""
    try:
        async for event in runner.run_async(
            user_id=user_id, 
            session_id=session.id, 
            new_message=formatted_message
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    full_text = event.content.parts[0].text
    except Exception as e:
        print(f"Error during AI generation: {e}")
        return "An internal error occurred."

    return full_text if full_text else "I'm sorry, I couldn't generate a response."

def get_current_state_info(session) ->str:
    if not session or not session.state:
        return "No state information available."
    if not session.state.items():
        return "No state information available."
    current_info =  {
        k:v for k, v in session.state.items() if k.startswith("user:arch_decision:")
    }

    if not current_info:
        return "No architecture decisions have been recorded yet."
    
    current_info_str = ", ".join([f"{k.split(':')[-1]}={v}" for k, v in current_info.items()])
    return current_info_str