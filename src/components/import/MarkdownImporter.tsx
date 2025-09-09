import React from 'react';
import { ProjectData } from "@/components/DocumentationWizard";
import { parseMarkdownTable } from "@/parser/table";

interface MarkdownImporterProps {
  onImport: (data: ProjectData) => void;
}

// Parse markdown content and convert to ProjectData format
export const parseMarkdownToProjectData = (content: string): ProjectData => {
  console.log('📄 [IMPORT] Starting markdown parsing...');

  // Initialize with default project structure
  const defaultData: ProjectData = {
    projectName: '',
    projectVersion: '',
    testResponsible: '',
    startDate: '',
    expectedDeliveryDate: '',
    planning: {
      phases: [],
      scopeIncluded: [],
      scopeExcluded: [],
      testStrategy: [],
      environment: {
        description: '',
        urlAccess: '',
        equipment: ''
      },
      risks: {
        technical: [],
        requirements: [],
        schedule: [],
        operational: [],
        quality: []
      },
      successRate: 0
    },
    project: {
      requirements: [],
      testCases: []
    },
    execution: {
      executions: [],
      defects: []
    },
    delivery: {
      indicators: {
        planned: 0,
        executed: 0,
        openDefects: 0,
        fixedDefects: 0,
        successRate: 0
      },
      summary: '',
      deliveryDate: ''
    }
  };

  // Helper function to get section content
  const getSectionContent = (sectionName: string): string => {
    const pattern = new RegExp(`##\\s+${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
    const match = content.match(pattern);
    return match ? match[1].trim() : '';
  };

  // --- 1. Parse CABEÇALHO ---
  const headerContent = getSectionContent('CABEÇALHO');
  if (headerContent) {
    console.log('🔍 [CABEÇALHO] Parsing header...');
    
    const extractField = (fieldName: string): string => {
      const patterns = [
        new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+)`, 'i'),
        new RegExp(`${fieldName}:\\s*(.+)`, 'i'),
        new RegExp(`-\\s*\\*\\*${fieldName}:\\*\\*\\s*(.+)`, 'i')
      ];
      
      for (const pattern of patterns) {
        const match = headerContent.match(pattern);
        if (match) return match[1].trim();
      }
      return '';
    };

    defaultData.projectName = extractField('Nome do Projeto');
    defaultData.projectVersion = extractField('Versão do Projeto');
    defaultData.testResponsible = extractField('Responsável pelo Teste');
    
    // Parse dates
    const startDateRaw = extractField('Data de Início') || extractField('Data Início');
    const deliveryDateRaw = extractField('Data Prevista de Entrega');
    
    defaultData.startDate = parseDate(startDateRaw);
    defaultData.expectedDeliveryDate = parseDate(deliveryDateRaw);
    
    console.log('✅ [CABEÇALHO] Header parsed successfully');
  }

  // --- 2. Parse PLANEJAMENTO ---
  const planningContent = getSectionContent('PLANEJAMENTO');
  if (planningContent) {
    console.log('🔍 [PLANEJAMENTO] Parsing planning section...');

    // Parse phases
    const phasesMatch = planningContent.match(/### Fases do Projeto\s*\n([\s\S]*?)(?=\n### |$)/);
    if (phasesMatch) {
      const phasesTables = parseMarkdownTable(phasesMatch[1]);
      defaultData.planning.phases = phasesTables.map(row => ({
        phase: row[0] || '',
        responsible: row[1] || '',
        startDate: parseDate(row[2] || ''),
        endDate: parseDate(row[3] || ''),
        status: row[4] || ''
      }));
      console.log('✅ [FASES] Phases imported:', defaultData.planning.phases.length);
    }

    // Parse scope
    const scopeIncludedMatch = planningContent.match(/\*\*Incluído:\*\*\s*\n([\s\S]*?)(?=\n\*\*Excluído:|$)/);
    if (scopeIncludedMatch) {
      defaultData.planning.scopeIncluded = parseMarkdownList(scopeIncludedMatch[1]);
    }

    const scopeExcludedMatch = planningContent.match(/\*\*Excluído:\*\*\s*\n([\s\S]*?)(?=\n### |$)/);
    if (scopeExcludedMatch) {
      defaultData.planning.scopeExcluded = parseMarkdownList(scopeExcludedMatch[1]);
    }

    // Parse test strategy
    const strategyMatch = planningContent.match(/### Estratégias de Teste\s*\n([\s\S]*?)(?=\n### |$)/);
    if (strategyMatch) {
      defaultData.planning.testStrategy = parseMarkdownList(strategyMatch[1]);
    }

    console.log('✅ [PLANEJAMENTO] Planning parsed successfully');
  }

  // --- 3. Parse PROJETO ---
  const projectContent = getSectionContent('PROJETO');
  if (projectContent) {
    console.log('🔍 [PROJETO] Parsing project section...');

    // Parse requirements
    const requirementsMatch = projectContent.match(/### Requisitos\s*\n([\s\S]*?)(?=\n### |$)/);
    if (requirementsMatch) {
      const reqTables = parseMarkdownTable(requirementsMatch[1]);
      defaultData.project.requirements = reqTables.map(row => ({
        id: row[0] || '',
        description: row[1] || ''
      }));
      console.log('✅ [REQUISITOS] Requirements imported:', defaultData.project.requirements.length);
    }

    // Parse test cases
    const testCasesMatch = projectContent.match(/### Casos de Teste\s*\n([\s\S]*?)(?=\n### |$)/);
    if (testCasesMatch) {
      console.log('🔍 [CASOS DE TESTE] Parsing test cases...');
      const testCases = parseTestCasesSection(testCasesMatch[1]);
      defaultData.project.testCases = testCases;
      console.log('✅ [CASOS DE TESTE] Test cases imported:', defaultData.project.testCases.length);
    }
  }

  // --- 4. Parse EXECUÇÃO ---
  const executionContent = getSectionContent('EXECUÇÃO');
  if (executionContent) {
    console.log('🔍 [EXECUÇÃO] Parsing execution section...');

    // Parse executions
    const executionsMatch = executionContent.match(/### Execuções de Teste\s*\n([\s\S]*?)(?=\n### |$)/);
    if (executionsMatch) {
      const execTables = parseMarkdownTable(executionsMatch[1]);
      defaultData.execution.executions = execTables.map(row => ({
        caseId: row[0] || '',
        status: row[1] || '',
        evidence: row[2] || ''
      }));
    }

    // Parse defects
    const defectsMatch = executionContent.match(/### Defeitos Encontrados\s*\n([\s\S]*?)(?=\n### |$)/);
    if (defectsMatch) {
      const defectTables = parseMarkdownTable(defectsMatch[1]);
      defaultData.execution.defects = defectTables.map(row => ({
        caseId: row[0] || '',
        description: row[1] || '',
        status: row[2] || '',
        severity: row[3] || '',
        responsible: row[4] || ''
      }));
    }

    console.log('✅ [EXECUÇÃO] Execution parsed successfully');
  }

  // --- 5. Parse ENTREGA ---
  const deliveryContent = getSectionContent('ENTREGA');
  if (deliveryContent) {
    console.log('🔍 [ENTREGA] Parsing delivery section...');

    // Parse indicators
    const extractIndicator = (fieldName: string): number => {
      const pattern = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(\\d+)`, 'i');
      const match = deliveryContent.match(pattern);
      return match ? parseInt(match[1], 10) : 0;
    };

    defaultData.delivery.indicators = {
      planned: extractIndicator('Casos Planejados'),
      executed: extractIndicator('Casos Executados'),
      openDefects: extractIndicator('Defeitos Abertos'),
      fixedDefects: extractIndicator('Defeitos Corrigidos'),
      successRate: extractIndicator('Taxa de Sucesso')
    };

    // Parse summary
    const summaryMatch = deliveryContent.match(/### Resumo da Entrega\s*\n([\s\S]*?)(?=\n### |$)/);
    if (summaryMatch) {
      defaultData.delivery.summary = summaryMatch[1].trim();
    }

    // Parse delivery date
    const deliveryDateMatch = deliveryContent.match(/\*\*Data de Entrega:\*\*\s*(.+)/);
    if (deliveryDateMatch) {
      defaultData.delivery.deliveryDate = parseDate(deliveryDateMatch[1].trim());
    }

    console.log('✅ [ENTREGA] Delivery parsed successfully');
  }

  console.log('📄 [IMPORT] Markdown parsing completed successfully');
  return defaultData;
};

// Helper functions
function parseMarkdownList(content: string): string[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-') || line.startsWith('•'))
    .map(line => line.replace(/^[-•]\s*/, '').trim())
    .filter(line => line.length > 0);
}

function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Brazilian format: DD/MM/YYYY
  const brMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // ISO format: YYYY-MM-DD
  const isoMatch = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return dateStr;
  }
  
  return '';
}

// Simplified test cases parsing - single table with 3 columns
const parseTestCasesSection = (sectionContent: string): Array<{id: string, functionality: string, testScript: string}> => {
  if (!sectionContent.trim()) return [];
  
  console.log('🔍 [TEST CASES] Parsing test cases (single table format)...');
  
  const tables = parseMarkdownTable(sectionContent);
  if (tables.length === 0) {
    console.log('⚠️ [TEST CASES] No tables found in section');
    return [];
  }
  
  const testCases: Array<{id: string, functionality: string, testScript: string}> = [];
  
  // Process each row as a test case
  for (let i = 0; i < tables.length; i++) {
    const row = tables[i];
    if (row.length >= 3) {
      const testCase = {
        id: row[0]?.trim() || '',
        functionality: row[1]?.trim() || '',
        testScript: (row[2]?.trim() || '').replace(/<br\s*\/?>/gi, '\n') // Convert <br> back to newlines
      };
      
      // Only add if it has valid data
      if (testCase.id && testCase.functionality) {
        testCases.push(testCase);
      }
    }
  }
  
  console.log('✅ [TEST CASES] Successfully parsed cases:', testCases.length);
  return testCases;
};

export const MarkdownImporter: React.FC<MarkdownImporterProps> = ({ onImport }) => {
  return null;
};