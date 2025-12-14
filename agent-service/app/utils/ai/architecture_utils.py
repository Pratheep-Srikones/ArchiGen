import json
import google.generativeai as genai

from app.data import prompts
from app.config.config import config

MODEL = "gemini-2.5-flash-lite"

genai.configure(api_key=config.gemini_api_key)
model = genai.GenerativeModel(MODEL)

def get_requirements(user_idea):
    prompt = prompts.REQUIREMENT_PROMPT.format(user_idea=user_idea)
    
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json", 
            # You can also pass a response_schema object here for strict typing
        )
    )
    return json.loads(response.text)

def get_architecture(requirements_json):
    # We pass the PREVIOUS JSON output as context
    reqs_str = json.dumps(requirements_json, indent=2)
    
    prompt = prompts.ARCHITECTURE_PROMPT.format(reqs_str=reqs_str)
    
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(response_mime_type="application/json")
    )
    return json.loads(response.text)

def get_tech_stack(architecture_json):
    arch_str = json.dumps(architecture_json, indent=2)
    
    prompt = prompts.TECH_STACK_PROMPT.format(arch_str=arch_str)
    
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(response_mime_type="application/json")
    )
    return json.loads(response.text)

def get_mermaid_code(architecture_json):
    arch_str = json.dumps(architecture_json, indent=2)
    
    prompt = prompts.MERMAID_PROMPT.format(arch_str=arch_str)
    
    response = model.generate_content(prompt)
    # Clean up if the model adds markdown backticks by accident
    clean_code = response.text.replace("```mermaid", "").replace("```", "").strip()
    return clean_code