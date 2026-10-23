import { parse } from "yaml";

export function parseFrontmatter(markdown) {
	const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);
	if (!match) throw new Error("Missing YAML frontmatter");
	const data = parse(match[1], { uniqueKeys: true });
	if (!data || typeof data !== "object" || Array.isArray(data))
		throw new Error("Frontmatter must be a mapping");
	return data;
}
