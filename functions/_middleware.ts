const CANONICAL_HOST = "nvcc-v.com";
const WWW_HOST = `www.${CANONICAL_HOST}`;

export const onRequest: PagesFunction = async ({ request, next }) => {
	const url = new URL(request.url);
	if (url.hostname === WWW_HOST) {
		url.hostname = CANONICAL_HOST;
		return Response.redirect(url, 301);
	}

	const response = await next();
	const location = response.headers.get("Location");
	if (response.status !== 307 || !location) return response;

	const destination = new URL(location, url);
	if (
		destination.origin !== url.origin ||
		destination.pathname !== `${url.pathname}/` ||
		destination.search !== url.search
	) {
		return response;
	}

	return new Response(response.body, {
		status: 308,
		statusText: "Permanent Redirect",
		headers: response.headers,
	});
};
