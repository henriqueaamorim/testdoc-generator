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

  // Font size constants
  const TITLE_SIZE = 14;     // Títulos principais
  const SUBTITLE_SIZE = 12;  // Subtítulos
  const TEXT_SIZE = 10;      // Texto normal

  const deliveryStatus = getDeliveryStatus(projectData.expectedDeliveryDate, projectData.delivery.deliveryDate);

  // Helper function to add new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Helper function to add colored section title
  const addSectionTitle = (title: string) => {
    checkNewPage(25);
    pdf.setFontSize(TITLE_SIZE);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(21, 53, 9); // #153509
    pdf.text(title, margin, yPosition);
    pdf.setTextColor(0, 0, 0); // Reset to black
    yPosition += 20; // Add more spacing after titles
  };

  // Helper function to add subtitle
  const addSubSectionTitle = (title: string) => {
    checkNewPage(15);
    pdf.setFontSize(SUBTITLE_SIZE);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(21, 53, 9); // #153509
    pdf.text(title, margin, yPosition);
    pdf.setTextColor(0, 0, 0); // Reset to black
    yPosition += 10;
  };

  // Helper function to add main title
  const addMainTitle = () => {
    pdf.setFontSize(TITLE_SIZE);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(21, 53, 9); // #153509
    const title = 'Template de Processo de Teste de Software';
    const titleWidth = pdf.getTextWidth(title);
    const titleX = (pageWidth - titleWidth) / 2;
    pdf.text(title, titleX, yPosition);
    pdf.setTextColor(0, 0, 0); // Reset to black
    yPosition += 25;
  };

  // Helper function to add header table
  const addHeaderTable = () => {
    const cellHeight = 8;
    const labelWidth = 60;
    const valueWidth = pageWidth - margin * 2 - labelWidth;
    
    const headerData = [
      ['Nome do Projeto', formatFieldValue(projectData.projectName)],
      ['Versão do Projeto', formatFieldValue(projectData.projectVersion)],
      ['Responsável pelo Teste', formatFieldValue(projectData.testResponsible)],
      ['Data de Início', formatDate(projectData.startDate)],
      ['Data Prevista de Entrega', formatDate(projectData.expectedDeliveryDate)]
    ];

    checkNewPage(headerData.length * cellHeight + 10);

    headerData.forEach((row, index) => {
      const currentY = yPosition + (index * cellHeight);
      
      // Draw label cell with green background
      pdf.setFillColor(137, 211, 137); // #89D389
      pdf.rect(margin, currentY - 5, labelWidth, cellHeight, 'F');
      
      // Draw value cell
      pdf.setFillColor(255, 255, 255);
      pdf.rect(margin + labelWidth, currentY - 5, valueWidth, cellHeight, 'F');
      
      // Draw borders
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(margin, currentY - 5, labelWidth, cellHeight, 'S');
      pdf.rect(margin + labelWidth, currentY - 5, valueWidth, cellHeight, 'S');
      
      // Add text - label (bold)
      pdf.setFontSize(TEXT_SIZE);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(row[0], margin + 2, currentY);
      
      // Add text - value (normal)
      pdf.setFont('helvetica', 'normal');
      pdf.text(row[1], margin + labelWidth + 2, currentY);
    });

    yPosition += headerData.length * cellHeight + 20; // Add spacing after table
  };

  // Helper function to add phases table
  const addPhasesTable = (phases: any[]) => {
    if (phases.length === 0) {
      pdf.setFontSize(TEXT_SIZE);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Nenhuma fase adicionada', margin + 5, yPosition);
      yPosition += 10;
      return;
    }

    const cellHeight = 8;
    const colWidths = [40, 40, 30, 30, 25]; // Fase, Responsável, Data Início, Data Fim, Status
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    
    // Check if we need a new page for the table
    checkNewPage((phases.length + 1) * cellHeight + 10);

    // Draw header
    const headers = ['Fase', 'Responsável', 'Data Início', 'Data Fim', 'Status'];
    let currentX = margin;
    
    headers.forEach((header, index) => {
      // Draw header cell
      pdf.setFillColor(200, 200, 200);
      pdf.rect(currentX, yPosition - 5, colWidths[index], cellHeight, 'F');
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(currentX, yPosition - 5, colWidths[index], cellHeight, 'S');
      
      // Add header text
      pdf.setFontSize(TEXT_SIZE);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(header, currentX + 1, yPosition);
      
      currentX += colWidths[index];
    });
    
    yPosition += cellHeight;

    // Draw data rows
    phases.forEach((phase) => {
      currentX = margin;
      const rowData = [
        formatFieldValue(phase.phase),
        formatFieldValue(phase.responsible),
        formatDate(phase.startDate),
        formatDate(phase.endDate),
        formatFieldValue(phase.status)
      ];

      rowData.forEach((data, index) => {
        // Draw cell
        pdf.setFillColor(255, 255, 255);
        pdf.rect(currentX, yPosition - 5, colWidths[index], cellHeight, 'F');
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(currentX, yPosition - 5, colWidths[index], cellHeight, 'S');
        
        // Add data text
        pdf.setFontSize(TEXT_SIZE);
        pdf.setFont('helvetica', 'normal');
        const truncatedText = pdf.splitTextToSize(data, colWidths[index] - 2);
        pdf.text(truncatedText[0] || '', currentX + 1, yPosition);
        
        currentX += colWidths[index];
      });
      
      yPosition += cellHeight;
    });

    yPosition += 10; // Add spacing after table
  };

  // Helper function to add field
  const addField = (label: string, value: any, isMultiline: boolean = false) => {
    const formattedValue = formatFieldValue(value);
    
    if (isMultiline) {
      checkNewPage(20);
      pdf.setFontSize(TEXT_SIZE);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${label}:`, margin, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(formattedValue, pageWidth - 2 * margin);
      pdf.text(lines, margin, yPosition);
      yPosition += lines.length * 6 + 5;
    } else {
      checkNewPage(8);
      pdf.setFontSize(TEXT_SIZE);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${label}: `, margin, yPosition);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(formattedValue, margin + 60, yPosition);
      yPosition += 8;
    }
  };

  // TÍTULO PRINCIPAL E CABEÇALHO
  onProgress(15);
  addMainTitle();
  addHeaderTable();

  // PLANEJAMENTO
  onProgress(30);
  addSectionTitle('PLANEJAMENTO');

  // Fases do Projeto
  addSubSectionTitle('Fases do Projeto:');

  addPhasesTable(projectData.planning.phases);

  // Escopo Incluído
  yPosition += 5;
  addField('Escopo Incluído', formatListField(projectData.planning.scopeIncluded, 'Nenhum item no escopo incluído'), true);

  // Escopo Excluído  
  addField('Escopo Excluído', formatListField(projectData.planning.scopeExcluded, 'Nenhum item no escopo excluído'), true);

  // Estratégias de Teste
  addField('Estratégias de Teste', formatListField(projectData.planning.testStrategy, 'Nenhuma estratégia definida'), true);

  // Ambiente de Teste
  yPosition += 5;
  addSubSectionTitle('Ambiente de Teste:');

  addField('Descrição', projectData.planning.environment.description, true);
  addField('URL de Acesso', projectData.planning.environment.urlAccess);
  addField('Equipamentos', projectData.planning.environment.equipment, true);

  // Riscos
  yPosition += 5;
  addSubSectionTitle('Riscos:');

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
  addSubSectionTitle('Requisitos:');

  if (projectData.project.requirements.length === 0) {
    pdf.setFontSize(TEXT_SIZE);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Nenhum requisito adicionado', margin + 5, yPosition);
    yPosition += 10;
  } else {
    projectData.project.requirements.forEach((req) => {
      checkNewPage(20);
      pdf.setFontSize(TEXT_SIZE);
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
  addSubSectionTitle('Casos de Teste:');

  if (projectData.project.testCases.length === 0) {
    pdf.setFontSize(TEXT_SIZE);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Nenhum caso de teste adicionado', margin + 5, yPosition);
    yPosition += 10;
  } else {
    projectData.project.testCases.forEach((testCase) => {
      checkNewPage(30);
      pdf.setFontSize(TEXT_SIZE);
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

  // Execução dos Casos
  addSubSectionTitle('Execução dos Casos:');

  if (projectData.execution.executions.length === 0) {
    pdf.setFontSize(TEXT_SIZE);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Nenhuma execução realizada', margin + 5, yPosition);
    yPosition += 10;
  } else {
    projectData.execution.executions.forEach((exec) => {
      checkNewPage(20);
      pdf.setFontSize(TEXT_SIZE);
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

  // Defeitos
  yPosition += 5;
  addSubSectionTitle('Defeitos:');

  if (projectData.execution.defects.length === 0) {
    pdf.setFontSize(TEXT_SIZE);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Nenhum defeito encontrado', margin + 5, yPosition);
    yPosition += 10;
  } else {
    projectData.execution.defects.forEach((defect) => {
      checkNewPage(25);
      pdf.setFontSize(TEXT_SIZE);
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
  addSubSectionTitle('Indicadores:');

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