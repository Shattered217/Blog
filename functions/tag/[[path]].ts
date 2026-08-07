const legacyTags: Record<string, string> = {
	内网穿透: "/tag/network/",
	容器技术: "/tag/docker/",
	深度学习: "/tag/ai/",
	边缘计算: "/tag/ai/",
};

function decodedTag(pathParam: string | string[] | undefined): string | null {
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

export const onRequest: PagesFunction<unknown, "path"> = async (context) => {
	const target = legacyTags[decodedTag(context.params.path) ?? ""];
	if (!target) return context.next();
	if (context.request.method !== "GET" && context.request.method !== "HEAD") {
		return new Response("Method Not Allowed", {
			status: 405,
			headers: { Allow: "GET, HEAD" },
		});
	}

	const location = new URL(target, context.request.url);
	return Response.redirect(location, 301);
};
