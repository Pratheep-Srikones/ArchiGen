
import asyncio
import sys
import os

# Add the parent directory to Python path so 'app' module can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from google.adk.runners import InMemoryRunner
from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.adk.events.event import Event
from google.genai import types
from app.config.config import config

root_model = Gemini(
            api_key=config.gemini_api_key,
            model="gemini-2.5-flash-lite",
            generation_config={"response_mime_type": "application/json"}
        )

root = Agent(
            name="Root_Agent",
            instruction="You are a helpful assistant.",
            model=root_model,
            
        )

async def run_agent(user_prompt: str) :
   try:
       user_id = "test_user_123"
       app_name = "test_app"
       runner = InMemoryRunner(agent=root,app_name=app_name)
       

       newSession = await runner.session_service.create_session(
              user_id=user_id,
              app_name=app_name
       )

       message_content = types.Content(
           role = "user",
           parts = [types.Part.from_text(text=user_prompt)]
       )

       async for event in runner.run_async(
           user_id=user_id,
              session_id=newSession.id,
              new_message=message_content
       ):
           if event.is_final_response():
               if event.content and event.content.parts:
                   response_text = event.content.parts[0].text
                   print(f"Final Response: {response_text}")
           elif event.error:
               print(f"Error during agent execution: {event.error}")
   except Exception as e:
       print(f"✗ Agent run error: {e}")
       import traceback
       traceback.print_exc()
       return None
   
async def test_agent():
    """Test if the agent system is set up correctly."""
    print("Running agent test...")
    await run_agent("who caused the fall of the roman empire?")
    



if __name__ == "__main__":
    asyncio.run(test_agent())