import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
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
for (const sourceFile of await walk(sourceRoot)) {
	const source = await readFile(sourceFile, "utf8");
	for (const pathname of collectMediaPathnames(source)) {
		references.add(pathname);
	}
}

const dimensions = {};
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
				console.warn(`${pathname}: ${error.message}`);
				return null;
			}
		}),
	);
	for (const record of records) {
		if (record) dimensions[record[0]] = record[1];
	}
}

await writeFile(outputPath, `${JSON.stringify(dimensions, null, 2)}\n`, "utf8");
console.log(
	`Recorded dimensions for ${Object.keys(dimensions).length}/${references.size} referenced media files.`,
);
