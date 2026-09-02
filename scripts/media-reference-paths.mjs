const site = new URL("https://nvcc-v.com");
const mediaReferencePattern =
	/https?:\/\/[^\s)"'<>`]+\/wp-content\/uploads\/[^\s)"'<>`]+|(?<![A-Za-z0-9])\/wp-content\/uploads\/[^\s)"'<>`]+/g;

export function collectMediaPathnames(source) {
	const pathnames = new Set();
	for (const match of source.matchAll(mediaReferencePattern)) {
		let url;
		try {
			url = new URL(match[0], site);
		} catch {
			continue;
		}
		if (
			url.origin !== site.origin ||
			!url.pathname.startsWith("/wp-content/uploads/") ||
			url.pathname === "/wp-content/uploads/"
		) {
			continue;
		}

		let pathname = url.pathname;
		try {
			pathname = decodeURIComponent(pathname);
		} catch {
			// WordPress filenames are not guaranteed to be URI encoded.
		}
		pathnames.add(pathname);
	}
	return pathnames;
}
