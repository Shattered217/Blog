import type { APIRoute } from "astro";

const site = new URL("https://nvcc-v.com/");

export const GET: APIRoute = () => {
	const sitemapUrls = ["sitemap-pages-0.xml", "sitemap-posts.xml"];
	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...sitemapUrls.map(
			(path) => `  <sitemap><loc>${new URL(path, site).href}</loc></sitemap>`,
		),
		"</sitemapindex>",
		"",
	].join("\n");

	return new Response(xml, {
		headers: { "Content-Type": "application/xml; charset=utf-8" },
	});
};
