import { projectApi } from "@/config/axiosConfig";
import type {
  ArchitectureOutput,
  MicroSection,
  Project,
  RepoNode,
  TechItem,
} from "@/lib/mock-data";

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
    const response = await projectApi.post("/projects", projectData);
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
    const response = await projectApi.get(`/projects`, {
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
    const response = await projectApi.get(`/projects/architecture/${project_id}`);
    const result: ArchitectureOutput = response.data.data;
    return result;
  } catch (error) {
    console.error("Error fetching architecture:", error);
    throw error;
  }
};
