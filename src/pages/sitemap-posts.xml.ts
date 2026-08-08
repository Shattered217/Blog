import type { APIRoute } from "astro";
import { getSortedPosts } from "@utils/content-utils";
import { getPostUrl } from "@utils/url-utils";

const site = new URL("https://nvcc-v.com/");

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
	if (cover?.startsWith("/wp-content/uploads/")) images.add(cover);

	for (const match of body.matchAll(
		/(?<![A-Za-z0-9])\/wp-content\/uploads\/[^\s)"'<>]+/g,
	)) {
		images.add(match[0]);
	}

	return [...images].map((image) => new URL(image, site).href);
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
