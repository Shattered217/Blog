interface Env {
	BLOG_DB: D1Database;
	ASSETS: Fetcher;
	VIEW_RATE_LIMIT: RateLimit;
}

type ViewRow = { views: number };

const publishedPaths = new WeakMap<Fetcher, Promise<Set<string>>>();

function getPublishedPaths(
	assets: Fetcher,
	origin: string,
): Promise<Set<string>> {
	let pending = publishedPaths.get(assets);
	if (!pending) {
		pending = (async () => {
			const response = await assets.fetch(
				new Request(new URL("/sitemap-posts.xml", origin)),
			);
			if (!response.ok) throw new Error("Published article index unavailable");
			const xml = await response.text();
			if (!xml.includes("<urlset")) throw new Error("Invalid article index");
			return new Set(
				[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
					.map(([, value]) => {
						const url = new URL(value);
						return url.origin === "https://nvcc-v.com" ? url.pathname : "";
					})
					.filter(Boolean),
			);
		})();
		publishedPaths.set(assets, pending);
		pending.catch(() => publishedPaths.delete(assets));
	}
	return pending;
}

function json(data: unknown, status = 200): Response {
	return Response.json(data, {
		status,
		headers: {
			"Cache-Control": "no-store",
			"Content-Type": "application/json; charset=utf-8",
			"X-Content-Type-Options": "nosniff",
		},
	});
}

function articlePath(request: Request): string | null {
	const path = new URL(request.url).searchParams.get("path");
	if (!path || !/^\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+\/$/.test(path)) {
		return null;
	}
	return path;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
	if (request.method !== "GET" && request.method !== "POST") {
		return new Response("Method Not Allowed", {
			status: 405,
			headers: { Allow: "GET, POST" },
		});
	}

	const path = articlePath(request);
	if (!path) return json({ error: "Invalid article path" }, 400);
	try {
		if (!(await getPublishedPaths(env.ASSETS, request.url)).has(path)) {
			return json({ error: "Article not found" }, 404);
		}
	} catch {
		return json({ error: "Article index unavailable" }, 503);
	}
	const origin = request.headers.get("Origin");
	if (
		request.method === "POST" &&
		origin &&
		origin !== new URL(request.url).origin
	) {
		return json({ error: "Invalid request origin" }, 403);
	}

	let increment = request.method === "POST";
	if (increment) {
		const ip = request.headers.get("CF-Connecting-IP");
		if (!ip) return json({ error: "Client address unavailable" }, 400);
		if (!env.VIEW_RATE_LIMIT)
			return json({ error: "View limiter unavailable" }, 503);
		const digest = await crypto.subtle.digest(
			"SHA-256",
			new TextEncoder().encode(`${ip}:${path}`),
		);
		const key = Array.from(new Uint8Array(digest), (byte) =>
			byte.toString(16).padStart(2, "0"),
		).join("");
		increment = (await env.VIEW_RATE_LIMIT.limit({ key })).success;
	}

	if (!increment) {
		const row = await env.BLOG_DB.prepare(
			"SELECT views FROM post_views WHERE path = ?",
		)
			.bind(path)
			.first<ViewRow>();
		return json(row ?? { views: 0 });
	}

	const row = await env.BLOG_DB.prepare(
		[
			"INSERT INTO post_views (path, views) VALUES (?, 1)",
			"ON CONFLICT(path) DO UPDATE SET views = post_views.views + 1,",
			"updated_at = CURRENT_TIMESTAMP RETURNING views",
		].join(" "),
	)
		.bind(path)
		.first<ViewRow>();
	return row ? json(row) : json({ error: "Article not found" }, 404);
};
