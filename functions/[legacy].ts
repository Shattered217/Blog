const legacyPages: Record<string, string> = {
	关于本站: "/about-site/",
	友情链接: "/friends/",
};

function decodedPath(pathParam: string | string[] | undefined): string | null {
	const value = Array.isArray(pathParam) ? pathParam.join("/") : pathParam;
	if (!value) return null;
	let decoded = value;
	try {
		for (let attempt = 0; attempt < 3; attempt += 1) {
			const next = decodeURIComponent(decoded);
			if (next === decoded) break;
			decoded = next;
		}
		return decoded;
	} catch {
		return null;
	}
}

export const onRequest: PagesFunction<unknown, "legacy"> = async (context) => {
	const target = legacyPages[decodedPath(context.params.legacy) ?? ""];
	if (!target) return context.next();
	if (context.request.method !== "GET" && context.request.method !== "HEAD") {
		return new Response("Method Not Allowed", {
			status: 405,
			headers: { Allow: "GET, HEAD" },
		});
	}

	return Response.redirect(new URL(target, context.request.url), 302);
};
