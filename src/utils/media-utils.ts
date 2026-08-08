import mediaDimensions from "../data/media-dimensions.json";

export type MediaDimensions = {
	width: number;
	height: number;
};

export function getMediaDimensions(
	source: string | undefined,
): MediaDimensions | undefined {
	if (!source?.startsWith("/wp-content/uploads/")) return undefined;
	let pathname = source.split(/[?#]/, 1)[0];
	try {
		pathname = decodeURIComponent(pathname);
	} catch {
		// WordPress filenames are not guaranteed to be URI encoded.
	}
	return (mediaDimensions as Record<string, MediaDimensions>)[pathname];
}
