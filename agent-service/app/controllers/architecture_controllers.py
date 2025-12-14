from app.exceptions.architecture_exceptions import InvalidInputError, AIServiceError
from app.schemas.architecture import GenerateArchitectureResponse
from app.utils.ai import architecture_utils

async def generate_architecture(user_idea: str) -> GenerateArchitectureResponse:
    if not user_idea:
        raise InvalidInputError("user_idea is required")

    try:
        requirements_json = architecture_utils.get_requirements(user_idea)
        architecture_json = architecture_utils.get_architecture(requirements_json)
        tech_stack_json = architecture_utils.get_tech_stack(architecture_json)
        mermaid_code = architecture_utils.get_mermaid_code(architecture_json)
    except Exception as e:
        raise AIServiceError(str(e))

    return GenerateArchitectureResponse(
        requirements=requirements_json,
        architecture=architecture_json,
        tech_stack=tech_stack_json,
        mermaid_code=mermaid_code
    )
