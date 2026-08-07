interface Env {
	MEDIA: R2Bucket;
}

const CACHE_CONTROL = "public, max-age=2592000, immutable";

const contentTypes: Record<string, string> = {
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

function mediaKey(pathParam: string | string[] | undefined): string | null {
	const encodedPath = Array.isArray(pathParam)
		? pathParam.join("/")
		: pathParam;
	if (!encodedPath) return null;

	let relativePath: string;
	try {
		relativePath = decodeURIComponent(encodedPath);
	} catch {
		return null;
	}
	if (relativePath.split("/").includes("..")) return null;
	return `wp-content/uploads/${relativePath}`;
}

function contentTypeFor(key: string): string {
	const extension = key.split(".").pop()?.toLowerCase() ?? "";
	return contentTypes[extension] ?? "application/octet-stream";
}

function responseHeaders(object: R2Object): Headers {
	const headers = new Headers();
	object.writeHttpMetadata(headers);
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", contentTypeFor(object.key));
	}
	headers.set("Accept-Ranges", "bytes");
	headers.set("Cache-Control", CACHE_CONTROL);
	headers.set("ETag", object.httpEtag);
	headers.set("Last-Modified", object.uploaded.toUTCString());
	headers.set("X-Content-Type-Options", "nosniff");
	return headers;
}

function applyRangeHeaders(
	headers: Headers,
	object: R2Object,
	rangeHeader: string | null,
): number {
	if (!rangeHeader) {
		headers.set("Content-Length", String(object.size));
		return 200;
	}

	const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
	if (!match) return 200;
	let start: number;
	let end: number;
	if (!match[1]) {
		const suffixLength = Math.min(Number.parseInt(match[2], 10), object.size);
		start = object.size - suffixLength;
		end = object.size - 1;
	} else {
		start = Number.parseInt(match[1], 10);
		end = match[2]
			? Math.min(Number.parseInt(match[2], 10), object.size - 1)
			: object.size - 1;
	}
	const length = end - start + 1;
	headers.set("Content-Length", String(length));
	headers.set("Content-Range", `bytes ${start}-${end}/${object.size}`);
	return 206;
}

function isNotModified(
	request: Request,
	etagValue: string,
	modifiedAt: Date,
): boolean {
	const etag = request.headers.get("If-None-Match");
	if (etag && etag.split(",").map((value) => value.trim()).includes(etagValue)) {
		return true;
	}
	const modifiedSince = request.headers.get("If-Modified-Since");
	return Boolean(
		modifiedSince &&
			modifiedAt.getTime() <= new Date(modifiedSince).getTime(),
	);
}

export const onRequest: PagesFunction<Env, "path"> = async (context) => {
	const { request, env } = context;
	if (request.method !== "GET" && request.method !== "HEAD") {
		return new Response("Method Not Allowed", {
			status: 405,
			headers: { Allow: "GET, HEAD" },
		});
	}

	const key = mediaKey(context.params.path);
	if (!key) return new Response("Not Found", { status: 404 });

	const hasRange = request.headers.has("Range");
	const cache = caches.default;
	const cacheUrl = new URL(request.url);
	cacheUrl.search = "";
	const cacheRequest = new Request(cacheUrl, { method: "GET" });
	if (request.method === "GET" && !hasRange) {
		const cached = await cache.match(cacheRequest);
		if (cached) {
			const cachedEtag = cached.headers.get("ETag") ?? "";
			const cachedModified = new Date(
				cached.headers.get("Last-Modified") ?? 0,
			);
			if (isNotModified(request, cachedEtag, cachedModified)) {
				return new Response(null, { status: 304, headers: cached.headers });
			}
			return cached;
		}
	}

	const object =
		request.method === "HEAD"
			? await env.MEDIA.head(key)
			: await env.MEDIA.get(key, { range: request.headers });
	if (!object) {
		return new Response("Not Found", {
			status: 404,
			headers: { "Cache-Control": "public, max-age=60" },
		});
	}

	const headers = responseHeaders(object);
	if (isNotModified(request, object.httpEtag, object.uploaded)) {
		return new Response(null, { status: 304, headers });
	}
	if (request.method === "HEAD") {
		headers.set("Content-Length", String(object.size));
		return new Response(null, { status: 200, headers });
	}

	const status = applyRangeHeaders(
		headers,
		object,
		request.headers.get("Range"),
	);
	const response = new Response(object.body, { status, headers });
	if (!hasRange && status === 200) {
		context.waitUntil(cache.put(cacheRequest, response.clone()));
	}
	return response;
};
