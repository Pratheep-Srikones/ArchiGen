
from google.adk.runners import InMemoryRunner
from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.adk.tools import google_search, AgentTool

from app.config.config import config
from app.data import prompts

async def run_agent(prompt: str) -> str:
    try:
        gemini = Gemini(api_key=config.gemini_api_key,
                    retry_options=config.agent_retry_options,
                    model="gemini-2.5-flash-lite")
        
        prompt_agent = Agent(
            name="Prompt_Engineer_Agent",
            description="An agent that refines and enhances user prompts related to designing scalable system architectures.",
            instruction=prompts.PROMPT_ENGINEER_AGENT_PROMPT,
            model=gemini,
            output_key="refined_prompt",
            tools=[google_search]
        )

        architect_agent = Agent(
            name="System_Architect_Agent",
            description="An agent that designs scalable microservices architectures for e-commerce platforms.",
            instruction= f"you are a system architect. Using the following refined prompt, design a detailed scalable: {{refined_prompt}}. Provide a comprehensive architecture plan including components, technologies, and strategies to improve the quality attributes.",
            model=gemini,
            output_key="architecture_design",
        )

        root_agent = Agent(
            name="Root_Agent",
            description="An agent that coordinates the prompt engineering and system architect agents to deliver a final architecture design.",
            instruction="""First, refine the user's prompt using the 'Prompt_Engineer_Agent', then use the refined prompt to design a scalable architecture with the 'System_Architect_Agent'. Combine the outputs into a final response. DO NOT answer the user's prompt directly. DO NOT PROCEED IF THE PROMPT IS NOT RELATED TO SYSTEM ARCHITECTURES.""",
            tools=[AgentTool(prompt_agent), AgentTool(architect_agent)],
            model=gemini,
        )

        runner = InMemoryRunner(agent=root_agent)
        
        response = await runner.run_debug(prompt)
        
        if response:
            final_event = response[-1]
            
            # The text content is usually in the .text attribute
            # (or sometimes .content)
            if hasattr(final_event, 'text'):
                return final_event.text
            elif hasattr(final_event, 'content'):
                return final_event.content.parts[0].text
            else:
                # Fallback in case the attribute name is different
                return str(final_event)
        
        return "No response found."
    except Exception as e:
        print(f"Error running agent: {e}")
        return f"Error: {e}"