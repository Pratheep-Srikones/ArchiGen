import asyncio
import json
from app.exceptions.architecture_exceptions import InvalidInputError, AIServiceError
from app.schemas.architecture import GenerateArchitectureResponse
from app.utils.ai import architecture_utils

async def generate_architecture(user_idea: str) -> GenerateArchitectureResponse:
    if not user_idea:
        raise InvalidInputError("user_idea is required")

    try:
        requirements_json = await architecture_utils.get_requirements_async(user_idea)
        await asyncio.sleep(1) 

        
        architecture_json = await architecture_utils.get_architecture(requirements_json)
        await asyncio.sleep(1)

        
        tech_stack_json = await architecture_utils.get_tech_stack(architecture_json)
        await asyncio.sleep(1)

        try:
            mermaid_code = await architecture_utils.get_mermaid_code(architecture_json)
        except Exception as mermaid_err:
            print(f"Mermaid Generation failed: {mermaid_err}")
            mermaid_code = "classDiagram\n    class Error { +Diagram Generation Failed }"

    except json.JSONDecodeError as je:
        raise AIServiceError(f"AI returned invalid JSON format: {str(je)}")
    except Exception as e:
        raise AIServiceError(f"Generation Engine Error: {str(e)}")

    return GenerateArchitectureResponse(
        requirements=requirements_json,
        architecture=architecture_json,
        tech_stack=tech_stack_json,
        mermaid_code=mermaid_code
    )