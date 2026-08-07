import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
	compactTags,
	legacyTagTarget,
	stripAiSummary,
} from "./content-rules.mjs";

const postsRoot = path.resolve("src/content/posts/imported");
const redirectsPath = path.resolve("public/_redirects");
const beginMarker = "# BEGIN GENERATED LEGACY TAG REDIRECTS";
const endMarker = "# END GENERATED LEGACY TAG REDIRECTS";
const redirectMap = new Map();

function decodedPath(value) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function frontmatterJson(markdown, field) {
	const match = new RegExp(`^${field}: (.+)$`, "m").exec(markdown);
	return match ? JSON.parse(match[1]) : [];
}

let redirects = await readFile(redirectsPath, "utf8");
const generatedBlock = new RegExp(
	`${beginMarker}\\n([\\s\\S]*?)${endMarker}\\n?`,
).exec(redirects);
if (generatedBlock) {
	for (const line of generatedBlock[1].trim().split("\n")) {
		const [source, target] = line.trim().split(/\s+/);
		if (source && target) redirectMap.set(decodedPath(source), target);
	}
	redirects = redirects.replace(generatedBlock[0], "").trimEnd();
}

let changedPosts = 0;
let removedSummaries = 0;
const files = (await readdir(postsRoot)).filter((file) => file.endsWith(".md"));
for (const file of files) {
	const filePath = path.join(postsRoot, file);
	const slug = path.basename(file, ".md");
	const original = await readFile(filePath, "utf8");
	const sourceTags = frontmatterJson(original, "tags");
	const sourcePermalinks = frontmatterJson(original, "tagPermalinks");
	const compacted = compactTags(slug, sourceTags);
	if (compacted.length === 0) throw new Error(`${file}: no curated tags`);

	for (const [index, permalink] of sourcePermalinks.entries()) {
		const target = legacyTagTarget(
			sourceTags[index] ?? "",
			permalink,
			compacted[0].permalink,
		);
		if (permalink.toLowerCase() !== target.toLowerCase()) {
			redirectMap.set(decodedPath(permalink), target);
		}
	}

	let updated = original
		.replace(
			/^tags: .+$/m,
			`tags: ${JSON.stringify(compacted.map((tag) => tag.name))}`,
		)
		.replace(
			/^tagPermalinks: .+$/m,
			`tagPermalinks: ${JSON.stringify(compacted.map((tag) => tag.permalink))}`,
		);
	const withoutSummary = stripAiSummary(updated);
	if (withoutSummary !== updated) removedSummaries += 1;
	updated = withoutSummary;
	if (updated !== original) {
		await writeFile(filePath, updated, "utf8");
		changedPosts += 1;
	}
}

const redirectLines = [...redirectMap]
	.sort(([left], [right]) => left.localeCompare(right))
	.map(([source, target]) => `${source} ${target} 301`);
const generated = [beginMarker, ...redirectLines, endMarker].join("\n");
await writeFile(redirectsPath, `${redirects}\n${generated}\n`, "utf8");

console.log(
	`Compacted ${changedPosts} posts, removed ${removedSummaries} AI summary block, and preserved ${redirectLines.length} legacy tag redirects.`,
);
