from google.adk.agents import LlmAgent
import google.generativeai as genai
from google.genai.types import Content, Part


from google.adk.models import Gemini
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService


from app.data import prompts
from app.config.config import config

MODEL = "gemini-2.5-flash-lite"

genai.configure(api_key=config.gemini_api_key)
adk_model = Gemini(model=MODEL)

session_service = InMemorySessionService()


chat_agent = LlmAgent(
    name="chat_agent",
    model=adk_model,
    instruction=prompts.CHAT_AGENT_PROMPT,
    description="An agent that answers user questions about software architecture design.",
)
initial_state = {"user_preferences": {"language": "en-US"}}

runner = Runner(session_service=session_service,agent=chat_agent, app_name=config.app_name)

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

    formatted_message = Content(
        role="user",
        parts=[Part(text=user_question)]
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