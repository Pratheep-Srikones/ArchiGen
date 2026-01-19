def save_architecture_decision(decision_name: str, technology_choice: str):
    """
    Saves a specific software architecture decision to the session state.

    Args:
        decision_name: The category or component (e.g., 'database', 'frontend_framework').
        technology_choice: The specific tool or tech chosen (e.g., 'PostgreSQL', 'React').
    """
    # Note: Inside the agent framework, this tool will need to return 
    # the modification to the state.
    return {f"user:arch_decision:{decision_name}": technology_choice}