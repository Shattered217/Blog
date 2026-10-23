import { readFile, writeFile } from "node:fs/promises";
import { collectMediaFiles } from "./media-files.mjs";

const args = process.argv.slice(2);
const check = args.includes("--check");
const files = await collectMediaFiles(
	args.filter((value) => value !== "--check"),
);
let previous = { objects: [] };
try {
	previous = JSON.parse(await readFile("media-manifest.json", "utf8"));
} catch (error) {
	if (error.code !== "ENOENT") throw error;
}
const objects = new Map(previous.objects.map((object) => [object.key, object]));
for (const { key, size, contentType } of files)
	objects.set(key, { key, size, contentType });
const merged = [...objects.values()].sort((a, b) => a.key.localeCompare(b.key));
const manifest = {
	generatedAt: previous.generatedAt,
	count: merged.length,
	totalBytes: merged.reduce((total, file) => total + file.size, 0),
	objects: merged,
};

const changed = JSON.stringify(previous) !== JSON.stringify(manifest);
if (check) {
	process.exitCode = changed ? 1 : 0;
	console.log(
		changed
			? "Media manifest would change; no files written."
			: "Media manifest is up to date.",
	);
} else if (changed) {
	manifest.generatedAt = new Date().toISOString();
	await writeFile(
		"media-manifest.json",
		`${JSON.stringify(manifest, null, 2)}\n`,
	);
}
console.log(
	`Recorded ${manifest.count} objects (${manifest.totalBytes} bytes) in media-manifest.json`,
);
