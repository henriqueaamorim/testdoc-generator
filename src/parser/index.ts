import { parseMarkdownTable } from "./table.js";
import { matchSection, matchTopLevel } from "./section.js";
import type { NormalizedDocument, Requirement, TestCase, ExecutionEntry, DefectEntry } from "../shared/types.js";

const toIsoDate = (s: string): string => {
	const m = s.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
	if (!m) return "";
	const [_, dd, mm, yyyy] = m;
	return `${yyyy}-${mm}-${dd}`;
};

const sanitize = (s: string): string => s.replace(/[\u0000]/g, "").trim();

function extractHeader(md: string) {
	const headerBlock = matchTopLevel(md, "Cabeçalho") || md;
	const lines = headerBlock.split("\n").map((l) => l.trim()).filter(Boolean);
	const read = (label: string) => {
		const re = new RegExp(`^(?:[-*]\\s*)?${label}\\s*:\\s*(.+)$`, "i");
		for (const line of lines) {
			const m = line.match(re);
			if (m) return sanitize(m[1]);
		}
		return "";
	};
	return {
		projectName: read("Nome do Projeto"),
		projectVersion: read("Versão do Projeto"),
		testResponsible: read("Responsável pelo Teste"),
		startDate: toIsoDate(read("Data Início")),
		expectedDeliveryDate: toIsoDate(read("Data Prevista de Entrega")),
	};
}

function normalizeHeaderDates(doc: NormalizedDocument): string[] {
	const warnings: string[] = [];
	// Basic check format already converted. Check order Start <= Expected
	if (doc.startDate && doc.expectedDeliveryDate) {
		if (doc.startDate > doc.expectedDeliveryDate) {
			warnings.push("Data Início maior que Data Prevista de Entrega");
		}
	}
	return warnings;
}

function headerRowToIndex(headerRow: string[]): Record<string, number> {
	const normalize = (s: string) =>
		s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9/ ]+/g, "").trim();
	const map: Record<string, number> = {};
	headerRow.forEach((h, idx) => {
		map[normalize(h)] = idx;
	});
	return map;
}

function mapRequirements(rows: string[][], warnings: NormalizedDocument["warnings"]): Requirement[] {
	if (rows.length === 0) return [];
	const [first, ...rest] = rows;
	const headerMap = headerRowToIndex(first);
	const startsWithId = Object.keys(headerMap).some((k) => k === "id");
	const dataRows = startsWithId ? rest : rows; // If no header, treat all rows as data
	const results: Requirement[] = [];
	const seen = new Set<string>();
	for (let i = 0; i < dataRows.length; i++) {
		const r = dataRows[i];
		let id: string = "";
		let descricao: string = "";
		if (startsWithId) {
			id = r[headerMap["id"]] || "";
			descricao = r[headerMap["descricao"] ?? headerMap["descricaodorequisito"] ?? 1] || "";
		} else {
			id = r[0] || "";
			descricao = r[1] || "";
		}
		id = sanitize(id);
		descricao = sanitize(descricao);
		if (!id && !descricao) continue;
		if (seen.has(id)) {
			warnings.push({ scope: "requirements", row: i + 1, type: "duplicateId", message: `ID duplicado ${id}` });
			continue;
		}
		if (id) seen.add(id);
		results.push({ id, descricao });
	}
	return results;
}

function mapTestCases(rows: string[][], warnings: NormalizedDocument["warnings"]): TestCase[] {
	if (rows.length === 0) return [];
	const [first, ...rest] = rows;
	const headerMap = headerRowToIndex(first);
	const hasHeader = ["id", "funcionalidade", "funcionalidade/titulo", "roteiro"].some((k) => k in headerMap);
	const dataRows = hasHeader ? rest : rows;
	const results: TestCase[] = [];
	const seen = new Set<string>();
	for (let i = 0; i < dataRows.length; i++) {
		const r = dataRows[i];
		const getBy = (keys: string[], fallbackIndex?: number) => {
			for (const k of keys) {
				if (k in headerMap) return r[headerMap[k]] || "";
			}
			return typeof fallbackIndex === "number" ? r[fallbackIndex] || "" : "";
		};
		let id = sanitize(hasHeader ? getBy(["id"]) : r[0] || "");
		let functionality = sanitize(
			hasHeader ? getBy(["funcionalidade/titulo", "funcionalidade", "titulo"], 1) : r[1] || ""
		);
		let testScript = sanitize(hasHeader ? getBy(["roteiro"], 2) : r[2] || "");
		let preConditions = sanitize(hasHeader ? getBy(["precondicoes", "pre-condicoes"]) : "");
		let expectedResult = sanitize(hasHeader ? getBy(["resultadoesperado", "resultado esperado"]) : "");

		if (!id && !functionality && !testScript) continue;
		if (seen.has(id) && id) {
			warnings.push({ scope: "testCases", row: i + 1, type: "duplicateId", message: `ID duplicado ${id}` });
			// preserve-first policy: skip duplicates
			continue;
		}
		if (id) seen.add(id);

		// Concatenate extra columns into testScript if there are more cells beyond mapped ones
		if (r.length > 3) {
			const extra = r.slice(3).filter(Boolean).join(" | ");
			if (extra) testScript = testScript ? `${testScript} | ${extra}` : extra;
		}

		results.push({ id, functionality, testScript, preConditions, expectedResult });
	}
	return results;
}

function mapExecutions(rows: string[][]): ExecutionEntry[] {
	if (rows.length === 0) return [];
	const [first, ...rest] = rows;
	const headerMap = headerRowToIndex(first);
	const hasHeader = ["id do caso", "status", "evidencia", "evidencia/url", "evidencia/caminho"].some((k) => k in headerMap);
	const dataRows = hasHeader ? rest : rows;
	const results: ExecutionEntry[] = [];
	for (const r of dataRows) {
		const get = (k: string, idx?: number) => (k in headerMap ? r[headerMap[k]] : typeof idx === "number" ? r[idx] : "");
		const caseId = sanitize(hasHeader ? get("id do caso", 0) : r[0] || "");
		const status = sanitize((hasHeader ? get("status", 1) : r[1] || "") as string) as ExecutionEntry["status"];
		const evidence = sanitize(hasHeader ? get("evidencia", 2) : r[2] || "");
		const extra: Record<string, unknown> = {};
		results.push({ caseId, status, evidence, extra });
	}
	return results;
}

function mapDefects(rows: string[][]): DefectEntry[] {
	if (rows.length === 0) return [];
	const [first, ...rest] = rows;
	const headerMap = headerRowToIndex(first);
	const hasHeader = ["id do caso", "descricao", "status", "severidade", "responsavel"].some((k) => k in headerMap);
	const dataRows = hasHeader ? rest : rows;
	const results: DefectEntry[] = [];
	for (const r of dataRows) {
		const get = (k: string, idx?: number) => (k in headerMap ? r[headerMap[k]] : typeof idx === "number" ? r[idx] : "");
		const caseId = sanitize(hasHeader ? get("id do caso", 0) : r[0] || "");
		const description = sanitize(hasHeader ? get("descricao", 1) : r[1] || "");
		const status = sanitize(hasHeader ? get("status", 2) : r[2] || "");
		const severity = sanitize(hasHeader ? get("severidade", 3) : r[3] || "") as DefectEntry["severity"];
		const owner = sanitize(hasHeader ? get("responsavel", 4) : r[4] || "");
		const extra: Record<string, unknown> = {};
		results.push({ caseId, description, status, severity, owner, extra });
	}
	return results;
}

export type ParseOptions = { renumberDuplicates?: boolean };

export function parseMarkdownDocument(md: string, options: ParseOptions = {}): NormalizedDocument {
	const header = extractHeader(md);
	const warnings: NormalizedDocument["warnings"] = [];

	const reqSec = matchSection(md, "Requisitos");
	const tcSec = matchSection(md, "Casos de Teste");
	const execSec = matchSection(md, "Execução dos Casos");
	const defSec = matchSection(md, "Defeitos");

	const reqRows = parseMarkdownTable(reqSec);
	const tcRows = parseMarkdownTable(tcSec);
	const execRows = parseMarkdownTable(execSec);
	const defRows = parseMarkdownTable(defSec);

	let requirements = mapRequirements(reqRows, warnings);
	let testCases = mapTestCases(tcRows, warnings);
	let executions = mapExecutions(execRows);
	let defects = mapDefects(defRows);

	// Optionally renumber duplicates according to policy
	if (options.renumberDuplicates) {
		const renumber = (items: { id: string }[], prefix: string) => {
			let maxNum = 0;
			for (const it of items) {
				const m = it.id.match(/^(\w+)-(\d{4,})$/);
				if (m && m[1] === prefix) maxNum = Math.max(maxNum, parseInt(m[2], 10));
			}
			const seen = new Set<string>();
			for (const it of items) {
				if (!it.id || seen.has(it.id)) {
					maxNum += 1;
					it.id = `${prefix}-${String(maxNum).padStart(4, "0")}`;
				}
				seen.add(it.id);
			}
		};
		renumber(requirements, "REQ");
		renumber(testCases, "CT");
	}

	const doc: NormalizedDocument = {
		projectName: header.projectName,
		projectVersion: header.projectVersion,
		testResponsible: header.testResponsible,
		startDate: header.startDate,
		expectedDeliveryDate: header.expectedDeliveryDate,
		planning: {},
		project: { requirements, testCases },
		execution: { executions, defects },
		delivery: { indicators: {}, summary: "", deliveryDate: "" },
		warnings,
	};

	normalizeHeaderDates(doc).forEach((w) => warnings.push({ scope: "header", type: "dateOrder", message: w } as any));
	return doc;
}