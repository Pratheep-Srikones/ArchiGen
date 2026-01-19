import json
import google.generativeai as genai
from app.data import prompts
from app.config.config import config

# Note: Ensure this model name is correct for your region/tier
MODEL = "gemini-2.5-flash-lite"

genai.configure(api_key=config.gemini_api_key)
model = genai.GenerativeModel(MODEL)

async def get_requirements_async(user_idea):
    prompt = prompts.REQUIREMENT_PROMPT.format(user_idea=user_idea)
    response = await model.generate_content_async(
        prompt,
        generation_config=genai.GenerationConfig(response_mime_type="application/json")
    )
    return json.loads(response.text)

async def get_architecture(requirements_json):
    reqs_str = json.dumps(requirements_json, indent=2)
    prompt = prompts.ARCHITECTURE_PROMPT.format(reqs_str=reqs_str)
    response = await model.generate_content_async(
        prompt,
        generation_config=genai.GenerationConfig(response_mime_type="application/json")
    )
    return json.loads(response.text)

async def get_tech_stack(architecture_json):
    arch_str = json.dumps(architecture_json, indent=2)
    prompt = prompts.TECH_STACK_PROMPT.format(arch_str=arch_str)
    response = await model.generate_content_async(
        prompt,
        generation_config=genai.GenerationConfig(response_mime_type="application/json")
    )
    return json.loads(response.text)

async def get_mermaid_code(architecture_json):
    arch_str = json.dumps(architecture_json, indent=2)
    prompt = prompts.MERMAID_PROMPT.format(arch_str=arch_str)
    
    # IMPORTANT: No generation_config with JSON mime type here
    response = await model.generate_content_async(prompt, generation_config=genai.GenerationConfig(response_mime_type="text/plain"))
    
    # 1. Access the text
    content = response.text
    print(f"Raw Mermaid Response: {content}")
    
    # 2. Cleanup literal backslash-n sequences if the AI hallucinated them
    content = content.replace("\\n", "\n")
    
    # 3. Strip out Markdown blocks if the AI ignored your prompt
    if "```" in content:
        # Extracts content between ```mermaid and ``` or just ```
        import re
        content = re.sub(r"```[a-z]*", "", content).replace("```", "")
    print(f"Cleaned Mermaid Response: {content}")
    return content.strip()