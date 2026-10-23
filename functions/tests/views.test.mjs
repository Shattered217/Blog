import assert from "node:assert/strict";
import test from "node:test";
import { onRequest } from "../api/views.ts";

const path = "/2026/10/22/club-sim-passport-renewal/";
function fixture({ unavailable = false } = {}) {
	let writes = 0;
	let reads = 0;
	let indexReads = 0;
	const seen = new Set();
	const env = {
		ASSETS: {
			async fetch() {
				indexReads++;
				return unavailable
					? new Response("error", { status: 503 })
					: new Response(
							`<urlset><url><loc>https://nvcc-v.com${path}</loc></url></urlset>`,
						);
			},
		},
		VIEW_RATE_LIMIT: {
			async limit({ key }) {
				const success = !seen.has(key);
				seen.add(key);
				return { success };
			},
		},
		BLOG_DB: {
			prepare(sql) {
				return {
					bind() {
						return {
							async first() {
								if (sql.startsWith("INSERT")) writes++;
								else reads++;
								return { views: writes };
							},
						};
					},
				};
			},
		},
	};
	const send = (target = path, options = {}) =>
		onRequest({
			env,
			request: new Request(`https://nvcc-v.com/api/views?path=${target}`, {
				method: "POST",
				headers: { "CF-Connecting-IP": "192.0.2.1", ...options.headers },
				...options,
			}),
		});
	return { env, send, stats: () => ({ writes, reads, indexReads }) };
}

test("nonexistent and malformed article paths cannot create database rows", async () => {
	const { send, stats } = fixture();
	assert.equal(
		(await send("/2099/99/99/nonexistent-audit-article/")).status,
		404,
	);
	assert.equal((await send("/invalid/")).status, 400);
	assert.equal(stats().writes, 0);
});

test("repeat views return the count without another write; GET never consumes limiter", async () => {
	const { send, stats } = fixture();
	assert.equal((await send(path, { method: "GET" })).status, 200);
	assert.deepEqual(await (await send()).json(), { views: 1 });
	assert.deepEqual(await (await send()).json(), { views: 1 });
	assert.deepEqual(stats(), { writes: 1, reads: 2, indexReads: 1 });
});

test("unavailable article index fails closed before writing", async () => {
	const { send, stats } = fixture({ unavailable: true });
	assert.equal((await send()).status, 503);
	assert.equal(stats().writes, 0);
});

test("cross-origin writes are rejected", async () => {
	const { send, stats } = fixture();
	assert.equal(
		(await send(path, { headers: { Origin: "https://other.example" } })).status,
		403,
	);
	assert.equal(stats().writes, 0);
});
