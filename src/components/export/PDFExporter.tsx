import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ProjectData } from '../DocumentationWizard';
import { formatDate, generateDocumentTitle, calculateProjectMetrics, getDeliveryStatus } from '@/utils/exportHelpers';

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

  const metrics = calculateProjectMetrics(projectData);
  const deliveryStatus = getDeliveryStatus(projectData.expectedDeliveryDate, projectData.delivery.deliveryDate);

  // Helper function to add new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Title page
  onProgress(10);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(generateDocumentTitle(projectData), pageWidth / 2, yPosition + 20, { align: 'center' });
  
  yPosition += 40;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Responsável: ${projectData.testResponsible}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.text(`Data de Geração: ${formatDate(new Date().toISOString().split('T')[0])}`, pageWidth / 2, yPosition, { align: 'center' });

  // Project Information
  onProgress(20);
  pdf.addPage();
  yPosition = margin;
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('1. Informações do Projeto', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const projectInfo = [
    `Projeto: ${projectData.projectName}`,
    `Versão: ${projectData.projectVersion}`,
    `Responsável: ${projectData.testResponsible}`,
    `Data de Início: ${formatDate(projectData.startDate)}`,
    `Data Prevista: ${formatDate(projectData.expectedDeliveryDate)}`,
    `Data de Entrega: ${formatDate(projectData.delivery.deliveryDate)}`,
    `Status da Entrega: ${deliveryStatus.status}`
  ];

  projectInfo.forEach(info => {
    pdf.text(info, margin, yPosition);
    yPosition += 8;
  });

  // Planning Section
  onProgress(30);
  yPosition += 10;
  checkNewPage(60);
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('2. Planejamento', margin, yPosition);
  yPosition += 15;

  // Test Environment
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Ambiente de Teste:', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  if (projectData.planning.environment.description) {
    const envLines = pdf.splitTextToSize(projectData.planning.environment.description, pageWidth - 2 * margin);
    pdf.text(envLines, margin, yPosition);
    yPosition += envLines.length * 6;
  }

  // Test Strategy
  yPosition += 5;
  checkNewPage(40);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Estratégias de Teste:', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  projectData.planning.testStrategy.forEach(strategy => {
    pdf.text(`• ${strategy}`, margin + 5, yPosition);
    yPosition += 6;
  });

  // Requirements Section
  onProgress(40);
  yPosition += 10;
  checkNewPage(60);
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('3. Requisitos', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  projectData.project.requirements.forEach((req, index) => {
    checkNewPage(15);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${req.id}:`, margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    
    const descLines = pdf.splitTextToSize(req.description, pageWidth - 2 * margin - 30);
    pdf.text(descLines, margin + 30, yPosition);
    yPosition += Math.max(descLines.length * 6, 8);
  });

  // Test Cases Section
  onProgress(60);
  yPosition += 10;
  checkNewPage(60);
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('4. Casos de Teste', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(12);
  projectData.project.testCases.forEach((testCase, index) => {
    checkNewPage(25);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${testCase.id}: ${testCase.functionality}`, margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    const scriptLines = pdf.splitTextToSize(testCase.testScript, pageWidth - 2 * margin - 10);
    pdf.text(scriptLines, margin + 5, yPosition);
    yPosition += scriptLines.length * 6 + 5;
  });

  // Execution Results
  onProgress(80);
  yPosition += 10;
  checkNewPage(60);
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('5. Resultados da Execução', margin, yPosition);
  yPosition += 15;

  // Metrics Summary
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Resumo de Métricas:', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const metricsInfo = [
    `Total de Requisitos: ${metrics.totalRequirements}`,
    `Total de Casos de Teste: ${metrics.totalTestCases}`,
    `Casos Executados: ${metrics.totalExecutions}`,
    `Casos Aprovados: ${metrics.approvedExecutions}`,
    `Taxa de Aprovação: ${metrics.approvalRate}%`,
    `Total de Defeitos: ${metrics.totalDefects}`,
    `Defeitos Abertos: ${metrics.openDefects}`,
    `Taxa de Resolução: ${metrics.defectResolutionRate}%`,
    `Taxa de Sucesso Final: ${projectData.delivery.indicators.successRate}%`
  ];

  metricsInfo.forEach(metric => {
    checkNewPage(8);
    pdf.text(metric, margin, yPosition);
    yPosition += 6;
  });

  // Summary and Conclusions
  onProgress(90);
  yPosition += 10;
  checkNewPage(40);
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('6. Conclusões', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  if (projectData.delivery.summary) {
    const summaryLines = pdf.splitTextToSize(projectData.delivery.summary, pageWidth - 2 * margin);
    pdf.text(summaryLines, margin, yPosition);
  }

  onProgress(100);
  return new Promise((resolve) => {
    resolve(pdf.output('blob'));
  });
};

export const PDFExporter: React.FC<PDFExporterProps> = ({ projectData, onProgress }) => {
  return null; // This is a utility component, no UI needed
};