# Root Cause Analysis: Mermaid Generation Failure

- Symptom: The controller logs `Mermaid Generation failed: '\n        +method()\n    '`. This happens while generating Mermaid code.
- Location:
  - Prompt: [app/data/prompts.py](app/data/prompts.py)
  - Usage: `MERMAID_PROMPT` is formatted in [app/utils/ai/architecture_utils.py](app/utils/ai/architecture_utils.py) by `prompts.MERMAID_PROMPT.format(arch_str=arch_str)`.

## Root Cause
Python `str.format` treats single braces `{` and `}` in format strings as placeholders. In `MERMAID_PROMPT`, the "Example Output Format" includes a Mermaid class block:

```
classDiagram
    class Service {
        +method()
    }
```

Because `MERMAID_PROMPT` is later passed to `.format(arch_str=...)`, the braces around the example class (`{` and `}`) are interpreted as a format field. The substring between these braces is the literal text `\n        +method()\n    `, which becomes an invalid/missing field name for `str.format`, causing a `KeyError`. That missing-field name is exactly what the controller prints:

```
Mermaid Generation failed: '\n        +method()\n    '
```

Note: Other prompts in this codebase correctly escape literal braces by doubling them (e.g., `{{` and `}}`) when they contain JSON samples. `MERMAID_PROMPT` missed this escaping in its example.

## Impact
- `get_mermaid_code()` raises during prompt formatting.
- Mermaid generation fails and the controller falls back to a placeholder diagram.

## Recommendation (Fix)
Escape the literal braces in the example block inside `MERMAID_PROMPT` by doubling them:

```
classDiagram
    class Service {{
        +method()
    }}
```

This preserves the example while keeping `.format(arch_str=...)` functional. Alternatively, you can:
- Remove the example block from the prompt, or
- Replace `.format(...)` with a templating approach that doesn’t treat braces specially (e.g., `string.Template`), but this is unnecessary if braces are properly escaped.

## Verification Steps
1. Update `MERMAID_PROMPT` to escape the braces as above.
2. Re-run the flow that invokes `generate_architecture`.
3. Confirm no exception is logged and `mermaid_code` returns a diagram starting with `classDiagram`.
