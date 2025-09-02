export function buildMarkdownFromDocument(document: any): string {
  const headerLines: string[] = [];
  if (document?.projectName || document?.projectVersion) {
    headerLines.push(`# ${document.projectName || ''} - v${document.projectVersion || ''}`);
  }
  if (document?.testResponsible) {
    headerLines.push(`Responsável: ${document.testResponsible}`);
  }
  if (document?.startDate || document?.expectedDeliveryDate) {
    headerLines.push(`Início: ${document.startDate || ''}  Prevista: ${document.expectedDeliveryDate || ''}`);
  }

  const reqs = (document?.project?.requirements || [])
    .map((r: any) => `| ${r.id ?? ''} | ${r.descricao ?? ''} |`)
    .join('\n');
  const tests = (document?.project?.testCases || [])
    .map((t: any) => `| ${t.id ?? ''} | ${t.functionality ?? ''} | ${t.testScript ?? ''} |`)
    .join('\n');

  const parts: string[] = [];
  parts.push(headerLines.join('\n'));
  parts.push('');
  parts.push('## Projeto');
  parts.push('');
  parts.push('### Requisitos');
  parts.push('');
  parts.push('| ID | Descrição |');
  parts.push('| --- | --- |');
  if (reqs) parts.push(reqs);
  parts.push('');
  parts.push('### Casos de Teste');
  parts.push('');
  parts.push('| ID | Funcionalidade | Roteiro |');
  parts.push('| --- | --- | --- |');
  if (tests) parts.push(tests);
  parts.push('');
  return parts.join('\n');
}

