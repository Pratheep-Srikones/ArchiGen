export function normalizeMermaid(input: string): string {
  let cleaned = input
    .replace(/^```mermaid/i, "")
    .replace(/```$/, "")
    .trim();

  cleaned = cleaned.replace(/\\n/g, "\n");
  cleaned = cleaned.replace(/\\"/g, '"');
  cleaned = cleaned.replace(/^"+|"+$/g, "");
  cleaned = cleaned.replace(/\[([^"\]]+)\]/g, '["$1"]');

  // Replace ALL % with %%
  cleaned = cleaned.replace(/%/g, "%%");

  cleaned = cleaned.trim();

  return cleaned;
}
