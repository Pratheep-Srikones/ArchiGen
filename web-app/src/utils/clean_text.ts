import { ArchitectureAgentRespose } from "@/types/resposes";

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

export function extractData(input: string[]): ArchitectureAgentRespose {
  return {
    architecture: input[0],
    explanation: input[1],
    techstack: input[2],
    mermaidDiagram: normalizeMermaid(input[3]),
  };
}
