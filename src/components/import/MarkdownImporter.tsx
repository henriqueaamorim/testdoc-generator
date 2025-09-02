import { ProjectData } from "@/components/DocumentationWizard";

// Deprecated: centralized in backend /v1/parse/markdown
export const parseMarkdownToProjectData = (_content: string): ProjectData => {
  throw new Error('Parser local descontinuado. Use o endpoint /v1/parse/markdown.');
};