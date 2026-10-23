import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "./frontmatter.mjs";

test("frontmatter accepts YAML scalars, lists and multiline text without reading body fields", () => {
	const data = parseFrontmatter(
		"---\ntitle: 中文标题\nimage: ''\ntags:\n  - Jetson\ndescription: |\n  第一行\n  第二行\n---\nimage: body-value\n",
	);
	assert.equal(data.image, "");
	assert.equal(data.title, "中文标题");
	assert.deepEqual(data.tags, ["Jetson"]);
	assert.equal(data.description, "第一行\n第二行\n");
	assert.throws(() => parseFrontmatter("---\nimage: a\nimage: b\n---\n"));
});

test("new post is a complete draft with a stable URL and cannot overwrite or escape directory", async () => {
	const directory = await mkdtemp(path.join(tmpdir(), "post-template-"));
	const script = fileURLToPath(new URL("new-post.js", import.meta.url));
	const run = (slug) =>
		spawnSync(process.execPath, [script, slug], {
			cwd: directory,
			encoding: "utf8",
		});
	try {
		assert.equal(run("test-post").status, 0);
		const data = parseFrontmatter(
			await readFile(
				path.join(directory, "src/content/posts/test-post.md"),
				"utf8",
			),
		);
		assert.equal(data.draft, true);
		assert.equal(data.image, "");
		assert.match(data.permalink, /^\/\d{4}\/\d{2}\/\d{2}\/test-post\/$/);
		assert.equal(run("test-post").status, 1);
		assert.equal(run("../outside").status, 1);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
