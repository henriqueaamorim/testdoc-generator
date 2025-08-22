import React from 'react';
import jsPDF from 'jspdf';
import { ProjectData } from '../DocumentationWizard';
import { formatDate, formatFieldValue, formatListField, getDeliveryStatus } from '@/utils/exportHelpers';

interface PDFExporterProps {
  projectData: ProjectData;
  onProgress: (progress: number) => void;
}

export const generatePDF = async (projectData: ProjectData, onProgress: (progress: number) => void): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  const deliveryStatus = getDeliveryStatus(projectData.expectedDeliveryDate, projectData.delivery.deliveryDate);

  // Helper function to add new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Helper function to add section title
  const addSectionTitle = (title: string) => {
    checkNewPage(25);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, yPosition);
    yPosition += 15;
  };

  // Helper function to add field
  const addField = (label: string, value: any, isMultiline: boolean = false) => {
    const formattedValue = formatFieldValue(value);
    
    if (isMultiline) {
      checkNewPage(20);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${label}:`, margin, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(formattedValue, pageWidth - 2 * margin);
      pdf.text(lines, margin, yPosition);
      yPosition += lines.length * 6 + 5;
    } else {
      checkNewPage(8);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${label}: `, margin, yPosition);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(formattedValue, margin + 60, yPosition);
      yPosition += 8;
    }
  };

  // CABEÇALHO
  onProgress(15);
  addSectionTitle('CABEÇALHO');
  
  addField('Nome do Projeto', projectData.projectName);
  addField('Versão do Projeto', projectData.projectVersion);
  addField('Responsável pelo Teste', projectData.testResponsible);
  addField('Data de Início', formatDate(projectData.startDate));
  addField('Data Prevista de Entrega', formatDate(projectData.expectedDeliveryDate));

  // PLANEJAMENTO
  onProgress(30);
  addSectionTitle('PLANEJAMENTO');

  // Fases do Projeto
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  checkNewPage(15);
  pdf.text('Fases do Projeto:', margin, yPosition);
  yPosition += 10;

  if (projectData.planning.phases.length === 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Nenhuma fase adicionada', margin + 5, yPosition);
    yPosition += 10;
  } else {
    projectData.planning.phases.forEach((phase) => {
      checkNewPage(20);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`• ${formatFieldValue(phase.phase)}`, margin + 5, yPosition);
      yPosition += 6;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`  Responsável: ${formatFieldValue(phase.responsible)}`, margin + 10, yPosition);
      yPosition += 5;
      pdf.text(`  Data Início: ${formatDate(phase.startDate)}`, margin + 10, yPosition);
      yPosition += 5;
      pdf.text(`  Data Fim: ${formatDate(phase.endDate)}`, margin + 10, yPosition);
      yPosition += 5;
      pdf.text(`  Status: ${formatFieldValue(phase.status)}`, margin + 10, yPosition);
      yPosition += 8;
    });
  }

  // Escopo Incluído
  yPosition += 5;
  addField('Escopo Incluído', formatListField(projectData.planning.scopeIncluded, 'Nenhum item no escopo incluído'), true);

  // Escopo Excluído  
  addField('Escopo Excluído', formatListField(projectData.planning.scopeExcluded, 'Nenhum item no escopo excluído'), true);

  // Estratégias de Teste
  addField('Estratégias de Teste', formatListField(projectData.planning.testStrategy, 'Nenhuma estratégia definida'), true);

  // Ambiente de Teste
  yPosition += 5;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  checkNewPage(15);
  pdf.text('Ambiente de Teste:', margin, yPosition);
  yPosition += 10;

  addField('Descrição', projectData.planning.environment.description, true);
  addField('URL de Acesso', projectData.planning.environment.urlAccess);
  addField('Equipamentos', projectData.planning.environment.equipment, true);

  // Riscos
  yPosition += 5;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  checkNewPage(15);
  pdf.text('Riscos:', margin, yPosition);
  yPosition += 10;

  addField('Técnicos', formatListField(projectData.planning.risks.technical, 'Nenhum risco técnico identificado'), true);
  addField('Requisitos', formatListField(projectData.planning.risks.requirements, 'Nenhum risco de requisitos identificado'), true);
  addField('Cronograma', formatListField(projectData.planning.risks.schedule, 'Nenhum risco de cronograma identificado'), true);
  addField('Operacionais', formatListField(projectData.planning.risks.operational, 'Nenhum risco operacional identificado'), true);
  addField('Qualidade', formatListField(projectData.planning.risks.quality, 'Nenhum risco de qualidade identificado'), true);

  addField('Taxa de Sucesso Esperada (%)', projectData.planning.successRate);

  // PROJETO
  onProgress(50);
  addSectionTitle('PROJETO');

  // Requisitos
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  checkNewPage(15);
  pdf.text('Requisitos:', margin, yPosition);
  yPosition += 10;

  if (projectData.project.requirements.length === 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Nenhum requisito adicionado', margin + 5, yPosition);
    yPosition += 10;
  } else {
    projectData.project.requirements.forEach((req) => {
      checkNewPage(20);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${formatFieldValue(req.id)}:`, margin + 5, yPosition);
      yPosition += 6;
      
      pdf.setFont('helvetica', 'normal');
      const descLines = pdf.splitTextToSize(formatFieldValue(req.description), pageWidth - 2 * margin - 10);
      pdf.text(descLines, margin + 10, yPosition);
      yPosition += descLines.length * 6 + 5;
    });
  }

  // Casos de Teste
  yPosition += 5;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  checkNewPage(15);
  pdf.text('Casos de Teste:', margin, yPosition);
  yPosition += 10;

  if (projectData.project.testCases.length === 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Nenhum caso de teste adicionado', margin + 5, yPosition);
    yPosition += 10;
  } else {
    projectData.project.testCases.forEach((testCase) => {
      checkNewPage(30);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${formatFieldValue(testCase.id)}: ${formatFieldValue(testCase.functionality)}`, margin + 5, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Script de Teste:', margin + 10, yPosition);
      yPosition += 6;
      
      const scriptLines = pdf.splitTextToSize(formatFieldValue(testCase.testScript), pageWidth - 2 * margin - 15);
      pdf.text(scriptLines, margin + 15, yPosition);
      yPosition += scriptLines.length * 6 + 8;
    });
  }

  // EXECUÇÃO
  onProgress(70);
  addSectionTitle('EXECUÇÃO');

  // Execuções de Teste
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  checkNewPage(15);
  pdf.text('Execuções de Teste:', margin, yPosition);
  yPosition += 10;

  if (projectData.execution.executions.length === 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Nenhuma execução realizada', margin + 5, yPosition);
    yPosition += 10;
  } else {
    projectData.execution.executions.forEach((exec) => {
      checkNewPage(20);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Caso: ${formatFieldValue(exec.caseId)}`, margin + 5, yPosition);
      yPosition += 6;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Status: ${formatFieldValue(exec.status)}`, margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`Evidência: ${formatFieldValue(exec.evidence)}`, margin + 10, yPosition);
      yPosition += 8;
    });
  }

  // Defeitos Encontrados
  yPosition += 5;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  checkNewPage(15);
  pdf.text('Defeitos Encontrados:', margin, yPosition);
  yPosition += 10;

  if (projectData.execution.defects.length === 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Nenhum defeito encontrado', margin + 5, yPosition);
    yPosition += 10;
  } else {
    projectData.execution.defects.forEach((defect) => {
      checkNewPage(25);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Caso: ${formatFieldValue(defect.caseId)}`, margin + 5, yPosition);
      yPosition += 6;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Descrição: ${formatFieldValue(defect.description)}`, margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`Status: ${formatFieldValue(defect.status)}`, margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`Severidade: ${formatFieldValue(defect.severity)}`, margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`Responsável: ${formatFieldValue(defect.responsible)}`, margin + 10, yPosition);
      yPosition += 8;
    });
  }

  // ENTREGA
  onProgress(85);
  addSectionTitle('ENTREGA');

  // Indicadores
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  checkNewPage(15);
  pdf.text('Indicadores:', margin, yPosition);
  yPosition += 10;

  addField('Casos Planejados', projectData.delivery.indicators.planned);
  addField('Casos Executados', projectData.delivery.indicators.executed);
  addField('Defeitos Abertos', projectData.delivery.indicators.openDefects);
  addField('Defeitos Corrigidos', projectData.delivery.indicators.fixedDefects);
  addField('Taxa de Sucesso (%)', projectData.delivery.indicators.successRate);

  addField('Resumo da Entrega', projectData.delivery.summary, true);
  addField('Data de Entrega', formatDate(projectData.delivery.deliveryDate));
  addField('Status da Entrega', deliveryStatus.status);

  onProgress(100);
  return new Promise((resolve) => {
    resolve(pdf.output('blob'));
  });
};

export const PDFExporter: React.FC<PDFExporterProps> = ({ projectData, onProgress }) => {
  return null; // This is a utility component, no UI needed
};