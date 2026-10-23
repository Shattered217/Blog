import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import nesting from "tailwindcss/nesting/index.js";

test("Markdown stylesheet compiles in a fresh context without other custom stylesheets", async () => {
	const css = await readFile("src/styles/markdown.css", "utf8");
	const result = await postcss([nesting(), tailwindcss()]).process(css, {
		from: "src/styles/markdown.css",
	});
	assert.match(result.css, /\.custom-md/);
});
