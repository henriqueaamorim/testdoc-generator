const esc = (s) => (s ?? "").replace(/\|/g, "\\|");
export function exportToMarkdown(doc) {
    const lines = [];
    lines.push(`# Documento de Teste`);
    lines.push("\n## Cabeçalho\n");
    lines.push(`Nome do Projeto: ${doc.projectName}`);
    lines.push(`Versão do Projeto: ${doc.projectVersion}`);
    lines.push(`Responsável pelo Teste: ${doc.testResponsible}`);
    const toBr = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");
    lines.push(`Data Início: ${toBr(doc.startDate)}`);
    lines.push(`Data Prevista de Entrega: ${toBr(doc.expectedDeliveryDate)}`);
    lines.push("\n## Projeto\n");
    lines.push(`### Requisitos`);
    lines.push(`| ID | Descrição |`);
    lines.push(`| --- | --- |`);
    for (const r of doc.project.requirements) {
        lines.push(`| ${esc(r.id)} | ${esc(r.descricao)} |`);
    }
    lines.push("\n### Casos de Teste");
    lines.push(`| ID | Funcionalidade | Roteiro |`);
    lines.push(`| --- | --- | --- |`);
    for (const c of doc.project.testCases) {
        lines.push(`| ${esc(c.id)} | ${esc(c.functionality)} | ${esc(c.testScript)} |`);
    }
    return lines.join("\n");
}
