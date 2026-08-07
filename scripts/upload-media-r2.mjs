import { spawn } from "node:child_process";
import path from "node:path";
import { collectMediaFiles } from "./media-files.mjs";

const bucket = process.env.R2_BUCKET || "nvcc-v-media";
const concurrency = Math.max(
	1,
	Number.parseInt(process.env.R2_UPLOAD_CONCURRENCY || "8", 10),
);
const maxAttempts = Math.max(
	1,
	Number.parseInt(process.env.R2_UPLOAD_ATTEMPTS || "5", 10),
);
const useLocalStorage = process.argv.includes("--local");
const wrangler = path.resolve("node_modules/.bin/wrangler");
const files = await collectMediaFiles();
let nextIndex = 0;
let completed = 0;

function uploadOnce(file) {
	return new Promise((resolve, reject) => {
		const child = spawn(
			wrangler,
			[
				"r2",
				"object",
				"put",
				`${bucket}/${file.key}`,
				"--file",
				file.filePath,
				"--content-type",
				file.contentType,
				"--cache-control",
				"public, max-age=2592000, immutable",
				useLocalStorage ? "--local" : "--remote",
			],
			{ stdio: ["ignore", "ignore", "pipe"] },
		);
		let errorOutput = "";
		child.stderr.on("data", (chunk) => {
			errorOutput += chunk;
		});
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Failed to upload ${file.key}: ${errorOutput.trim()}`));
			}
		});
	});
}

async function upload(file) {
	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			await uploadOnce(file);
			return;
		} catch (error) {
			if (attempt === maxAttempts) {
				throw error;
			}

			const delay = 500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
			console.warn(
				`Retrying ${file.key} after attempt ${attempt}/${maxAttempts} failed`,
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
}

async function worker() {
	while (nextIndex < files.length) {
		const file = files[nextIndex++];
		await upload(file);
		completed += 1;
		if (completed % 50 === 0 || completed === files.length) {
			console.log(`Uploaded ${completed}/${files.length}`);
		}
	}
}

console.log(
	`Uploading ${files.length} media objects to ${bucket}${useLocalStorage ? " (local)" : ""}`,
);
await Promise.all(Array.from({ length: concurrency }, () => worker()));
