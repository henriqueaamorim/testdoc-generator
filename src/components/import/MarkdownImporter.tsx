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
            console.log('🔍 [REQUISITOS] Conteúdo encontrado:', requirementsMatch[1].substring(0, 200));
            const requirementsTable = parseMarkdownTable(requirementsMatch[1]);
            console.log('🔍 [REQUISITOS] Tabela parseada:', requirementsTable);
            
            defaultData.project.requirements = requirementsTable.map((row, index) => {
                console.log(`✅ [REQUISITOS] Processando linha ${index + 1}:`, row);
                return {
                    id: row[0] || `REQ${String(index + 1).padStart(3, '0')}`,
                    description: row[1] || ''
                };
            });
            
            console.log('✅ [REQUISITOS] Total importados:', defaultData.project.requirements.length);
        }
        const testCasesMatch = projectContent.match(/### Casos de Teste\s*\n([\s\S]*?)(?=\n## |$)/);
        if (testCasesMatch) {
            console.log('🔍 [CASOS DE TESTE] Conteúdo encontrado:', testCasesMatch[1].substring(0, 200));
            const testCases = parseTestCasesSection(testCasesMatch[1]);
            console.log('🔍 [CASOS DE TESTE] Casos parseados:', testCases);
            
            defaultData.project.testCases = testCases;
            console.log('✅ [CASOS DE TESTE] Total importados:', defaultData.project.testCases.length);
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

        // Status da entrega removido - não faz parte da interface ProjectData
    }

    return defaultData;
  } catch (error) {
    console.error('Erro ao fazer parse do Markdown:', error);
    throw new Error('Formato de arquivo inválido. Verifique se o arquivo está no formato correto.');
  }
};

// Funções auxiliares
const parseMarkdownTable = (content: string): string[][] => {
  console.log('🔍 [PARSER] Iniciando parse da tabela:', content.substring(0, 100) + '...');
  
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    console.warn('⚠️ [PARSER] Tabela muito pequena, retornando vazio');
    return [];
  }

  // Melhor regex para detectar linha separadora
  const separatorRegex = /^\|[\s\-\:\|]+\|$/;
  const separatorIndex = lines.findIndex(line => separatorRegex.test(line.trim()));
  
  console.log('🔍 [PARSER] Linhas encontradas:', lines.length);
  console.log('🔍 [PARSER] Índice do separador:', separatorIndex);
  
  if (separatorIndex === -1) {
    console.warn('⚠️ [PARSER] Nenhum separador encontrado, tentando processar como tabela simples');
    // Fallback: processar todas as linhas que contêm '|'
    const tableLines = lines.filter(line => line.includes('|') && !line.match(/^\s*\|[\s\-\:\|]*\|\s*$/));
    return tableLines.map(line => 
      line.split('|').slice(1, -1).map(cell => cell.trim())
    ).filter(row => row.some(cell => cell.length > 0));
  }

  // Processar apenas as linhas de dados (após o separador)
  const dataLines = lines.slice(separatorIndex + 1);
  console.log('🔍 [PARSER] Linhas de dados a processar:', dataLines.length);
  
  const table: string[][] = [];

  for (const line of dataLines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      const cells = trimmedLine
        .split('|')
        .slice(1, -1) // Remove bordas vazias
        .map(cell => cell.trim());
      
      // Só adicionar se a linha tem conteúdo válido
      if (cells.some(cell => cell.length > 0)) {
        table.push(cells);
        console.log('✅ [PARSER] Linha adicionada:', cells);
      }
    }
    // Continuação de célula (multi-linha)
    else if (table.length > 0 && trimmedLine.length > 0) {
      const lastRow = table[table.length - 1];
      const lastCellIndex = lastRow.length - 1;
      if (lastCellIndex >= 0) {
        lastRow[lastCellIndex] = (lastRow[lastCellIndex] + '\n' + trimmedLine).trim();
      }
    }
  }

  console.log('✅ [PARSER] Tabela processada com', table.length, 'linhas');
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

// Interface for parsed tables
interface ParsedTable {
  header: string[];
  separatorLine: string;
  dataRows: string[][];
  afterContent?: string;
}

// Detect test case format (list or table)
function detectTestCaseFormat(content: string): 'list' | 'table' | 'unknown' {
  const idTableCount = (content.match(/\|\s*ID\s*\|/gi) || []).length;
  if (idTableCount > 1) return 'list';
  
  if (content.includes('| ID | Funcionalidade | Script |') || 
      content.includes('|ID|Funcionalidade|Script|')) return 'table';
  
  return 'unknown';
}

// Split content into test case blocks using --- separators
function splitIntoTestCaseBlocks(content: string): string[] {
  const blocks = content.split(/^---+$/m).map(block => block.trim()).filter(block => block);
  
  // If no separators found, treat entire content as single block
  if (blocks.length <= 1) {
    // Look for multiple ID tables to split
    const lines = content.split('\n');
    const idTableIndices: number[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^\|\s*ID\s*\|$/i)) {
        idTableIndices.push(i);
      }
    }
    
    if (idTableIndices.length > 1) {
      const splitBlocks: string[] = [];
      for (let i = 0; i < idTableIndices.length; i++) {
        const start = idTableIndices[i];
        const end = i < idTableIndices.length - 1 ? idTableIndices[i + 1] : lines.length;
        const blockLines = lines.slice(start, end);
        splitBlocks.push(blockLines.join('\n').trim());
      }
      return splitBlocks;
    }
  }
  
  return blocks;
}

// Extract tables from a content block
function extractTablesFromBlock(block: string): ParsedTable[] {
  const lines = block.split('\n');
  const tables: ParsedTable[] = [];
  let currentTable: Partial<ParsedTable> | null = null;
  let afterTableContent: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for table header
    if (line.match(/^\|\s*([^|]+)\s*\|$/)) {
      // Save previous table if exists
      if (currentTable && currentTable.header) {
        if (afterTableContent.length > 0) {
          currentTable.afterContent = afterTableContent.join('\n').trim();
        }
        tables.push(currentTable as ParsedTable);
      }
      
      // Start new table
      const headerMatch = line.match(/^\|\s*([^|]+)\s*\|$/);
      currentTable = {
        header: [headerMatch![1].trim()],
        separatorLine: '',
        dataRows: [],
        afterContent: ''
      };
      afterTableContent = [];
      continue;
    }
    
    // Check for separator line
    if (currentTable && line.match(/^\|\s*[-:]+\s*\|$/)) {
      currentTable.separatorLine = line;
      continue;
    }
    
    // Check for data line
    if (currentTable && line.match(/^\|\s*([^|]*)\s*\|$/)) {
      const dataMatch = line.match(/^\|\s*([^|]*)\s*\|$/);
      currentTable.dataRows.push([dataMatch![1].trim()]);
      continue;
    }
    
    // Check for script content ending with |
    if (currentTable && line.endsWith('|') && !line.startsWith('|')) {
      const content = line.slice(0, -1).trim();
      if (content) {
        afterTableContent.push(content);
      }
      continue;
    }
    
    // Regular content line (for script content)
    if (currentTable && line) {
      afterTableContent.push(line);
    }
  }
  
  // Save last table
  if (currentTable && currentTable.header) {
    if (afterTableContent.length > 0) {
      currentTable.afterContent = afterTableContent.join('\n').trim();
    }
    tables.push(currentTable as ParsedTable);
  }
  
  return tables;
}

// Extract cell value from a parsed table
function extractCellValue(table: ParsedTable): string {
  return table.dataRows[0]?.[0] || '';
}

// Extract script content handling multiline content
function extractScriptContent(table: ParsedTable): string {
  const cellContent = table.dataRows[0]?.[0] || '';
  const freeContent = table.afterContent || '';
  
  const fullContent = (cellContent + '\n' + freeContent).trim();
  return normalizeScriptContent(fullContent);
}

// Normalize script content
function normalizeScriptContent(content: string): string {
  if (!content) return '';
  
  // Split into lines and process
  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    // Remove leading pipes if present
    let processed = line.replace(/^\|\s*/, '').trimEnd();
    return processed;
  });
  
  // Remove empty lines at start and end
  while (processedLines.length > 0 && !processedLines[0].trim()) {
    processedLines.shift();
  }
  while (processedLines.length > 0 && !processedLines[processedLines.length - 1].trim()) {
    processedLines.pop();
  }
  
  return processedLines.join('\n');
}

// Parse test case from a single block (list format)
function parseTestCaseBlock(block: string): {id: string, functionality: string, testScript: string} | null {
  console.log('🔍 [TEST CASES] Parsing block:', block.substring(0, 100) + '...');
  
  const tables = extractTablesFromBlock(block);
  console.log('🔍 [TEST CASES] Tables found:', tables.length);
  
  // Find specific tables
  const idTable = tables.find(t => t.header.some(h => h.toLowerCase().includes('id')));
  const funcTable = tables.find(t => t.header.some(h => h.toLowerCase().includes('funcionalidade')));
  const scriptTable = tables.find(t => t.header.some(h => h.toLowerCase().includes('script')));
  
  if (!idTable || !funcTable || !scriptTable) {
    console.log('⚠️ [TEST CASES] Missing required tables - ID:', !!idTable, 'Func:', !!funcTable, 'Script:', !!scriptTable);
    return null;
  }
  
  const testCase = {
    id: extractCellValue(idTable),
    functionality: extractCellValue(funcTable),
    testScript: extractScriptContent(scriptTable)
  };
  
  console.log('✅ [TEST CASES] Parsed test case:', testCase.id);
  return testCase;
}

// Parse test cases in list format
function parseTestCasesListFormat(content: string): Array<{id: string, functionality: string, testScript: string}> {
  console.log('🔍 [TEST CASES] Parsing list format');
  
  const testCaseBlocks = splitIntoTestCaseBlocks(content);
  console.log('🔍 [TEST CASES] Blocks found:', testCaseBlocks.length);
  
  const testCases = testCaseBlocks
    .map(block => parseTestCaseBlock(block))
    .filter((tc): tc is {id: string, functionality: string, testScript: string} => tc !== null);
  
  console.log('✅ [TEST CASES] Test cases parsed:', testCases.length);
  return testCases;
}

// Parse test cases in table format (legacy)
function parseTestCasesTableFormat(content: string): Array<{id: string, functionality: string, testScript: string}> {
  console.log('🔍 [TEST CASES] Parsing table format (legacy)');
  
  const testCases: Array<{id: string, functionality: string, testScript: string}> = [];
  const lines = content.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    // Procurar cabeçalho da tabela (ID | Funcionalidade/Título | Script/Script de teste/Roteiro)
    const headerRegex = /^\|\s*ID\s*\|\s*(Funcionalidade|Título)\s*\|\s*(Script|Script de teste|Roteiro)\s*\|?$/i;
    
    if (headerRegex.test(lines[i]?.trim() || '')) {
      console.log(`✅ [TEST CASES] Cabeçalho encontrado na linha ${i + 1}:`, lines[i]);
      
      // Verificar linha separadora
      i++;
      const separatorRegex = /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/;
      if (i < lines.length && separatorRegex.test(lines[i]?.trim() || '')) {
        console.log(`✅ [TEST CASES] Separador encontrado na linha ${i + 1}:`, lines[i]);
        
        // Processar linha de dados
        i++;
        if (i < lines.length) {
          const dataLineRegex = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(.*)$/;
          const match = lines[i]?.match(dataLineRegex);
          
          if (match) {
            const id = match[1].trim();
            const functionality = match[2].trim();
            let scriptStart = match[3];
            
            console.log(`✅ [TEST CASES] Dados iniciais - ID: "${id}", Func: "${functionality}", Script início: "${scriptStart}"`);
            
            // Coletar script multilinha
            const scriptLines: string[] = [];
            
            // Se há conteúdo na mesma linha do início, adicionar
            if (scriptStart && scriptStart.trim() && !scriptStart.trim().endsWith('|')) {
              scriptLines.push(scriptStart.trim());
            }
            
            // Coletar linhas subsequentes até encontrar fechamento
            i++;
            let insideScript = true;
            while (i < lines.length && insideScript) {
              const currentLine = lines[i];
              
              // Linha de fechamento: apenas "|" ou linha terminando com " |"
              if (currentLine?.trim() === '|') {
                console.log(`✅ [TEST CASES] Fechamento encontrado na linha ${i + 1}`);
                insideScript = false;
              } else if (currentLine?.trimEnd().endsWith('|')) {
                // Última linha do script com conteúdo
                const lineContent = currentLine.trimEnd();
                const contentWithoutPipe = lineContent.slice(0, -1).trim();
                if (contentWithoutPipe) {
                  scriptLines.push(contentWithoutPipe);
                }
                console.log(`✅ [TEST CASES] Linha final do script na linha ${i + 1}: "${contentWithoutPipe}"`);
                insideScript = false;
              } else if (currentLine && currentLine.trim()) {
                // Linha intermediária do script
                scriptLines.push(currentLine.trim());
                console.log(`✅ [TEST CASES] Linha do script adicionada: "${currentLine.trim()}"`);
              }
              
              i++;
            }
            
            // Construir script final preservando quebras de linha
            const testScript = scriptLines.join('\n').trim();
            
            if (id && functionality && testScript) {
              const testCase = { id, functionality, testScript };
              testCases.push(testCase);
              console.log(`✅ [TEST CASES] Caso de teste adicionado:`, testCase);
            } else {
              console.warn(`⚠️ [TEST CASES] Caso incompleto ignorado - ID: "${id}", Func: "${functionality}", Script: "${testScript}"`);
            }
          } else {
            console.warn(`⚠️ [TEST CASES] Linha de dados inválida na linha ${i + 1}:`, lines[i]);
            i++;
          }
        }
      } else {
        console.warn(`⚠️ [TEST CASES] Separador não encontrado após cabeçalho na linha ${i + 1}`);
        i++;
      }
    } else {
      i++;
    }
  }
  
  return testCases;
}

// Try both formats and return the one that works
function tryBothFormats(content: string): Array<{id: string, functionality: string, testScript: string}> {
  console.log('🔍 [TEST CASES] Trying both formats');
  
  // Try list format first
  const listResults = parseTestCasesListFormat(content);
  if (listResults.length > 0) {
    console.log('✅ [TEST CASES] List format successful');
    return listResults;
  }
  
  // Try table format
  const tableResults = parseTestCasesTableFormat(content);
  console.log('✅ [TEST CASES] Table format results:', tableResults.length);
  return tableResults;
}

// Main parsing function for test cases section
const parseTestCasesSection = (sectionContent: string): Array<{id: string, functionality: string, testScript: string}> => {
  if (!sectionContent.trim()) return [];
  
  console.log('🔍 [TEST CASES] Starting test case parsing');
  
  const format = detectTestCaseFormat(sectionContent);
  console.log('🔍 [TEST CASES] Format detected:', format);
  
  let testCases: Array<{id: string, functionality: string, testScript: string}> = [];
  
  switch (format) {
    case 'list':
      testCases = parseTestCasesListFormat(sectionContent);
      break;
    case 'table':
      testCases = parseTestCasesTableFormat(sectionContent);
      break;
    default:
      testCases = tryBothFormats(sectionContent);
      break;
  }
  
  console.log('✅ [TEST CASES] Final test cases imported:', testCases.length);
  
  // Validate and filter
  const validTestCases = testCases.filter(tc => {
    const isValid = tc.id?.trim() && tc.functionality?.trim() && tc.testScript?.trim();
    if (!isValid) {
      console.log('⚠️ [TEST CASES] Invalid test case filtered out:', tc);
    }
    return isValid;
  });
  
  console.log('✅ [TEST CASES] Valid test cases:', validTestCases.length);
  return validTestCases;
};