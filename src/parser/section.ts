export const matchSection = (md: string, title: string): string => {
	const re = new RegExp(`###\\s+${title}\\s*\\n+([\\s\\S]*?)(?=\\n### |\\n## |\\n$)`, "i");
	const m = md.match(re);
	return m ? m[1] : "";
};

export const matchTopLevel = (md: string, title: string): string => {
	const re = new RegExp(`##\\s+${title}\\s*\\n+([\\s\\S]*?)(?=\\n## |\\n$)`, "i");
	const m = md.match(re);
	return m ? m[1] : "";
};