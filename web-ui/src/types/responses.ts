export interface ProjectSpecResponse {
  data: ProjectData;
  message: string;
  error: string | null;
}

export interface ProjectData {
  requirements: ProjectRequirements;
  architecture: ProjectArchitecture;
  tech_stack: TechStack;
  mermaid_code: string; // Used for rendering system diagrams
}

// --- Requirements Module ---

export type RequirementPriority = "High" | "Medium" | "Low" | string;

export interface UserRole {
  role: string;
  description: string;
}

export interface FunctionalRequirement {
  id: string;
  requirement: string;
  priority: RequirementPriority;
  justification: string;
}

export interface NonFunctionalRequirement {
  category: string;
  requirement: string;
  justification: string;
}

export interface ProjectRequirements {
  project_name: string;
  user_roles: UserRole[];
  functional_requirements: FunctionalRequirement[];
  non_functional_requirements: NonFunctionalRequirement[];
}

// --- Architecture Module ---

export interface ArchitecturalStyle {
  style_name: string;
  reasoning: string;
}

export interface SystemComponent {
  name: string;
  responsibility: string;
  suggested_pattern?: string; // Optional depending on complexity
  pattern_justification?: string;
}

export interface ProjectArchitecture {
  architectural_style: ArchitecturalStyle;
  core_components: SystemComponent[];
  data_flow_strategy: string;
}

// --- Technology Module ---

export interface TechItem {
  technology: string;
  justification: string;
}

export interface TechStack {
  frontend: TechItem;
  backend: TechItem;
  database: TechItem;
  infrastructure: TechItem;
  [key: string]: TechItem; // Allows for additional categories like "Mobile" or "AI"
}
