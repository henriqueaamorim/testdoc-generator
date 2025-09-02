export type ExportFormat = "md" | "pdf" | "docx";

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:8080";

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
		body: init?.body,
	});
	if (!res.ok) {
		let details: any = undefined;
		try { details = await res.json(); } catch {}
		throw new Error(`Request failed ${res.status}: ${res.statusText}${details ? ` - ${JSON.stringify(details)}` : ""}`);
	}
	return res.json() as Promise<T>;
}

export async function parseMarkdown(content: string, options?: { locale?: string; renumberDuplicates?: boolean }) {
	return jsonFetch<any>(`${API_BASE}/v1/parse/markdown`, {
		body: JSON.stringify({ content, options: { locale: "pt-BR", ...(options || {}) } }),
	});
}

export async function validateDocument(document: any) {
	return jsonFetch<{ ok: boolean; errors: any[]; warnings: any[] }>(`${API_BASE}/v1/validate`, {
		body: JSON.stringify({ document }),
	});
}

export async function exportDocument(document: any, format: ExportFormat) {
	return jsonFetch<{ filename: string; mime: string; data: string }>(`${API_BASE}/v1/export`, {
		body: JSON.stringify({ document, format }),
	});
}