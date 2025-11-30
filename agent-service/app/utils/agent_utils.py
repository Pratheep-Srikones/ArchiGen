import json

def list_to_json(in_list: list) -> str:
    """Convert a list to a JSON string."""
    json_dict = {
        "description": in_list[1],
        "explanation": in_list[2],
        "tech_stack": in_list[3],
        "diagram": in_list[4]
    }
    return json.dumps(json_dict,indent=4)