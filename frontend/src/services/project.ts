import { projectApi } from "@/config/axiosConfig";
import { MicroSection, RepoNode, TechItem } from "@/lib/mock-data";

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

export const createProject = async (projectData: CreateProjectRequest) => {
  try {
    const response = await projectApi.post("/projects", projectData);
    console.log("Project created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};
