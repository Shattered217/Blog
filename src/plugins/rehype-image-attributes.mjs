import { readFileSync } from "node:fs";
import { visit } from "unist-util-visit";

const dimensions = JSON.parse(
	readFileSync(
		new URL("../data/media-dimensions.json", import.meta.url),
		"utf8",
	),
);
const siteOrigin = "https://nvcc-v.com";

function mediaPath(source) {
	if (typeof source !== "string") return undefined;
	const cleanSource = source.split(/[?#]/, 1)[0];
	let pathname = cleanSource;
	if (cleanSource.startsWith(`${siteOrigin}/wp-content/uploads/`)) {
		pathname = cleanSource.slice(siteOrigin.length);
	}
	if (!pathname.startsWith("/wp-content/uploads/")) return undefined;

	let dimensionKey = pathname;
	try {
		dimensionKey = decodeURIComponent(pathname);
	} catch {
		// WordPress filenames are not guaranteed to be URI encoded.
	}
	return { dimensionKey, pathname };
}

export function rehypeImageAttributes() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "img") return;
			node.properties ??= {};
			node.properties.loading ??= "lazy";
			node.properties.decoding ??= "async";

			const media = mediaPath(node.properties.src);
			if (media) node.properties.src = media.pathname;
			const size = media ? dimensions[media.dimensionKey] : undefined;
			if (!size) return;
			node.properties.width ??= size.width;
			node.properties.height ??= size.height;
		});
	};
}
