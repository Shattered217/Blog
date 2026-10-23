import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import worker from "./index.ts";

test("CMS permits incomplete drafts and requires cover and description for both article collections", async () => {
	const response = await worker.fetch(
		new Request("http://localhost/editor-hooks.js"),
		{ REQUIRE_ACCESS: "false", R2_ACCESS_KEY_ID: "test-id" },
		{},
	);
	assert.equal(response.status, 200);
	let handler;
	vm.runInNewContext(await response.text(), {
		CMS: {
			registerEventListener(listener) {
				handler = listener.handler;
			},
			init() {},
		},
	});
	const entry = (collection, data) =>
		new Map([
			["collection", collection],
			["newRecord", true],
			[
				"data",
				new Map(
					Object.entries({
						title: "Example",
						slug: "example",
						published: "2026-10-22",
						...data,
					}),
				),
			],
		]);
	for (const collection of ["posts", "imported_posts"]) {
		assert.doesNotThrow(() =>
			handler({ entry: entry(collection, { draft: true }) }),
		);
		assert.throws(
			() =>
				handler({
					entry: entry(collection, {
						draft: false,
						description: "description",
					}),
				}),
			/封面/,
		);
		assert.throws(
			() =>
				handler({
					entry: entry(collection, {
						draft: false,
						image: "/wp-content/uploads/cover.webp",
					}),
				}),
			/摘要/,
		);
		const data = handler({
			entry: entry(collection, {
				draft: false,
				image: "/wp-content/uploads/cover.webp",
				description: "description",
			}),
		});
		assert.equal(data.get("permalink"), "/2026/10/22/example/");
		assert.equal(
			data.get("image"),
			"https://nvcc-v.com/wp-content/uploads/cover.webp",
		);
	}
});
