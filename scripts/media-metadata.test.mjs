import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

test("scoped media updates preserve historical entries and exclude other local work", async () => {
	const cwd = await mkdtemp(path.join(tmpdir(), "media-metadata-"));
	const run = (script, ...args) =>
		spawnSync(
			process.execPath,
			[fileURLToPath(new URL(script, import.meta.url)), ...args],
			{ cwd, encoding: "utf8" },
		);
	try {
		await mkdir(path.join(cwd, "media/wp-content/uploads"), {
			recursive: true,
		});
		await mkdir(path.join(cwd, "src/data"), { recursive: true });
		const image = await sharp({
			create: { width: 16, height: 9, channels: 3, background: "white" },
		})
			.webp()
			.toBuffer();
		for (const name of ["cover.webp", "unrelated.webp"])
			await writeFile(path.join(cwd, "media/wp-content/uploads", name), image);
		const original = JSON.stringify({
			generatedAt: "old",
			count: 1,
			totalBytes: 1,
			objects: [
				{
					key: "wp-content/uploads/legacy.webp",
					size: 1,
					contentType: "image/webp",
				},
			],
		});
		await writeFile(path.join(cwd, "media-manifest.json"), original);
		assert.equal(
			run(
				"media-manifest.mjs",
				"--check",
				"media/wp-content/uploads/cover.webp",
			).status,
			1,
		);
		assert.equal(
			await readFile(path.join(cwd, "media-manifest.json"), "utf8"),
			original,
		);
		assert.equal(
			run("media-manifest.mjs", "media/wp-content/uploads/cover.webp").status,
			0,
		);
		const manifest = JSON.parse(
			await readFile(path.join(cwd, "media-manifest.json"), "utf8"),
		);
		assert.deepEqual(
			manifest.objects.map((o) => o.key),
			["wp-content/uploads/cover.webp", "wp-content/uploads/legacy.webp"],
		);
		assert.equal(
			run(
				"media-manifest.mjs",
				"--check",
				"media/wp-content/uploads/cover.webp",
			).status,
			0,
		);
		await writeFile(
			path.join(cwd, "src/data/media-dimensions.json"),
			JSON.stringify({
				"/wp-content/uploads/legacy.webp": { width: 250, height: 250 },
			}),
		);
		assert.equal(
			run(
				"media-dimensions.mjs",
				"--check",
				"media/wp-content/uploads/cover.webp",
			).status,
			1,
		);
		assert.equal(
			run("media-dimensions.mjs", "media/wp-content/uploads/cover.webp").status,
			0,
		);
		const dimensions = JSON.parse(
			await readFile(path.join(cwd, "src/data/media-dimensions.json"), "utf8"),
		);
		assert.deepEqual(dimensions["/wp-content/uploads/legacy.webp"], {
			width: 250,
			height: 250,
		});
		assert.deepEqual(dimensions["/wp-content/uploads/cover.webp"], {
			width: 16,
			height: 9,
		});
		assert.equal(dimensions["/wp-content/uploads/unrelated.webp"], undefined);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});
