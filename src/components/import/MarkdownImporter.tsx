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
      phases: [
        { phase: 'Planejamento', responsible: '', startDate: '', endDate: '', status: 'Pendente' },
        { phase: 'Projeto', responsible: '', startDate: '', endDate: '', status: 'Pendente' },
        { phase: 'Execução', responsible: '', startDate: '', endDate: '', status: 'Pendente' },
        { phase: 'Entrega', responsible: '', startDate: '', endDate: '', status: 'Pendente' },
      ],
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
      deliveryDate: new Date().toISOString().split('T')[0],
    },
  };

  try {
    // Parse CABEÇALHO
    const headerMatch = content.match(/## CABEÇALHO\s*\n\n([\s\S]*?)(?=\n## |$)/);
    if (headerMatch) {
      const headerContent = headerMatch[1];
      
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

    // Parse PLANEJAMENTO
    const planningMatch = content.match(/## PLANEJAMENTO\s*\n\n([\s\S]*?)(?=\n## |$)/);
    if (planningMatch) {
      const planningContent = planningMatch[1];

      // Parse Fases do Projeto
      const phasesMatch = planningContent.match(/### Fases do Projeto\s*\n\n([\s\S]*?)(?=\n### |$)/);
      if (phasesMatch) {
        const phasesTable = parseMarkdownTable(phasesMatch[1]);
        if (phasesTable.length > 0) {
          defaultData.planning.phases = phasesTable.map(row => ({
            phase: row[0] || '',
            responsible: row[1] || '',
            startDate: parseDate(row[2]) || '',
            endDate: parseDate(row[3]) || '',
            status: row[4] || 'Pendente'
          }));
        }
      }

      // Parse Escopo
      const scopeIncludedMatch = planningContent.match(/\*\*Incluído:\*\*\s*\n\n([\s\S]*?)(?=\n\*\*Excluído:|$)/);
      if (scopeIncludedMatch) {
        defaultData.planning.scopeIncluded = parseMarkdownList(scopeIncludedMatch[1]);
      }

      const scopeExcludedMatch = planningContent.match(/\*\*Excluído:\*\*\s*\n\n([\s\S]*?)(?=\n### |$)/);
      if (scopeExcludedMatch) {
        defaultData.planning.scopeExcluded = parseMarkdownList(scopeExcludedMatch[1]);
      }

      // Parse Estratégias de Teste
      const strategiesMatch = planningContent.match(/### Estratégias de Teste\s*\n\n([\s\S]*?)(?=\n### |$)/);
      if (strategiesMatch) {
        defaultData.planning.testStrategy = parseMarkdownList(strategiesMatch[1]);
      }

      // Parse Ambiente de Teste
      const environmentMatch = planningContent.match(/### Ambiente de Teste\s*\n\n([\s\S]*?)(?=\n### |$)/);
      if (environmentMatch) {
        const envContent = environmentMatch[1];
        const descMatch = envContent.match(/- \*\*Descrição:\*\* (.+)/);
        const urlMatch = envContent.match(/- \*\*URL de Acesso:\*\* (.+)/);
        const equipMatch = envContent.match(/- \*\*Equipamentos:\*\* (.+)/);

        if (descMatch) defaultData.planning.environment.description = descMatch[1].trim();
        if (urlMatch) defaultData.planning.environment.urlAccess = urlMatch[1].trim();
        if (equipMatch) defaultData.planning.environment.equipment = equipMatch[1].trim();
      }

      // Parse Riscos
      const risksMatch = planningContent.match(/### Riscos\s*\n\n([\s\S]*?)(?=\n- \*\*Taxa de Sucesso|\n### |$)/);
      if (risksMatch) {
        const risksContent = risksMatch[1];
        
        const technicalMatch = risksContent.match(/\*\*Técnicos:\*\*\s*\n\n([\s\S]*?)(?=\n\*\*Requisitos:|$)/);
        if (technicalMatch) defaultData.planning.risks.technical = parseMarkdownList(technicalMatch[1]);

        const requirementsMatch = risksContent.match(/\*\*Requisitos:\*\*\s*\n\n([\s\S]*?)(?=\n\*\*Cronograma:|$)/);
        if (requirementsMatch) defaultData.planning.risks.requirements = parseMarkdownList(requirementsMatch[1]);

        const scheduleMatch = risksContent.match(/\*\*Cronograma:\*\*\s*\n\n([\s\S]*?)(?=\n\*\*Operacionais:|$)/);
        if (scheduleMatch) defaultData.planning.risks.schedule = parseMarkdownList(scheduleMatch[1]);

        const operationalMatch = risksContent.match(/\*\*Operacionais:\*\*\s*\n\n([\s\S]*?)(?=\n\*\*Qualidade:|$)/);
        if (operationalMatch) defaultData.planning.risks.operational = parseMarkdownList(operationalMatch[1]);

        const qualityMatch = risksContent.match(/\*\*Qualidade:\*\*\s*\n\n([\s\S]*?)(?=\n|$)/);
        if (qualityMatch) defaultData.planning.risks.quality = parseMarkdownList(qualityMatch[1]);
      }

      // Parse Taxa de Sucesso
      const successRateMatch = planningContent.match(/- \*\*Taxa de Sucesso Esperada:\*\* (\d+)%/);
      if (successRateMatch) {
        defaultData.planning.successRate = parseInt(successRateMatch[1]);
      }
    }

    // Parse PROJETO
    const projectMatch = content.match(/## PROJETO\s*\n\n([\s\S]*?)(?=\n## |$)/);
    if (projectMatch) {
      const projectContent = projectMatch[1];

      // Parse Requisitos
      const requirementsMatch = projectContent.match(/### Requisitos\s*\n\n([\s\S]*?)(?=\n### |$)/);
      if (requirementsMatch) {
        const reqTable = parseMarkdownTable(requirementsMatch[1]);
        defaultData.project.requirements = reqTable.map(row => ({
          id: row[0] || '',
          description: row[1] || ''
        }));
      }

      // Parse Casos de Teste
      const testCasesMatch = projectContent.match(/### Casos de Teste\s*\n\n([\s\S]*?)(?=\n# |$)/);
      if (testCasesMatch) {
        const testTable = parseMarkdownTable(testCasesMatch[1]);
        defaultData.project.testCases = testTable.map(row => ({
          id: row[0] || '',
          functionality: row[1] || '',
          testScript: row[2] || ''
        }));
      }
    }

    // Parse EXECUÇÃO
    const executionMatch = content.match(/## EXECUÇÃO\s*\n\n([\s\S]*?)(?=\n## |$)/);
    if (executionMatch) {
      const executionContent = executionMatch[1];

      // Parse Execuções de Teste
      const executionsMatch = executionContent.match(/### Execuções de Teste\s*\n\n([\s\S]*?)(?=\n### |$)/);
      if (executionsMatch) {
        const execTable = parseMarkdownTable(executionsMatch[1]);
        defaultData.execution.executions = execTable.map(row => ({
          caseId: row[0] || '',
          status: row[1] || '',
          evidence: row[2] || ''
        }));
      }

      // Parse Defeitos Encontrados
      const defectsMatch = executionContent.match(/### Defeitos Encontrados\s*\n\n([\s\S]*?)(?=\n### |$)/);
      if (defectsMatch) {
        const defectTable = parseMarkdownTable(defectsMatch[1]);
        defaultData.execution.defects = defectTable.map(row => ({
          caseId: row[0] || '',
          description: row[1] || '',
          status: row[2] || '',
          severity: row[3] || '',
          responsible: row[4] || ''
        }));
      }
    }

    // Parse ENTREGA
    const deliveryMatch = content.match(/## ENTREGA\s*\n\n([\s\S]*?)(?=\n## |$)/);
    if (deliveryMatch) {
      const deliveryContent = deliveryMatch[1];

      // Parse Indicadores
      const plannedMatch = deliveryContent.match(/- \*\*Casos Planejados:\*\* (\d+)/);
      const executedMatch = deliveryContent.match(/- \*\*Casos Executados:\*\* (\d+)/);
      const openDefectsMatch = deliveryContent.match(/- \*\*Defeitos Abertos:\*\* (\d+)/);
      const fixedDefectsMatch = deliveryContent.match(/- \*\*Defeitos Corrigidos:\*\* (\d+)/);
      const successRateDeliveryMatch = deliveryContent.match(/- \*\*Taxa de Sucesso:\*\* (\d+)%/);

      if (plannedMatch) defaultData.delivery.indicators.planned = parseInt(plannedMatch[1]);
      if (executedMatch) defaultData.delivery.indicators.executed = parseInt(executedMatch[1]);
      if (openDefectsMatch) defaultData.delivery.indicators.openDefects = parseInt(openDefectsMatch[1]);
      if (fixedDefectsMatch) defaultData.delivery.indicators.fixedDefects = parseInt(fixedDefectsMatch[1]);
      if (successRateDeliveryMatch) defaultData.delivery.indicators.successRate = parseInt(successRateDeliveryMatch[1]);

      // Parse Resumo da Entrega
      const summaryMatch = deliveryContent.match(/### Resumo da Entrega\s*\n\n([\s\S]*?)(?=\n### |$)/);
      if (summaryMatch) {
        defaultData.delivery.summary = summaryMatch[1].trim();
      }

      // Parse Data de Entrega
      const deliveryDateMatch = deliveryContent.match(/- \*\*Data de Entrega:\*\* (.+)/);
      if (deliveryDateMatch) {
        defaultData.delivery.deliveryDate = parseDate(deliveryDateMatch[1].trim());
      }
    }

    return defaultData;
  } catch (error) {
    console.error('Erro ao fazer parse do Markdown:', error);
    throw new Error('Formato de arquivo inválido. Verifique se o arquivo está no formato correto.');
  }
};

// Substituir parseMarkdownTable atual por este
const parseMarkdownTable = (content: string): string[][] => {
  // 1) Normaliza e captura linhas que pareçam de tabela (com ou sem '|' no fim)
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const tableLines = lines.filter(l => /^\|/.test(l) || /(\S)\s*\|\s*(\S)/.test(l));
  if (tableLines.length < 2) return [];

  // 2) Garante '|' no início e no fim (facilita o split)
  const normalized = tableLines.map(l => {
    let s = l;
    if (!s.startsWith('|')) s = '|' + s;
    if (!s.endsWith('|')) s = s + '|';
    return s;
  });

  // 3) Remove a linha separadora (2ª linha) do tipo ---/:---:
  const sepRegex = /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|$/;
  const withoutSep = normalized.filter((_, i) => i !== 1 || !sepRegex.test(normalized[1]));

  // 4) Remove o cabeçalho (1ª linha restante)
  const dataRows = withoutSep.slice(1);

  // 5) Faz o split das células e remove linhas que são placeholders (ex.: '---')
  const rows = dataRows.map(line =>
    line.slice(1, -1).split('|').map(c => c.trim())
  );

  // descarta linhas sem conteúdo real (tudo '---' ou '-')
  const isRealRow = (cells: string[]) => cells.some(c => c && c !== '---' && c !== '-');
  return rows.filter(isRealRow);
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