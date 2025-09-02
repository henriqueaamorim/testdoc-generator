import { ProjectData } from "@/components/DocumentationWizard";

export const parseMarkdownToProjectData = (content: string): ProjectData => {
  // Inicializar com dados padrão
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
      environment: { description: '', urlAccess: '', equipment: '' },
      risks: { technical: [], requirements: [], schedule: [], operational: [], quality: [] },
      successRate: 0,
    },
    project: { requirements: [], testCases: [] },
    execution: { executions: [], defects: [] },
    delivery: {
      indicators: { planned: 0, executed: 0, openDefects: 0, fixedDefects: 0, successRate: 0 },
      summary: '',
      deliveryDate: '',
      finalStatus: '', // Adicionado para corresponder ao arquivo .md
    },
  };

  try {
    // Função auxiliar robusta para extrair o conteúdo de uma seção principal
    const getSectionContent = (sectionTitle: string): string | null => {
      const regex = new RegExp(`## ${sectionTitle}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
      const match = content.match(regex);
      return match ? match[1].trim() : null;
    };

    // --- 1. Parse CABEÇALHO ---
    const headerContent = getSectionContent('CABEÇALHO');
    if (headerContent) {
      const projectNameMatch = headerContent.match(/- \*\*Nome do Projeto:\*\* (.+)/);
      const projectVersionMatch = headerContent.match(/- \*\*Versão do Projeto:\*\* (.+)/);
      const testResponsibleMatch = headerContent.match(/- \*\*Responsável pelo Teste:\*\* (.+)/);
      const startDateMatch = headerContent.match(/- \*\*Data de Início:\*\* (.+)/);
      const deliveryDateMatch = headerContent.match(/- \*\*Data Prevista de Entrega:\*\* (.+)/);

      if (projectNameMatch) defaultData.projectName = projectNameMatch[1].trim();
      if (projectVersionMatch) defaultData.projectVersion = projectVersionMatch[1].trim();
      if (testResponsibleMatch) defaultData.testResponsible = testResponsibleMatch[1].trim();
      if (startDateMatch) defaultData.startDate = parseDate(startDateMatch[1].trim());
      if (deliveryDateMatch) defaultData.expectedDeliveryDate = parseDate(deliveryDateMatch[1].trim());
    }

    // --- 2. Parse PLANEJAMENTO ---
    const planningContent = getSectionContent('PLANEJAMENTO');
    if (planningContent) {
      const getSubSection = (title: string) => planningContent.match(new RegExp(`### ${title}\\s*\\n([\\s\\S]*?)(?=\\n### |$)`));
      
      const phasesMatch = getSubSection('Fases do Projeto');
      if (phasesMatch) {
          defaultData.planning.phases = parseMarkdownTable(phasesMatch[1]).map(row => ({
            phase: row[0] || '', responsible: row[1] || '',
            startDate: parseDate(row[2]) || '', endDate: parseDate(row[3]) || '',
            status: row[4] || 'Pendente'
          }));
      }

      const scopeIncludedMatch = planningContent.match(/\*\*Incluído:\*\*\s*\n([\s\S]*?)(?=\n\*\*Excluído:|$)/);
      if (scopeIncludedMatch) defaultData.planning.scopeIncluded = parseMarkdownList(scopeIncludedMatch[1]);
      
      const scopeExcludedMatch = planningContent.match(/\*\*Excluído:\*\*\s*\n([\s\S]*?)(?=\n### |$)/);
      if (scopeExcludedMatch) defaultData.planning.scopeExcluded = parseMarkdownList(scopeExcludedMatch[1]);

      const strategiesMatch = getSubSection('Estratégias de Teste');
      if (strategiesMatch) defaultData.planning.testStrategy = parseMarkdownList(strategiesMatch[1]);

      const environmentMatch = getSubSection('Ambiente de Teste');
      if (environmentMatch) {
        const descMatch = environmentMatch[1].match(/- \*\*Descrição:\*\* (.+)/);
        const urlMatch = environmentMatch[1].match(/- \*\*URL de Acesso:\*\* (.+)/);
        const equipMatch = environmentMatch[1].match(/- \*\*Equipamentos:\*\* (.+)/);
        if (descMatch) defaultData.planning.environment.description = descMatch[1].trim();
        if (urlMatch) defaultData.planning.environment.urlAccess = urlMatch[1].trim();
        if (equipMatch) defaultData.planning.environment.equipment = equipMatch[1].trim();
      }

      const risksMatch = planningContent.match(/### Riscos\s*\n([\s\S]*?)(?=- \*\*Taxa de Sucesso Esperada:|$)/);
      if (risksMatch) {
        const risksContent = risksMatch[1];
        const getRiskList = (title: string) => {
            const riskRegex = new RegExp(`\\*\\*${title}:\\*\\*\\s*\\n([\\s\\S]*?)(?=\\n\\*\\*|$)`);
            const match = risksContent.match(riskRegex);
            return match ? parseMarkdownList(match[1]) : [];
        };
        defaultData.planning.risks.technical = getRiskList('Técnicos');
        defaultData.planning.risks.requirements = getRiskList('Requisitos');
        defaultData.planning.risks.schedule = getRiskList('Cronograma');
        defaultData.planning.risks.operational = getRiskList('Operacionais');
        defaultData.planning.risks.quality = getRiskList('Qualidade');
      }
      
      const successRateMatch = planningContent.match(/- \*\*Taxa de Sucesso Esperada:\*\* (\d+)%/);
      if (successRateMatch) defaultData.planning.successRate = parseInt(successRateMatch[1], 10);
    }

    // --- 3. Parse PROJETO ---
    const projectContent = getSectionContent('PROJETO');
    if (projectContent) {
        const requirementsMatch = projectContent.match(/### Requisitos\s*\n([\s\S]*?)(?=\n### |$)/);
        if (requirementsMatch) {
            defaultData.project.requirements = parseMarkdownTable(requirementsMatch[1]).map(row => ({
                id: row[0] || '', description: row[1] || ''
            }));
        }
        const testCasesMatch = projectContent.match(/### Casos de Teste\s*\n([\s\S]*?)(?=\n## |$)/);
        if (testCasesMatch) {
            defaultData.project.testCases = parseMarkdownTable(testCasesMatch[1]).map(row => ({
                id: row[0] || '', functionality: row[1] || '', testScript: row[2] || ''
            }));
        }
    }

    // --- 4. Parse EXECUÇÃO ---
    const executionContent = getSectionContent('EXECUÇÃO');
    if (executionContent) {
        const executionsMatch = executionContent.match(/### Execuções de Teste\s*\n([\s\S]*?)(?=\n### |$)/);
        if (executionsMatch) {
            defaultData.execution.executions = parseMarkdownTable(executionsMatch[1]).map(row => ({
                caseId: row[0] || '', status: row[1] || '', evidence: row[2] || ''
            }));
        }
        const defectsMatch = executionContent.match(/### Defeitos Encontrados\s*\n([\s\S]*?)(?=\n## |$)/);
        if (defectsMatch) {
            defaultData.execution.defects = parseMarkdownTable(defectsMatch[1]).map(row => ({
                caseId: row[0] || '', description: row[1] || '', status: row[2] || '',
                severity: row[3] || '', responsible: row[4] || ''
            }));
        }
    }

    // --- 5. Parse ENTREGA ---
    const deliveryContent = getSectionContent('ENTREGA');
    if (deliveryContent) {
        const plannedMatch = deliveryContent.match(/- \*\*Casos Planejados:\*\* (\d+)/);
        if (plannedMatch) defaultData.delivery.indicators.planned = parseInt(plannedMatch[1], 10);
        
        const executedMatch = deliveryContent.match(/- \*\*Casos Executados:\*\* (\d+)/);
        if (executedMatch) defaultData.delivery.indicators.executed = parseInt(executedMatch[1], 10);

        const openDefectsMatch = deliveryContent.match(/- \*\*Defeitos Abertos:\*\* (\d+)/);
        if (openDefectsMatch) defaultData.delivery.indicators.openDefects = parseInt(openDefectsMatch[1], 10);

        const fixedDefectsMatch = deliveryContent.match(/- \*\*Defeitos Corrigidos:\*\* (\d+)/);
        if (fixedDefectsMatch) defaultData.delivery.indicators.fixedDefects = parseInt(fixedDefectsMatch[1], 10);

        const successRateDeliveryMatch = deliveryContent.match(/- \*\*Taxa de Sucesso:\*\* (\d+)%/);
        if (successRateDeliveryMatch) defaultData.delivery.indicators.successRate = parseInt(successRateDeliveryMatch[1], 10);

        const summaryMatch = deliveryContent.match(/### Resumo da Entrega\s*\n([\s\S]*?)(?=\n### |$)/);
        if (summaryMatch) defaultData.delivery.summary = summaryMatch[1].trim();

        const deliveryDateMatch = deliveryContent.match(/- \*\*Data de Entrega:\*\* (.+)/);
        if (deliveryDateMatch) defaultData.delivery.deliveryDate = parseDate(deliveryDateMatch[1].trim());

        const finalStatusMatch = deliveryContent.match(/- \*\*Status da Entrega:\*\* (.+)/);
        if (finalStatusMatch) defaultData.delivery.finalStatus = finalStatusMatch[1].trim();
    }

    return defaultData;
  } catch (error) {
    console.error('Erro ao fazer parse do Markdown:', error);
    throw new Error('Formato de arquivo inválido. Verifique se o arquivo está no formato correto.');
  }
};

// Funções auxiliares
const parseMarkdownTable = (content: string): string[][] => {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Encontra e remove a linha separadora (ex: |---|---|)
  // para garantir que estamos processando apenas linhas de dados.
  const separatorIndex = lines.findIndex(line => line.match(/^\|[\s\-\:]+\|$/));
  if (separatorIndex === -1) {
    // Se não houver separador, a tabela está mal formatada. Retorna vazio.
    return [];
  }

  const dataLines = lines.slice(separatorIndex + 1);
  const table: string[][] = [];

  for (const line of dataLines) {
    const trimmedLine = line.trim();

    // Se a linha começa com '|', ela é uma nova linha da tabela.
    if (trimmedLine.startsWith('|')) {
      const newRow = trimmedLine
        .split('|')
        .slice(1, -1) // Remove o primeiro e último elemento (vazios)
        .map(cell => cell.trim());
      table.push(newRow);
    }
    // Se a linha NÃO começa com '|' e já existem linhas na nossa tabela,
    // então este texto é uma continuação da última célula da linha anterior.
    else if (table.length > 0) {
      const lastRow = table[table.length - 1];
      const lastCellIndex = lastRow.length - 1;

      if (lastCellIndex >= 0) {
        // Anexa o conteúdo da nova linha na última célula da linha anterior,
        // adicionando um caractere de quebra de linha `\n` para manter a formatação.
        lastRow[lastCellIndex] = (lastRow[lastCellIndex] + '\n' + trimmedLine).trim();
      }
    }
  }

  return table;
};

const parseMarkdownList = (content: string): string[] => {
  const lines = content.split('\n')
    .filter(line => line.trim())
    .map(line => line.trim());
  
  const listItems = lines
    .filter(line => line.startsWith('- '))
    .map(line => line.substring(2).trim())
    .filter(item => item && item !== 'Nenhum item adicionado' && item !== 'Nenhuma estratégia adicionada' && item !== 'Nenhum risco identificado');
  
  return listItems;
};

const parseDate = (dateStr: string): string => {
  if (!dateStr || dateStr === 'Não definido' || dateStr === '-') return '';
  
  // Detectar formato brasileiro DD/MM/YYYY com regex mais rigoroso
  const brazilianDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const brazilianMatch = dateStr.match(brazilianDateRegex);
  
  if (brazilianMatch) {
    const [, day, month, year] = brazilianMatch;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Validações mais rigorosas para formato brasileiro
    if (dayNum >= 1 && dayNum <= 31 && 
        monthNum >= 1 && monthNum <= 12 && 
        yearNum >= 1900 && yearNum <= 2100) {
      
      // Criar data e validar se é válida (ex: 31/02 seria inválido)
      const parsedDate = new Date(yearNum, monthNum - 1, dayNum);
      if (parsedDate.getFullYear() === yearNum && 
          parsedDate.getMonth() === monthNum - 1 && 
          parsedDate.getDate() === dayNum) {
        return parsedDate.toISOString().split('T')[0];
      }
    }
  }
  
  // Fallback para formato ISO (YYYY-MM-DD)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  return '';
};