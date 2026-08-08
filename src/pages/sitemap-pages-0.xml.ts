import { PAGE_SIZE } from "@constants/constants";
import { getSeriesGroups, getSortedPosts } from "@utils/content-utils";
import type { APIRoute } from "astro";

const site = new URL("https://nvcc-v.com/");

function latestDate(dates: Date[]): Date | undefined {
	return dates.reduce<Date | undefined>(
		(latest, date) => (!latest || date > latest ? date : latest),
		undefined,
	);
}

export const GET: APIRoute = async () => {
	const posts = await getSortedPosts();
	const pages = new Map<string, Date | undefined>([
		["/about/", undefined],
		["/about-site/", undefined],
		["/friends/", undefined],
	]);
	const postDate = (index: number) =>
		posts[index].data.updated ?? posts[index].data.published;
	const allPostsDate = latestDate(posts.map((_, index) => postDate(index)));

	pages.set("/archive/", allPostsDate);
	for (let offset = 0; offset < posts.length; offset += PAGE_SIZE) {
		const pageNumber = offset / PAGE_SIZE + 1;
		const pathname = pageNumber === 1 ? "/" : `/${pageNumber}/`;
		pages.set(
			pathname,
			latestDate(
				posts
					.slice(offset, offset + PAGE_SIZE)
					.map((post) => post.data.updated ?? post.data.published),
			),
		);
	}

	for (const post of posts) {
		const modified = post.data.updated ?? post.data.published;
		const paths = [post.data.categoryPermalink, ...post.data.tagPermalinks];
		for (const pathname of paths) {
			if (!pathname) continue;
			const existing = pages.get(pathname);
			if (!existing || modified > existing) pages.set(pathname, modified);
		}
	}

	for (const series of getSeriesGroups(posts)) {
		pages.set(
			`/series/${series.slug}/`,
			latestDate(
				series.posts.map((post) => post.data.updated ?? post.data.published),
			),
		);
	}

	const entries = [...pages.entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([pathname, lastModified]) => {
			const lines = [
				"  <url>",
				`    <loc>${new URL(pathname, site).href}</loc>`,
			];
			if (lastModified) {
				lines.push(`    <lastmod>${lastModified.toISOString()}</lastmod>`);
			}
			lines.push("  </url>");
			return lines.join("\n");
		});

	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...entries,
		"</urlset>",
		"",
	].join("\n");

	return new Response(xml, {
		headers: { "Content-Type": "application/xml; charset=utf-8" },
	});
};
