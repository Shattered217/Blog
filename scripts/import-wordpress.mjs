import { access, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const siteUrl = process.env.WORDPRESS_URL || "https://nvcc-v.com";
const requestedLimit = Number.parseInt(process.argv[2] || "3", 10);
const limit = Number.isFinite(requestedLimit)
	? Math.min(Math.max(requestedLimit, 1), 100)
	: 3;
const outputDir = path.resolve("src/content/posts/imported");

const turndown = new TurndownService({
	bulletListMarker: "-",
	codeBlockStyle: "fenced",
	emDelimiter: "_",
	headingStyle: "atx",
});
turndown.use(gfm);
turndown.keep(["audio", "iframe", "video"]);

function plainText(html) {
	return turndown.turndown(html || "").replace(/\s+/g, " ").trim();
}

function normalizeInternalUrls(content) {
	const origin = new URL(siteUrl).origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return content.replace(new RegExp(origin, "g"), "");
}

async function repairImportedContent(content) {
	let repaired = content.replace(/!\[[^\]]*\]\(blob:[^)]+\)/g, "");
	const jpgPaths = [...new Set(repaired.match(/\/wp-content\/uploads\/[^)\s"']+\.jpg/g) || [])];
	for (const jpgPath of jpgPaths) {
		const jpegPath = jpgPath.replace(/\.jpg$/, ".jpeg");
		try {
			await access(path.resolve("media", jpegPath.replace(/^\//, "")));
			await access(path.resolve("media", jpgPath.replace(/^\//, "")));
		} catch {
			try {
				await access(path.resolve("media", jpegPath.replace(/^\//, "")));
				repaired = repaired.replaceAll(jpgPath, jpegPath);
			} catch {
				// Leave the original URL when neither extension exists locally.
			}
		}
	}
	return repaired;
}

function termsByTaxonomy(post, taxonomy) {
	return (post._embedded?.["wp:term"] || [])
		.flat()
		.filter((term) => term.taxonomy === taxonomy);
}

function frontmatterValue(value) {
	return JSON.stringify(value);
}

async function fetchPosts() {
	const endpoint = new URL("/wp-json/wp/v2/posts", siteUrl);
	endpoint.searchParams.set("per_page", String(limit));
	endpoint.searchParams.set("orderby", "date");
	endpoint.searchParams.set("order", "desc");
	endpoint.searchParams.set("_embed", "1");

	const response = await fetch(endpoint);
	if (!response.ok) {
		throw new Error(`WordPress returned ${response.status} for ${endpoint}`);
	}
	return response.json();
}

async function clearPreviousImports() {
	await mkdir(outputDir, { recursive: true });
	for (const file of await readdir(outputDir)) {
		if (file.endsWith(".md")) {
			await rm(path.join(outputDir, file));
		}
	}
}

async function importPost(post) {
	const published = post.date.slice(0, 10);
	const updated = post.modified.slice(0, 10);
	const categories = termsByTaxonomy(post, "category");
	const tags = termsByTaxonomy(post, "post_tag");
	const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
	const permalink = new URL(post.link).pathname;
	const markdown = await repairImportedContent(
		normalizeInternalUrls(turndown.turndown(post.content?.rendered || "")),
	);

	const frontmatter = [
		"---",
		`title: ${frontmatterValue(plainText(post.title?.rendered))}`,
		`published: ${published}`,
		...(updated !== published ? [`updated: ${updated}`] : []),
		`description: ${frontmatterValue(plainText(post.excerpt?.rendered))}`,
		`image: ${frontmatterValue(featuredImage ? normalizeInternalUrls(featuredImage) : "")}`,
		`tags: ${frontmatterValue(tags.map((tag) => tag.name))}`,
		`tagPermalinks: ${frontmatterValue(tags.map((tag) => new URL(tag.link).pathname))}`,
		`category: ${frontmatterValue(categories[0]?.name || "")}`,
		`categoryPermalink: ${frontmatterValue(categories[0] ? new URL(categories[0].link).pathname : "")}`,
		"lang: zh_CN",
		`permalink: ${frontmatterValue(permalink)}`,
		"---",
		"",
	].join("\n");

	await writeFile(
		path.join(outputDir, `${post.slug}.md`),
		`${frontmatter}${markdown}\n`,
		"utf8",
	);
	return permalink;
}

await clearPreviousImports();
const posts = await fetchPosts();
for (const post of posts) {
	const permalink = await importPost(post);
	console.log(`Imported ${permalink}`);
}
