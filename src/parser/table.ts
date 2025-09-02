function normalizeLine(line: string): string {
	const trimmed = line.trim();
	const withLeft = trimmed.startsWith("|") ? trimmed : "|" + trimmed;
	const withBoth = withLeft.endsWith("|") ? withLeft : withLeft + "|";
	return withBoth;
}

export function parseMarkdownTable(sectionMd: string): string[][] {
	const raw = sectionMd
		.split("\n")
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	const candidates = raw.filter((l) => l.includes("|"));
	if (candidates.length < 2) return [];

	const normalized = candidates.map(normalizeLine);
	const sep = /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/;
	const hadHeader = normalized.some((l) => sep.test(l));
	const withoutSeps = normalized.filter((l) => !sep.test(l));
	const dataLines = hadHeader ? withoutSeps.slice(1) : withoutSeps;

	const rows = dataLines.map((line) =>
		line
			.slice(1, -1)
			.split("|")
			.map((c) => c.trim())
	);

	const real = rows.filter((cells) => cells.some((c) => c && c !== "---" && c !== "-"));
	return real;
}