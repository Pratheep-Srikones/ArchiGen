

REQUIREMENT_PROMPT = """
You are a Senior Business Analyst.
Analyze the user's idea: "{user_idea}"

Output a JSON object strictly following this schema:

{{
  "project_name": "String",
  "user_roles": [
    {{
      "role": "String",
      "description": "String"
    }}
  ],
  "functional_requirements": [
    {{
      "id": "String",
      "requirement": "String",
      "priority": "High|Medium|Low",
      "justification": "String"
    }}
  ],
  "non_functional_requirements": [
    {{
      "category": "String",
      "requirement": "String",
      "justification": "String"
    }}
  ]
}}
"""


ARCHITECTURE_PROMPT = """
You are a Software Architect. Use the following Requirements JSON to design the system.

Requirements Context:
{reqs_str}

Return JSON strictly following this schema:

{{
  "architectural_style": {{
    "style_name": "String",
    "reasoning": "String"
  }},
  "core_components": [
    {{
      "name": "String",
      "responsibility": "String",
      "suggested_pattern": "String",
      "pattern_justification": "String"
    }}
  ],
  "data_flow_strategy": "String"
}}
"""


TECH_STACK_PROMPT = """
You are a Tech Lead. Suggest the stack for this Architecture.

Architecture Context:
{arch_str}

Return JSON strictly following this schema:

{{
  "frontend": {{
    "technology": "String",
    "justification": "String"
  }},
  "backend": {{
    "technology": "String",
    "justification": "String"
  }},
  "database": {{
    "technology": "String",
    "justification": "String"
  }},
  "infrastructure": {{
    "technology": "String",
    "justification": "String"
  }}
}}
"""

MERMAID_PROMPT = """
    You are a Technical Diagram expert.
    Create a Mermaid.js Class Diagram based on this architecture.
    
    Architecture Context:
    {arch_str}
    
    Instructions:
    1. Use the components defined in the JSON.
    2. Show relationships (composition, inheritance) labeled correctly.
    3. Add notes in the diagram for Design Patterns used (e.g. `note for OrderManager "Uses Singleton"`).
    4. Output ONLY the raw mermaid code. Do not wrap in markdown blocks.
    """
