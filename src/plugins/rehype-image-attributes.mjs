import { readFileSync } from "node:fs";
import { visit } from "unist-util-visit";

const dimensions = JSON.parse(
	readFileSync(new URL("../data/media-dimensions.json", import.meta.url), "utf8"),
);

function mediaPath(source) {
	if (typeof source !== "string" || !source.startsWith("/wp-content/uploads/")) {
		return undefined;
	}
	let pathname = source.split(/[?#]/, 1)[0];
	try {
		pathname = decodeURIComponent(pathname);
	} catch {
		// WordPress filenames are not guaranteed to be URI encoded.
	}
	return pathname;
}

export function rehypeImageAttributes() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "img") return;
			node.properties ??= {};
			node.properties.loading ??= "lazy";
			node.properties.decoding ??= "async";

			const pathname = mediaPath(node.properties.src);
			const size = pathname ? dimensions[pathname] : undefined;
			if (!size) return;
			node.properties.width ??= size.width;
			node.properties.height ??= size.height;
		});
	};
}
