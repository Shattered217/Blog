import assert from "node:assert/strict";
import test from "node:test";
import { onRequest } from "../wp-content/uploads/[[path]].ts";

test("media conditional requests respect ETag precedence and weak validators", async () => {
	const uploaded = new Date("2026-10-21T00:00:00.456Z");
	const cached = () =>
		new Response("current image", {
			headers: { ETag: '"current"', "Last-Modified": uploaded.toUTCString() },
		});
	globalThis.caches = { default: { match: async () => cached() } };
	for (const [headers, expected] of [
		[
			{
				"If-None-Match": '"different"',
				"If-Modified-Since": "Fri, 23 Oct 2026 00:00:00 GMT",
			},
			200,
		],
		[{ "If-None-Match": 'W/"current"' }, 304],
		[{ "If-None-Match": '"other", W/"current"' }, 304],
		[{ "If-None-Match": "*" }, 304],
		[{ "If-Modified-Since": uploaded.toUTCString() }, 304],
		[{ "If-Modified-Since": "invalid date" }, 200],
	]) {
		const response = await onRequest({
			request: new Request("https://nvcc-v.com/wp-content/uploads/test.webp", {
				headers,
			}),
			params: { path: "test.webp" },
			env: {},
			waitUntil() {},
		});
		assert.equal(response.status, expected, JSON.stringify(headers));
		if (expected === 200) assert.equal(await response.text(), "current image");
	}
});

test("uncached HEAD uses the same ETag rules without reading the body", async () => {
	const response = await onRequest({
		request: new Request("https://nvcc-v.com/wp-content/uploads/test.webp", {
			method: "HEAD",
			headers: {
				"If-None-Match": '"old"',
				"If-Modified-Since": "Fri, 23 Oct 2026 00:00:00 GMT",
			},
		}),
		params: { path: "test.webp" },
		env: {
			MEDIA: {
				head: async () => ({
					key: "test.webp",
					size: 12,
					httpEtag: '"current"',
					uploaded: new Date("2026-10-21"),
					writeHttpMetadata() {},
				}),
			},
		},
	});
	assert.equal(response.status, 200);
	assert.equal(response.headers.get("Content-Length"), "12");
	assert.equal(await response.text(), "");
});
