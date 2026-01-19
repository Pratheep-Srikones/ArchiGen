from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from google.genai.types import Content, Part
from google.adk.apps.app import App, EventsCompactionConfig
from google.adk.apps.llm_event_summarizer import LlmEventSummarizer
from google.adk.models import Gemini
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
import google.generativeai as genai

# Import the refactored tool
from app.tools.state_tools import save_architecture_decision
from app.config.config import config
from app.data import prompts

MODEL = "gemini-2.5-flash-lite"
genai.configure(api_key=config.gemini_api_key)

# 1. Setup Model and Services
gemini_model = Gemini(model=MODEL)
summarizer = LlmEventSummarizer(llm=gemini_model)
session_service = InMemorySessionService()

# 2. Define the Tool with explicit parameters
state_tool = FunctionTool(
    func=save_architecture_decision,
)

# 3. Initialize the Agent
chat_agent = LlmAgent(
    name="chat_agent",
    model=gemini_model,
    instruction=prompts.CHAT_AGENT_PROMPT,
    tools=[state_tool],
    description="An agent that records software architecture decisions (e.g. database, language).",
)

initial_state = {"user_preferences": {"language": "en-US"}}

# 4. Define the App
app = App(
    name=config.app_name,
    root_agent=chat_agent,
    events_compaction_config=EventsCompactionConfig(
        compaction_interval=2,
        overlap_size=1,
        summarizer=summarizer,
    )
)

runner = Runner(session_service=session_service, app=app)

async def get_chat_reponse(user_id: str, session_id: str, user_question: str) -> str:
    # Ensure session exists
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

    # Inject current architecture context into the prompt
    context_str = get_current_state_info(session)
    
    formatted_message = Content(
        role="user",
        parts=[Part(text=f"""
        CONTEXT: The following decisions are already saved: {context_str}.
        
        USER QUESTION: {user_question}
        """)]
    )

    full_text = ""
    try:
        # run_async handles the tool calling loop automatically
        async for event in runner.run_async(
            user_id=user_id, 
            session_id=session.id, 
            new_message=formatted_message
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    full_text = event.content.parts[0].text
    except Exception as e:
        # This catch is vital for debugging tool-parsing errors
        print(f"Error during AI generation: {str(e)}")
        return f"Error: {str(e)}"

    return full_text if full_text else "I'm sorry, I couldn't generate a response."

def get_current_state_info(session) -> str:
    if not session or not session.state:
        return "None"
    
    # Filter for decisions saved by our tool
    current_info = {
        k.split(':')[-1]: v for k, v in session.state.items() 
        if k.startswith("user:arch_decision:")
    }

    if not current_info:
        return "No decisions made yet."
    
    return ", ".join([f"{k}: {v}" for k, v in current_info.items()])