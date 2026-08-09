import { getSortedPosts } from "@utils/content-utils";
import { getPostUrl } from "@utils/url-utils";
import type { APIRoute } from "astro";

const site = new URL("https://nvcc-v.com/");

function internalMediaUrl(source: string | undefined): string | undefined {
	if (!source) return undefined;
	try {
		const url = new URL(source, site);
		if (
			url.origin === site.origin &&
			url.pathname.startsWith("/wp-content/uploads/")
		) {
			return url.href;
		}
	} catch {
		return undefined;
	}
	return undefined;
}

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

function collectPostImages(body: string, cover?: string): string[] {
	const images = new Set<string>();
	const coverUrl = internalMediaUrl(cover);
	if (coverUrl) images.add(coverUrl);

	for (const match of body.matchAll(
		/(?:https:\/\/nvcc-v\.com)?\/wp-content\/uploads\/[^\s)"'<>]+/g,
	)) {
		const imageUrl = internalMediaUrl(match[0]);
		if (imageUrl) images.add(imageUrl);
	}

	return [...images];
}

export const GET: APIRoute = async () => {
	const posts = await getSortedPosts();
	const entries = posts.map((post) => {
		const postUrl = new URL(
			getPostUrl(post.slug, post.data.published, post.data.permalink),
			site,
		).href;
		const lastModified = post.data.updated ?? post.data.published;
		const images = collectPostImages(post.body, post.data.image);
		const imageEntries = images
			.map(
				(image) =>
					`    <image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`,
			)
			.join("\n");

		return [
			"  <url>",
			`    <loc>${escapeXml(postUrl)}</loc>`,
			`    <lastmod>${lastModified.toISOString()}</lastmod>`,
			imageEntries,
			"  </url>",
		]
			.filter(Boolean)
			.join("\n");
	});

	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
		...entries,
		"</urlset>",
		"",
	].join("\n");

	return new Response(xml, {
		headers: { "Content-Type": "application/xml; charset=utf-8" },
	});
};
