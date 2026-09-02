import assert from "node:assert/strict";
import test from "node:test";
import { collectMediaPathnames } from "./media-reference-paths.mjs";

test("collects root-relative and same-origin absolute media URLs", () => {
	const source = `
image: "https://nvcc-v.com/wp-content/uploads/2026/09/cover.webp"
![报告](/wp-content/uploads/2026/09/%E6%B5%8B%E8%AF%95.png?version=1)
`;

	assert.deepEqual(
		[...collectMediaPathnames(source)],
		[
			"/wp-content/uploads/2026/09/cover.webp",
			"/wp-content/uploads/2026/09/测试.png",
		],
	);
});

test("ignores media-shaped URLs from other origins", () => {
	const source = `
![外部图片](https://example.com/wp-content/uploads/2026/09/image.png)
const prefix = "/wp-content/uploads/";
`;

	assert.deepEqual([...collectMediaPathnames(source)], []);
});
