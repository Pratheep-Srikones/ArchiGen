import mermaidx
import re

def validate_mermaid(code: str) -> tuple[bool, str]:
    try:
        diagram = mermaidx.render(code)
        diagram.svg()  # Triggers rendering and syntax validation

        return True, "valid mermaid code"

    except Exception as e:
        return False, str(e)


VALID_HEADERS = (
    "graph", "flowchart", "sequenceDiagram", "classDiagram",
    "stateDiagram", "stateDiagram-v2", "erDiagram", "journey",
    "gantt", "pie", "quadrantChart", "requirementDiagram",
    "gitGraph", "mindmap", "timeline", "zenuml", "sankey-beta",
    "xychart-beta", "block-beta", "packet-beta", "architecture-beta"
)

def quick_sanity_check(code: str) -> tuple[bool, str | None]:
    cleaned = code.strip()
    
    # Strip markdown fences if present
    cleaned = re.sub(r"^```(?:mermaid)?\s*\n?", "", cleaned)
    cleaned = re.sub(r"\n?```\s*$", "", cleaned).strip()

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