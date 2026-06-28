import { api } from "@/config/axiosConfig";
import type {
  ArchitectureOutput,
  MicroSection,
  Project,
  RepoNode,
  TechItem,
} from "@/lib/mock-data";

export type Diagram = {
  id: string;
  project_id: string;
  type: string;
  mermaid_code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type SaveDiagramRequest = {
  type: string;
  mermaid_code: string;
  description?: string;
};

export type CreateProjectRequest = {
  project_id: string;
  user_id: string;
  title: string;
  requirements: string;
  architecture: string;
  mermaid_code: string;
  micro: MicroSection[];
  tech_stack: TechItem[];
  repo: RepoNode[];
};

export type GetProjectResponse = {
  projects: Project[];
  total_count: number;
};

export const createProject = async (projectData: CreateProjectRequest) => {
  try {
    const response = await api.post("/projects", projectData);
    return response.data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const readProjects = async (
  start: number = 0,
  limit: number = 6,
  search: string = "",
): Promise<GetProjectResponse> => {
  try {
    const response = await api.get(`/projects`, {
      params: { start, count: limit, search },
    });
    const result: GetProjectResponse = response.data.data;
    return result;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

export const getArchitecture = async (project_id: string) => {
  try {
    const response = await api.get(`/projects/architecture/${project_id}`);
    const result: ArchitectureOutput = response.data.data;
    return result;
  } catch (error) {
    console.error("Error fetching architecture:", error);
    throw error;
  }
};

export const updateArchitectureMermaidCode = async (project_id: string, mermaid_code: string) => {
  try {
    const response = await api.patch(`/projects/${project_id}/architecture`, {
      mermaid_code,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating architecture:", error);
    throw error;
  }
};

export const getDiagrams = async (project_id: string): Promise<Diagram[]> => {
  try {
    const response = await api.get(`/projects/diagram/${project_id}`);
    const result: Diagram[] = response.data.data;
    return result;
  } catch (error) {
    console.error("Error fetching diagrams:", error);
    throw error;
  }
};

export const saveDiagram = async (
  project_id: string,
  payload: SaveDiagramRequest,
): Promise<Diagram> => {
  try {
    const response = await api.post(`/projects/diagram/${project_id}`, payload);
    const result: Diagram = response.data.data;
    return result;
  } catch (error) {
    console.error("Error saving diagram:", error);
    throw error;
  }
};
