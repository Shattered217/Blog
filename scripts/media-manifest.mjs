import { writeFile } from "node:fs/promises";
import { collectMediaFiles } from "./media-files.mjs";

const files = await collectMediaFiles();
const manifest = {
	generatedAt: new Date().toISOString(),
	count: files.length,
	totalBytes: files.reduce((total, file) => total + file.size, 0),
	objects: files.map(({ key, size, contentType }) => ({ key, size, contentType })),
};

await writeFile("media-manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
	`Recorded ${manifest.count} objects (${manifest.totalBytes} bytes) in media-manifest.json`,
);
