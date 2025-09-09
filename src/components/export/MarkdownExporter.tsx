import React from 'react';
import { ProjectData } from "@/components/DocumentationWizard";
import { formatDate, formatFieldValue, formatMarkdownList, formatMarkdownTable, escapeMarkdown, getDeliveryStatus } from "@/utils/exportHelpers";

interface MarkdownExporterProps {
  projectData: ProjectData;
  onProgress: (progress: number) => void;
}

export const generateMarkdown = async (
  projectData: ProjectData,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  onProgress(10);

  let markdown = `# Documentação de Teste - ${escapeMarkdown(formatFieldValue(projectData.projectName))} v${escapeMarkdown(formatFieldValue(projectData.projectVersion))}\n\n`;

  // CABEÇALHO
  onProgress(20);
  markdown += `## CABEÇALHO\n\n`;
  markdown += `- **Nome do Projeto:** ${escapeMarkdown(formatFieldValue(projectData.projectName))}\n`;
  markdown += `- **Versão do Projeto:** ${escapeMarkdown(formatFieldValue(projectData.projectVersion))}\n`;
  markdown += `- **Responsável pelo Teste:** ${escapeMarkdown(formatFieldValue(projectData.testResponsible))}\n`;
  markdown += `- **Data de Início:** ${formatDate(projectData.startDate)}\n`;
  markdown += `- **Data Prevista de Entrega:** ${formatDate(projectData.expectedDeliveryDate)}\n\n`;

  // PLANEJAMENTO
  onProgress(30);
  markdown += `## PLANEJAMENTO\n\n`;
  
  markdown += `### Fases do Projeto\n\n`;
  if (projectData.planning.phases.length > 0) {
    const phaseHeaders = ['Fase', 'Responsável', 'Data Início', 'Data Fim', 'Status'];
    const phaseRows = projectData.planning.phases.map(phase => [
      escapeMarkdown(formatFieldValue(phase.phase)),
      escapeMarkdown(formatFieldValue(phase.responsible)),
      formatDate(phase.startDate),
      formatDate(phase.endDate),
      escapeMarkdown(formatFieldValue(phase.status))
    ]);
    markdown += formatMarkdownTable(phaseHeaders, phaseRows) + '\n\n';
  } else {
    markdown += `Nenhuma fase adicionada\n\n`;
  }

  markdown += `### Escopo\n\n`;
  markdown += `**Incluído:**\n\n${formatMarkdownList(projectData.planning.scopeIncluded, 'Nenhum item adicionado')}\n\n`;
  markdown += `**Excluído:**\n\n${formatMarkdownList(projectData.planning.scopeExcluded, 'Nenhum item adicionado')}\n\n`;

  markdown += `### Estratégias de Teste\n\n`;
  markdown += `${formatMarkdownList(projectData.planning.testStrategy, 'Nenhuma estratégia adicionada')}\n\n`;

  markdown += `### Ambiente de Teste\n\n`;
  markdown += `- **Descrição:** ${escapeMarkdown(formatFieldValue(projectData.planning.environment.description))}\n`;
  markdown += `- **URL de Acesso:** ${escapeMarkdown(formatFieldValue(projectData.planning.environment.urlAccess))}\n`;
  markdown += `- **Equipamentos:** ${escapeMarkdown(formatFieldValue(projectData.planning.environment.equipment))}\n\n`;

  markdown += `### Riscos\n\n`;
  markdown += `**Técnicos:**\n\n${formatMarkdownList(projectData.planning.risks.technical, 'Nenhum risco identificado')}\n\n`;
  markdown += `**Requisitos:**\n\n${formatMarkdownList(projectData.planning.risks.requirements, 'Nenhum risco identificado')}\n\n`;
  markdown += `**Cronograma:**\n\n${formatMarkdownList(projectData.planning.risks.schedule, 'Nenhum risco identificado')}\n\n`;
  markdown += `**Operacionais:**\n\n${formatMarkdownList(projectData.planning.risks.operational, 'Nenhum risco identificado')}\n\n`;
  markdown += `**Qualidade:**\n\n${formatMarkdownList(projectData.planning.risks.quality, 'Nenhum risco identificado')}\n\n`;

  markdown += `- **Taxa de Sucesso Esperada:** ${projectData.planning.successRate || 0}%\n\n`;

  // PROJETO
  onProgress(50);
  markdown += `## PROJETO\n\n`;
  
  markdown += `### Requisitos\n\n`;
  if (projectData.project.requirements.length > 0) {
    const reqHeaders = ['ID', 'Descrição'];
    const reqRows = projectData.project.requirements.map(req => [
      escapeMarkdown(formatFieldValue(req.id)),
      escapeMarkdown(formatFieldValue(req.description))
    ]);
    markdown += formatMarkdownTable(reqHeaders, reqRows) + '\n\n';
  } else {
    markdown += `Nenhum requisito adicionado\n\n`;
  }

  markdown += `### Casos de Teste\n\n`;
  if (projectData.project.testCases.length > 0) {
    projectData.project.testCases.forEach((testCase, index) => {
      // Tabela para ID
      markdown += `| ID      |\n`;
      markdown += `| ------- |\n`;
      markdown += `| ${escapeMarkdown(formatFieldValue(testCase.id))} |\n\n`;
      
      // Tabela para Funcionalidade
      markdown += `| Funcionalidade |\n`;
      markdown += `| -------------------------------- |\n`;
      markdown += `| ${escapeMarkdown(formatFieldValue(testCase.functionality))} |\n\n`;
      
      // Tabela para Script
      markdown += `| Script |\n`;
      markdown += `| ------ |\n`;
      const scriptContent = formatFieldValue(testCase.testScript);
      markdown += `${scriptContent} |\n\n`;
      
      // Adicionar espaçamento entre casos de teste
      if (index < projectData.project.testCases.length - 1) {
        markdown += `---\n\n`;
      }
    });
  } else {
    markdown += `Nenhum caso de teste adicionado\n\n`;
  }

  // EXECUÇÃO
  onProgress(70);
  markdown += `## EXECUÇÃO\n\n`;
  
  markdown += `### Execuções de Teste\n\n`;
  if (projectData.execution.executions.length > 0) {
    const execHeaders = ['Caso de Teste', 'Status', 'Evidência'];
    const execRows = projectData.execution.executions.map(exec => [
      escapeMarkdown(formatFieldValue(exec.caseId)),
      escapeMarkdown(formatFieldValue(exec.status)),
      escapeMarkdown(formatFieldValue(exec.evidence))
    ]);
    markdown += formatMarkdownTable(execHeaders, execRows) + '\n\n';
  } else {
    markdown += `Nenhuma execução realizada\n\n`;
  }

  markdown += `### Defeitos Encontrados\n\n`;
  if (projectData.execution.defects.length > 0) {
    const defectHeaders = ['Caso de Teste', 'Descrição', 'Status', 'Severidade', 'Responsável'];
    const defectRows = projectData.execution.defects.map(defect => [
      escapeMarkdown(formatFieldValue(defect.caseId)),
      escapeMarkdown(formatFieldValue(defect.description)),
      escapeMarkdown(formatFieldValue(defect.status)),
      escapeMarkdown(formatFieldValue(defect.severity)),
      escapeMarkdown(formatFieldValue(defect.responsible))
    ]);
    markdown += formatMarkdownTable(defectHeaders, defectRows) + '\n\n';
  } else {
    markdown += `Nenhum defeito encontrado\n\n`;
  }

  // ENTREGA
  onProgress(90);
  markdown += `## ENTREGA\n\n`;
  
  markdown += `### Indicadores\n\n`;
  markdown += `- **Casos Planejados:** ${projectData.delivery.indicators.planned || 0}\n`;
  markdown += `- **Casos Executados:** ${projectData.delivery.indicators.executed || 0}\n`;
  markdown += `- **Defeitos Abertos:** ${projectData.delivery.indicators.openDefects || 0}\n`;
  markdown += `- **Defeitos Corrigidos:** ${projectData.delivery.indicators.fixedDefects || 0}\n`;
  markdown += `- **Taxa de Sucesso:** ${projectData.delivery.indicators.successRate || 0}%\n\n`;

  markdown += `### Resumo da Entrega\n\n`;
  markdown += `${escapeMarkdown(formatFieldValue(projectData.delivery.summary))}\n\n`;

  markdown += `### Status Final\n\n`;
  markdown += `- **Data de Entrega:** ${formatDate(projectData.delivery.deliveryDate)}\n`;
  
  const deliveryStatus = getDeliveryStatus(projectData.expectedDeliveryDate, projectData.delivery.deliveryDate);
  markdown += `- **Status da Entrega:** ${deliveryStatus.status}\n`;

  onProgress(100);

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  return blob;
};

export const MarkdownExporter: React.FC<MarkdownExporterProps> = ({ projectData, onProgress }) => {
  return null;
};