import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const postsRoot = path.resolve("src/content/posts/imported");

function plainText(markdown) {
	return markdown
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/[`*_~]/g, "")
		.replace(/<[^>]+>/g, "")
		.replace(/\\([\[\]_`])/g, "$1")
		.replace(/\s+/g, " ")
		.trim();
}

function shortened(value, maxLength = 72) {
	const characters = [...value];
	return characters.length <= maxLength
		? value
		: `${characters.slice(0, maxLength - 1).join("")}…`;
}

const files = (await readdir(postsRoot))
	.filter((file) => file.endsWith(".md"))
	.sort();
let changedFiles = 0;
let enrichedImages = 0;

for (const file of files) {
	const filePath = path.join(postsRoot, file);
	const markdown = await readFile(filePath, "utf8");
	const titleMatch = /^title: (.+)$/m.exec(markdown);
	const title = titleMatch ? JSON.parse(titleMatch[1]) : path.basename(file, ".md");
	const lines = markdown.split("\n");
	const records = [];
	let sectionKey = "article";
	let sectionLabel = title;
	let inFrontmatter = false;
	let frontmatterDelimiters = 0;

	for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
		const line = lines[lineIndex];
		if (line.trim() === "---") {
			frontmatterDelimiters += 1;
			inFrontmatter = frontmatterDelimiters === 1;
			continue;
		}
		if (inFrontmatter) continue;

		const heading = /^(#{2,6})\s+(.+)$/.exec(line);
		if (heading) {
			sectionKey = `${lineIndex}:${heading[1].length}`;
			sectionLabel = plainText(heading[2]) || title;
		}

		for (const _match of line.matchAll(/!\[\]\(([^)]+)\)/g)) {
			records.push({ sectionKey, sectionLabel });
		}
	}

	if (records.length === 0) continue;
	const totals = new Map();
	for (const record of records) {
		totals.set(record.sectionKey, (totals.get(record.sectionKey) ?? 0) + 1);
	}
	const positions = new Map();
	let recordIndex = 0;
	const output = lines
		.map((line) =>
			line.replace(/!\[\]\(([^)]+)\)/g, (_full, destination) => {
				const record = records[recordIndex++];
				const position = (positions.get(record.sectionKey) ?? 0) + 1;
				positions.set(record.sectionKey, position);
				const total = totals.get(record.sectionKey) ?? 1;
				const context =
					record.sectionLabel === title
						? title
						: `${record.sectionLabel} - ${title}`;
				const suffix = total > 1 ? ` ${position}` : "";
				const alt = shortened(`${context} 操作截图${suffix}`);
				enrichedImages += 1;
				return `![${alt}](${destination})`;
			}),
		)
		.join("\n");

	if (output !== markdown) {
		await writeFile(filePath, output, "utf8");
		changedFiles += 1;
	}
}

console.log(
	`Added contextual alt text to ${enrichedImages} images across ${changedFiles} posts.`,
);
