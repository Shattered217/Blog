const CANONICAL_HOST = "nvcc-v.com";
const WWW_HOST = `www.${CANONICAL_HOST}`;

export const onRequest: PagesFunction = async ({ request, next }) => {
	const url = new URL(request.url);
	if (url.hostname === WWW_HOST) {
		url.hostname = CANONICAL_HOST;
		return Response.redirect(url, 301);
	}

	return next();
};
