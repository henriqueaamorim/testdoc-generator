import React from 'react';
import * as XLSX from 'xlsx';
import { ProjectData } from '../DocumentationWizard';
import { formatDate, formatFieldValue, getDeliveryStatus } from '@/utils/exportHelpers';

interface ExcelExporterProps {
  projectData: ProjectData;
  onProgress: (progress: number) => void;
}

export const generateExcel = async (projectData: ProjectData, onProgress: (progress: number) => void): Promise<Blob> => {
  const wb = XLSX.utils.book_new();
  const deliveryStatus = getDeliveryStatus(projectData.expectedDeliveryDate, projectData.delivery.deliveryDate);

  // CABEÇALHO Sheet
  onProgress(15);
  const headerData = [
    ['CABEÇALHO', ''],
    ['Campo', 'Valor'],
    ['Nome do Projeto', formatFieldValue(projectData.projectName)],
    ['Versão do Projeto', formatFieldValue(projectData.projectVersion)],
    ['Responsável pelo Teste', formatFieldValue(projectData.testResponsible)],
    ['Data de Início', formatDate(projectData.startDate)],
    ['Data Prevista de Entrega', formatDate(projectData.expectedDeliveryDate)]
  ];

  const headerWS = XLSX.utils.aoa_to_sheet(headerData);
  XLSX.utils.book_append_sheet(wb, headerWS, 'CABEÇALHO');

  // PLANEJAMENTO Sheet
  onProgress(30);
  const planningData = [
    ['PLANEJAMENTO', ''],
    [''],
    ['FASES DO PROJETO', ''],
    ['Fase', 'Responsável', 'Data Início', 'Data Fim', 'Status']
  ];

  if (projectData.planning.phases.length === 0) {
    planningData.push(['Nenhuma fase adicionada', '', '', '', '']);
  } else {
    projectData.planning.phases.forEach(phase => {
      planningData.push([
        formatFieldValue(phase.phase),
        formatFieldValue(phase.responsible),
        formatDate(phase.startDate),
        formatDate(phase.endDate),
        formatFieldValue(phase.status)
      ]);
    });
  }

  planningData.push(['']);
  planningData.push(['ESCOPO INCLUÍDO', '']);
  if (projectData.planning.scopeIncluded.length === 0) {
    planningData.push(['Nenhum item no escopo incluído']);
  } else {
    projectData.planning.scopeIncluded.forEach(item => {
      planningData.push([item]);
    });
  }

  planningData.push(['']);
  planningData.push(['ESCOPO EXCLUÍDO', '']);
  if (projectData.planning.scopeExcluded.length === 0) {
    planningData.push(['Nenhum item no escopo excluído']);
  } else {
    projectData.planning.scopeExcluded.forEach(item => {
      planningData.push([item]);
    });
  }

  planningData.push(['']);
  planningData.push(['ESTRATÉGIAS DE TESTE', '']);
  if (projectData.planning.testStrategy.length === 0) {
    planningData.push(['Nenhuma estratégia definida']);
  } else {
    projectData.planning.testStrategy.forEach(strategy => {
      planningData.push([strategy]);
    });
  }

  planningData.push(['']);
  planningData.push(['AMBIENTE DE TESTE', '']);
  planningData.push(['Descrição', formatFieldValue(projectData.planning.environment.description)]);
  planningData.push(['URL de Acesso', formatFieldValue(projectData.planning.environment.urlAccess)]);
  planningData.push(['Equipamentos', formatFieldValue(projectData.planning.environment.equipment)]);

  planningData.push(['']);
  planningData.push(['RISCOS TÉCNICOS', '']);
  if (projectData.planning.risks.technical.length === 0) {
    planningData.push(['Nenhum risco técnico identificado']);
  } else {
    projectData.planning.risks.technical.forEach(risk => {
      planningData.push([risk]);
    });
  }

  planningData.push(['']);
  planningData.push(['RISCOS DE REQUISITOS', '']);
  if (projectData.planning.risks.requirements.length === 0) {
    planningData.push(['Nenhum risco de requisitos identificado']);
  } else {
    projectData.planning.risks.requirements.forEach(risk => {
      planningData.push([risk]);
    });
  }

  planningData.push(['']);
  planningData.push(['RISCOS DE CRONOGRAMA', '']);
  if (projectData.planning.risks.schedule.length === 0) {
    planningData.push(['Nenhum risco de cronograma identificado']);
  } else {
    projectData.planning.risks.schedule.forEach(risk => {
      planningData.push([risk]);
    });
  }

  planningData.push(['']);
  planningData.push(['RISCOS OPERACIONAIS', '']);
  if (projectData.planning.risks.operational.length === 0) {
    planningData.push(['Nenhum risco operacional identificado']);
  } else {
    projectData.planning.risks.operational.forEach(risk => {
      planningData.push([risk]);
    });
  }

  planningData.push(['']);
  planningData.push(['RISCOS DE QUALIDADE', '']);
  if (projectData.planning.risks.quality.length === 0) {
    planningData.push(['Nenhum risco de qualidade identificado']);
  } else {
    projectData.planning.risks.quality.forEach(risk => {
      planningData.push([risk]);
    });
  }

  planningData.push(['']);
  planningData.push(['Taxa de Sucesso Esperada (%)', formatFieldValue(projectData.planning.successRate)]);

  const planningWS = XLSX.utils.aoa_to_sheet(planningData);
  XLSX.utils.book_append_sheet(wb, planningWS, 'PLANEJAMENTO');

  // PROJETO Sheet
  onProgress(50);
  const projectData_ = [
    ['PROJETO', ''],
    [''],
    ['REQUISITOS', ''],
    ['ID', 'Descrição']
  ];

  if (projectData.project.requirements.length === 0) {
    projectData_.push(['Nenhum requisito adicionado', '']);
  } else {
    projectData.project.requirements.forEach(req => {
      projectData_.push([
        formatFieldValue(req.id),
        formatFieldValue(req.description)
      ]);
    });
  }

  projectData_.push(['']);
  projectData_.push(['CASOS DE TESTE', '']);
  projectData_.push(['ID', 'Funcionalidade', 'Script de Teste']);

  if (projectData.project.testCases.length === 0) {
    projectData_.push(['Nenhum caso de teste adicionado', '', '']);
  } else {
    projectData.project.testCases.forEach(tc => {
      projectData_.push([
        formatFieldValue(tc.id),
        formatFieldValue(tc.functionality),
        formatFieldValue(tc.testScript)
      ]);
    });
  }

  const projectWS = XLSX.utils.aoa_to_sheet(projectData_);
  XLSX.utils.book_append_sheet(wb, projectWS, 'PROJETO');

  // EXECUÇÃO Sheet
  onProgress(70);
  const executionData = [
    ['EXECUÇÃO', ''],
    [''],
    ['EXECUÇÕES DE TESTE', ''],
    ['Caso de Teste', 'Status', 'Evidência']
  ];

  if (projectData.execution.executions.length === 0) {
    executionData.push(['Nenhuma execução realizada', '', '']);
  } else {
    projectData.execution.executions.forEach(exec => {
      executionData.push([
        formatFieldValue(exec.caseId),
        formatFieldValue(exec.status),
        formatFieldValue(exec.evidence)
      ]);
    });
  }

  executionData.push(['']);
  executionData.push(['DEFEITOS ENCONTRADOS', '']);
  executionData.push(['Caso de Teste', 'Descrição', 'Status', 'Severidade', 'Responsável']);

  if (projectData.execution.defects.length === 0) {
    executionData.push(['Nenhum defeito encontrado', '', '', '', '']);
  } else {
    projectData.execution.defects.forEach(defect => {
      executionData.push([
        formatFieldValue(defect.caseId),
        formatFieldValue(defect.description),
        formatFieldValue(defect.status),
        formatFieldValue(defect.severity),
        formatFieldValue(defect.responsible)
      ]);
    });
  }

  const executionWS = XLSX.utils.aoa_to_sheet(executionData);
  XLSX.utils.book_append_sheet(wb, executionWS, 'EXECUÇÃO');

  // ENTREGA Sheet
  onProgress(85);
  const deliveryData = [
    ['ENTREGA', ''],
    [''],
    ['INDICADORES', ''],
    ['Métrica', 'Valor'],
    ['Casos Planejados', formatFieldValue(projectData.delivery.indicators.planned)],
    ['Casos Executados', formatFieldValue(projectData.delivery.indicators.executed)],
    ['Defeitos Abertos', formatFieldValue(projectData.delivery.indicators.openDefects)],
    ['Defeitos Corrigidos', formatFieldValue(projectData.delivery.indicators.fixedDefects)],
    ['Taxa de Sucesso (%)', formatFieldValue(projectData.delivery.indicators.successRate)],
    [''],
    ['INFORMAÇÕES DA ENTREGA', ''],
    ['Resumo da Entrega', formatFieldValue(projectData.delivery.summary)],
    ['Data de Entrega', formatDate(projectData.delivery.deliveryDate)],
    ['Status da Entrega', deliveryStatus.status]
  ];

  const deliveryWS = XLSX.utils.aoa_to_sheet(deliveryData);
  XLSX.utils.book_append_sheet(wb, deliveryWS, 'ENTREGA');

  onProgress(100);
  return new Promise((resolve) => {
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    resolve(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  });
};

export const ExcelExporter: React.FC<ExcelExporterProps> = ({ projectData, onProgress }) => {
  return null; // This is a utility component, no UI needed
};