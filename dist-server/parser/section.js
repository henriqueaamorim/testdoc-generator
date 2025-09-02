export const matchSection = (md, title) => {
    const re = new RegExp(`###\\s+${title}\\s*\\n+([\\s\\S]*?)(?=\\n### |\\n## |\\n$)`, "i");
    const m = md.match(re);
    return m ? m[1] : "";
};
export const matchTopLevel = (md, title) => {
    const re = new RegExp(`##\\s+${title}\\s*\\n+([\\s\\S]*?)(?=\\n## |\\n$)`, "i");
    const m = md.match(re);
    return m ? m[1] : "";
};
