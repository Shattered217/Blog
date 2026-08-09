interface Env {
	BLOG_DB: D1Database;
}

type ViewRow = { views: number };

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
	const origin = request.headers.get("Origin");
	if (
		request.method === "POST" &&
		origin &&
		origin !== new URL(request.url).origin
	) {
		return json({ error: "Invalid request origin" }, 403);
	}

	if (request.method === "GET") {
		const row = await env.BLOG_DB.prepare(
			"SELECT views FROM post_views WHERE path = ?",
		)
			.bind(path)
			.first<ViewRow>();
		return row ? json(row) : json({ error: "Article not found" }, 404);
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
