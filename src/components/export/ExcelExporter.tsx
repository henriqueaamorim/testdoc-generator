import React from 'react';
import * as XLSX from 'xlsx';
import { ProjectData } from '../DocumentationWizard';
import { formatDate, calculateProjectMetrics, getDeliveryStatus } from '@/utils/exportHelpers';

interface ExcelExporterProps {
  projectData: ProjectData;
  onProgress: (progress: number) => void;
}

export const generateExcel = async (projectData: ProjectData, onProgress: (progress: number) => void): Promise<Blob> => {
  const wb = XLSX.utils.book_new();
  const metrics = calculateProjectMetrics(projectData);
  const deliveryStatus = getDeliveryStatus(projectData.expectedDeliveryDate, projectData.delivery.deliveryDate);

  // Project Info Sheet
  onProgress(20);
  const projectInfoData = [
    ['Informações do Projeto', ''],
    ['Nome do Projeto', projectData.projectName],
    ['Versão', projectData.projectVersion],
    ['Responsável', projectData.testResponsible],
    ['Data de Início', formatDate(projectData.startDate)],
    ['Data Prevista', formatDate(projectData.expectedDeliveryDate)],
    ['Data de Entrega', formatDate(projectData.delivery.deliveryDate)],
    ['Status da Entrega', deliveryStatus.status],
    ['', ''],
    ['Ambiente de Teste', ''],
    ['Descrição', projectData.planning.environment.description],
    ['URL de Acesso', projectData.planning.environment.urlAccess],
    ['Equipamentos', projectData.planning.environment.equipment],
  ];

  const projectInfoWS = XLSX.utils.aoa_to_sheet(projectInfoData);
  XLSX.utils.book_append_sheet(wb, projectInfoWS, 'Informações do Projeto');

  // Requirements Sheet
  onProgress(40);
  const requirementsData = [
    ['ID', 'Descrição'],
    ...projectData.project.requirements.map(req => [req.id, req.description])
  ];

  const requirementsWS = XLSX.utils.aoa_to_sheet(requirementsData);
  XLSX.utils.book_append_sheet(wb, requirementsWS, 'Requisitos');

  // Test Cases Sheet
  onProgress(60);
  const testCasesData = [
    ['ID', 'Funcionalidade', 'Script de Teste'],
    ...projectData.project.testCases.map(tc => [tc.id, tc.functionality, tc.testScript])
  ];

  const testCasesWS = XLSX.utils.aoa_to_sheet(testCasesData);
  XLSX.utils.book_append_sheet(wb, testCasesWS, 'Casos de Teste');

  // Executions Sheet
  onProgress(70);
  const executionsData = [
    ['Caso de Teste', 'Status', 'Evidência'],
    ...projectData.execution.executions.map(exec => [
      exec.caseId,
      exec.status,
      exec.evidence || ''
    ])
  ];

  const executionsWS = XLSX.utils.aoa_to_sheet(executionsData);
  XLSX.utils.book_append_sheet(wb, executionsWS, 'Execuções');

  // Defects Sheet
  onProgress(80);
  const defectsData = [
    ['Caso de Teste', 'Descrição', 'Status', 'Severidade', 'Responsável'],
    ...projectData.execution.defects.map(defect => [
      defect.caseId,
      defect.description,
      defect.status,
      defect.severity,
      defect.responsible
    ])
  ];

  const defectsWS = XLSX.utils.aoa_to_sheet(defectsData);
  XLSX.utils.book_append_sheet(wb, defectsWS, 'Defeitos');

  // Metrics Sheet
  onProgress(90);
  const metricsData = [
    ['Métrica', 'Valor'],
    ['Total de Requisitos', metrics.totalRequirements],
    ['Total de Casos de Teste', metrics.totalTestCases],
    ['Casos Executados', metrics.totalExecutions],
    ['Casos Aprovados', metrics.approvedExecutions],
    ['Taxa de Cobertura (%)', metrics.testCoverage],
    ['Taxa de Aprovação (%)', metrics.approvalRate],
    ['Total de Defeitos', metrics.totalDefects],
    ['Defeitos Abertos', metrics.openDefects],
    ['Taxa de Resolução (%)', metrics.defectResolutionRate],
    ['Taxa de Sucesso Final (%)', projectData.delivery.indicators.successRate]
  ];

  const metricsWS = XLSX.utils.aoa_to_sheet(metricsData);
  XLSX.utils.book_append_sheet(wb, metricsWS, 'Métricas');

  onProgress(100);
  return new Promise((resolve) => {
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    resolve(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  });
};

export const ExcelExporter: React.FC<ExcelExporterProps> = ({ projectData, onProgress }) => {
  return null; // This is a utility component, no UI needed
};