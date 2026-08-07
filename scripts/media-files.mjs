import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export const MEDIA_ROOT = path.resolve("media/wp-content/uploads");

const contentTypes = {
	avif: "image/avif",
	gif: "image/gif",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	json: "application/json; charset=utf-8",
	png: "image/png",
	png2: "image/png",
	svg: "image/svg+xml",
	webp: "image/webp",
	xml: "application/xml; charset=utf-8",
};

export function contentTypeFor(file) {
	const extension = path.extname(file).slice(1).toLowerCase();
	return contentTypes[extension] ?? "application/octet-stream";
}

async function walk(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walk(absolutePath)));
		} else if (entry.isFile()) {
			files.push(absolutePath);
		}
	}
	return files;
}

export async function collectMediaFiles() {
	const files = await walk(MEDIA_ROOT);
	return Promise.all(
		files.map(async (filePath) => {
			const relativePath = path.relative(MEDIA_ROOT, filePath).split(path.sep).join("/");
			const metadata = await stat(filePath);
			return {
				filePath,
				key: `wp-content/uploads/${relativePath}`,
				size: metadata.size,
				contentType: contentTypeFor(filePath),
			};
		}),
	);
}
