import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const tailwindRequire = createRequire(require.resolve("tailwindcss"));
const matchRequire = createRequire(tailwindRequire.resolve("micromatch"));
const braces = matchRequire("braces");

test("patched braces rejects deeply nested text and ASTs before exhausting the stack", () => {
	assert.deepEqual(braces.expand("src/{posts,pages}/*.md"), [
		"src/posts/*.md",
		"src/pages/*.md",
	]);
	const nested = `${"{".repeat(3000)}a,b${"}".repeat(3000)}`;
	for (const method of ["parse", "compile", "expand", "stringify"]) {
		assert.throws(() => braces[method](nested), {
			name: "SyntaxError",
			message: /safe depth limit/,
		});
	}
	const ast = { type: "root", nodes: [] };
	let node = ast;
	for (let i = 0; i < 200; i++) {
		const child = { type: "brace", nodes: [], parent: node };
		node.nodes.push(child);
		node = child;
	}
	for (const method of ["compile", "expand", "stringify"]) {
		assert.throws(() => braces[method](ast), {
			name: "SyntaxError",
			message: /safe depth limit/,
		});
	}
});

test("legacy minifier serialization cannot inject code through Date methods", () => {
	let dependencyRequire = require;
	for (const name of [
		"@swup/astro",
		"@swup/parallel-plugin",
		"@swup/plugin",
		"microbundle",
		"rollup-plugin-terser",
	])
		dependencyRequire = createRequire(dependencyRequire.resolve(name));
	const serialize = dependencyRequire("serialize-javascript");
	const date = new Date();
	date.toISOString = () => '"+(global.INJECTED=true)+"';
	assert.throws(() => serialize({ date }), /Invalid Date/);
	assert.equal(
		serialize({ test: /safe/gi }),
		'{"test":new RegExp("safe", "gi")}',
	);
});
