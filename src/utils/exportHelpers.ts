import { ProjectData } from "@/components/DocumentationWizard";

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Não definido';
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const formatFieldValue = (value: any, emptyMessage: string = 'Não preenchido'): string => {
  if (value === null || value === undefined || value === '') {
    return emptyMessage;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'Nenhum item adicionado';
  }
  return String(value);
};

export const formatListField = (list: any[], emptyMessage: string): string => {
  return list.length > 0 ? list.map(item => `• ${item}`).join('\n') : emptyMessage;
};

export const generateDocumentTitle = (projectData: ProjectData): string => {
  return `Documentação de Teste - ${projectData.projectName} v${projectData.projectVersion}`;
};

export const calculateProjectMetrics = (projectData: ProjectData) => {
  const totalRequirements = projectData.project.requirements.length;
  const totalTestCases = projectData.project.testCases.length;
  const totalExecutions = projectData.execution.executions.length;
  const approvedExecutions = projectData.execution.executions.filter(e => e.status === 'Aprovado').length;
  const totalDefects = projectData.execution.defects.length;
  const openDefects = projectData.execution.defects.filter(d => !['Corrigido', 'Fechado', 'Rejeitado'].includes(d.status)).length;
  
  const testCoverage = totalTestCases > 0 ? (totalExecutions / totalTestCases) * 100 : 0;
  const approvalRate = totalExecutions > 0 ? (approvedExecutions / totalExecutions) * 100 : 0;
  const defectResolutionRate = totalDefects > 0 ? ((totalDefects - openDefects) / totalDefects) * 100 : 0;

  return {
    totalRequirements,
    totalTestCases,
    totalExecutions,
    approvedExecutions,
    totalDefects,
    openDefects,
    testCoverage: Math.round(testCoverage),
    approvalRate: Math.round(approvalRate),
    defectResolutionRate: Math.round(defectResolutionRate)
  };
};

export const getDeliveryStatus = (expectedDate: string, actualDate: string): { status: string; color: string; icon: string } => {
  if (!expectedDate || !actualDate) {
    return { status: 'Não Definido', color: 'text-muted-foreground', icon: 'HelpCircle' };
  }

  const expected = new Date(expectedDate);
  const actual = new Date(actualDate);
  
  if (actual <= expected) {
    return { status: 'No Prazo', color: 'text-success', icon: 'CheckCircle' };
  } else {
    return { status: 'Atrasado', color: 'text-destructive', icon: 'Clock' };
  }
};

export const formatMarkdownList = (items: any[], emptyMessage: string): string => {
  if (!items || items.length === 0) return emptyMessage;
  return items.map(item => `- ${item}`).join('\n');
};

export const formatMarkdownTable = (headers: string[], rows: any[][]): string => {
  if (!rows || rows.length === 0) {
    return `| ${headers.join(' | ')} |\n|${headers.map(() => '---').join('|')}|\n| ${headers.map(() => 'Nenhum dado disponível').join(' | ')} |`;
  }
  
  const headerRow = `| ${headers.join(' | ')} |`;
  const separator = `|${headers.map(() => '---').join('|')}|`;
  const dataRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
  
  return `${headerRow}\n${separator}\n${dataRows}`;
};

export const escapeMarkdown = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\|/g, '\\|')
    .replace(/`/g, '\\`');
};

export const validateProjectData = (projectData: ProjectData): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];

  if (!projectData.projectName) missingFields.push('Nome do Projeto');
  if (!projectData.projectVersion) missingFields.push('Versão do Projeto');
  if (!projectData.testResponsible) missingFields.push('Responsável pelo Teste');
  if (!projectData.startDate) missingFields.push('Data de Início');
  if (!projectData.expectedDeliveryDate) missingFields.push('Data Prevista de Entrega');
  
  if (projectData.project.requirements.length === 0) missingFields.push('Requisitos');
  if (projectData.project.testCases.length === 0) missingFields.push('Casos de Teste');

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};