import mediaDimensions from "../data/media-dimensions.json";

export type MediaDimensions = {
	width: number;
	height: number;
};

const SITE_ORIGIN = "https://nvcc-v.com";
const SITE_MEDIA_PREFIX = `${SITE_ORIGIN}/wp-content/uploads/`;

export function getInternalMediaPath(
	source: string | undefined,
): string | undefined {
	if (!source) return undefined;
	const cleanSource = source.split(/[?#]/, 1)[0];
	if (cleanSource.startsWith(SITE_MEDIA_PREFIX)) {
		return cleanSource.slice(SITE_ORIGIN.length);
	}
	let pathname = cleanSource;

	if (!cleanSource.startsWith("/")) {
		try {
			const url = new URL(cleanSource);
			if (url.origin !== SITE_ORIGIN) return undefined;
			pathname = url.pathname;
		} catch {
			return undefined;
		}
	}

	return pathname.startsWith("/wp-content/uploads/") ? pathname : undefined;
}

export function getMediaDimensions(
	source: string | undefined,
): MediaDimensions | undefined {
	let pathname = getInternalMediaPath(source);
	if (!pathname) return undefined;
	try {
		pathname = decodeURIComponent(pathname);
	} catch {
		// WordPress filenames are not guaranteed to be URI encoded.
	}
	return (mediaDimensions as Record<string, MediaDimensions>)[pathname];
}
