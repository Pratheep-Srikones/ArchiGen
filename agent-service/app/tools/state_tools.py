from google.adk.tools import ToolContext

def save_architecture_decision(context, category: str, decision: str) -> str:
    try:
      key = f"user:arch_decision:{category.lower()}"
      context.session.state[key] = decision
      return f"Success: Recorded that {category} will be handled by {decision}."
    except Exception as e:
      return f"Error: Could not save the architecture decision due to: {str(e)}"
