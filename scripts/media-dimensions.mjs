import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { resolveMediaFile } from "./media-files.mjs";
import { collectMediaPathnames } from "./media-reference-paths.mjs";

const sourceRoot = path.resolve("src");
const mediaRoot = path.resolve("media");
const outputPath = path.resolve("src/data/media-dimensions.json");
const sourceExtensions = new Set([".astro", ".md", ".svelte", ".ts"]);

async function walk(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(absolutePath)));
		if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
			files.push(absolutePath);
		}
	}
	return files;
}

const references = new Set();
const args = process.argv.slice(2);
const check = args.includes("--check");
const selection = args.filter((value) => value !== "--check");
for (const file of selection)
	references.add(
		`/${path.relative(mediaRoot, resolveMediaFile(file)).split(path.sep).join("/")}`,
	);
for (const sourceFile of selection.length ? [] : await walk(sourceRoot)) {
	const source = await readFile(sourceFile, "utf8");
	for (const pathname of collectMediaPathnames(source)) {
		references.add(pathname);
	}
}

let previous = {};
try {
	previous = JSON.parse(await readFile(outputPath, "utf8"));
} catch (error) {
	if (error.code !== "ENOENT") throw error;
}
const dimensions = { ...previous };
const paths = [...references].sort((a, b) => a.localeCompare(b));
for (let index = 0; index < paths.length; index += 16) {
	const batch = paths.slice(index, index + 16);
	const records = await Promise.all(
		batch.map(async (pathname) => {
			try {
				const metadata = await sharp(
					path.join(mediaRoot, pathname.replace(/^\//, "")),
				).metadata();
				if (!metadata.width || !metadata.height) return null;
				return [pathname, { width: metadata.width, height: metadata.height }];
			} catch (error) {
				if (selection.length) throw error;
				console.warn(`${pathname}: ${error.message}`);
				return null;
			}
		}),
	);
	for (const record of records) {
		if (record) dimensions[record[0]] = record[1];
	}
}

const sorted = Object.fromEntries(
	Object.entries(dimensions).sort(([a], [b]) => a.localeCompare(b)),
);
const changed = JSON.stringify(previous) !== JSON.stringify(sorted);
if (check) {
	process.exitCode = changed ? 1 : 0;
	console.log(
		changed
			? "Media dimensions would change; no files written."
			: "Media dimensions are up to date.",
	);
} else if (changed) {
	await writeFile(outputPath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}
console.log(
	`Recorded dimensions for ${Object.keys(dimensions).length}/${references.size} referenced media files.`,
);
