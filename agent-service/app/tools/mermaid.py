import re
import mermaidx

def validate_mermaid_syntax(code: str) -> dict:
    """
    Validates Mermaid.js diagram syntax by attempting to render it to SVG.
    
    Args:
        code: The Mermaid diagram definition string (with or without markdown fences).
        
    Returns:
        dict: {"valid": True, "error": None} if syntax is valid,
              or {"valid": False, "error": "<error description>"} if invalid.
    """
    if not code or not isinstance(code, str):
        return {"valid": False, "error": "Diagram code must be a non-empty string."}

    cleaned = code.strip()
    # Strip markdown fences if the model included them in the argument
    cleaned = re.sub(r"^```(?:mermaid)?\s*\n?", "", cleaned)
    cleaned = re.sub(r"\n?```\s*$", "", cleaned).strip()

    # 1. Quick sanity check (header & bracket balancing)
    valid_sanity, sanity_err = quick_sanity_check(cleaned)
    if not valid_sanity:
        return {"valid": False, "error": sanity_err}

    # 2. Complete SVG rendering check via mermaidx
    try:
        diagram = mermaidx.render(cleaned)
        diagram.svg()
        return {"valid": True, "error": None}
    except Exception as e:
        return {"valid": False, "error": str(e)}


VALID_HEADERS = (
    "graph", "flowchart", "sequenceDiagram", "classDiagram",
    "stateDiagram", "stateDiagram-v2", "erDiagram", "journey",
    "gantt", "pie", "quadrantChart", "requirementDiagram",
    "gitGraph", "mindmap", "timeline", "zenuml", "sankey-beta",
    "xychart-beta", "block-beta", "packet-beta", "architecture-beta"
)

def quick_sanity_check(cleaned: str) -> tuple[bool, str | None]:
    if not cleaned:
        return False, "Empty diagram code."

    # Check if first non-comment/non-directive line starts with a valid diagram type
    lines = [
        line.strip() for line in cleaned.splitlines()
        if line.strip() and not line.strip().startswith("%%")
    ]
    if not lines or not lines[0].startswith(VALID_HEADERS):
        return False, f"Invalid or missing diagram declaration: '{lines[0] if lines else ''}'"

    # Check for unbalanced brackets/quotes
    if cleaned.count('"') % 2 != 0:
        return False, "Unbalanced double quotes."

    return True, None