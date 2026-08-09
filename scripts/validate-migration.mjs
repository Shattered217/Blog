import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const postsRoot = path.resolve("src/content/posts/imported");
const distRoot = path.resolve("dist");
const mediaRoot = path.resolve("media");
const mediaManifestPath = path.resolve("media-manifest.json");
const site = "https://nvcc-v.com";

async function walk(directory, extension) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory())
			files.push(...(await walk(absolutePath, extension)));
		if (entry.isFile() && entry.name.endsWith(extension))
			files.push(absolutePath);
	}
	return files;
}

async function exists(filePath) {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

function frontmatterJson(markdown, field) {
	const match = new RegExp(`^${field}: (.+)$`, "m").exec(markdown);
	return match ? JSON.parse(match[1]) : undefined;
}

function outputPath(urlPath) {
	return path.join(distRoot, urlPath.replace(/^\/+|\/+$/g, ""), "index.html");
}

function normalizeMediaPath(source) {
	let url;
	try {
		url = new URL(source, site);
	} catch {
		return undefined;
	}
	if (
		url.origin !== new URL(site).origin ||
		!url.pathname.startsWith("/wp-content/uploads/")
	) {
		return undefined;
	}

	let pathname = url.pathname;
	try {
		pathname = decodeURIComponent(pathname);
	} catch {
		// WordPress filenames are not guaranteed to be URI encoded.
	}
	return pathname;
}

const failures = [];
const mediaManifest = JSON.parse(await readFile(mediaManifestPath, "utf8"));
const manifestMedia = new Set(
	mediaManifest.objects.map((object) => object.key),
);
const hasLocalMedia = await exists(mediaRoot);
const postFiles = await walk(postsRoot, ".md");
const articleUrls = [];
const taxonomyUrls = new Set();
const referencedMedia = new Set();
const postImages = new Map();

for (const postFile of postFiles) {
	const markdown = await readFile(postFile, "utf8");
	const permalink = frontmatterJson(markdown, "permalink");
	const cover = frontmatterJson(markdown, "image");
	const categoryPermalink = frontmatterJson(markdown, "categoryPermalink");
	const tags = frontmatterJson(markdown, "tags") ?? [];
	const tagPermalinks = frontmatterJson(markdown, "tagPermalinks") ?? [];
	if (!permalink) {
		failures.push(`${postFile}: missing permalink`);
		continue;
	}

	articleUrls.push(permalink);
	if (tags.length > 2) {
		failures.push(`${permalink}: has ${tags.length} tags; expected at most 2`);
	}
	if (/AI智能摘要|AI\s*生成的文章内容摘要/.test(markdown)) {
		failures.push(`${permalink}: contains an AI summary block`);
	}
	if (/http:\/\/154\.17\.6\.113/i.test(markdown)) {
		failures.push(`${permalink}: contains a legacy origin URL`);
	}

	const localImages = new Set();
	if (cover) {
		const coverPath = normalizeMediaPath(cover);
		if (coverPath) localImages.add(coverPath);
		else failures.push(`${permalink}: contains invalid cover image ${cover}`);
	}
	for (const [, alt, source] of markdown.matchAll(
		/!\[([^\n]*)\]\((<?[^)\s>]+>?)(?:\s+["'][^"']*["'])?\)/g,
	)) {
		if (!alt.trim())
			failures.push(`${permalink}: contains an image without alt text`);
		const cleanSource = source.replace(/^<|>$/g, "");
		const mediaPath = normalizeMediaPath(cleanSource);
		if (mediaPath) localImages.add(mediaPath);
		else if (/^https?:\/\//i.test(cleanSource)) {
			failures.push(`${permalink}: contains external image ${cleanSource}`);
		}
	}
	postImages.set(permalink, localImages);
	for (const image of localImages)
		referencedMedia.add(image.replace(/^\//, ""));
	if (categoryPermalink) taxonomyUrls.add(categoryPermalink);
	for (const tagPermalink of tagPermalinks) taxonomyUrls.add(tagPermalink);

	const htmlPath = outputPath(permalink);
	if (!(await exists(htmlPath))) {
		failures.push(`${permalink}: missing generated HTML`);
		continue;
	}
	const html = await readFile(htmlPath, "utf8");
	const canonical = new URL(permalink, site).href;
	if (!html.includes(`<link rel="canonical" href="${canonical}">`)) {
		failures.push(`${permalink}: canonical mismatch`);
	}
	if (/name="robots"[^>]+noindex/i.test(html)) {
		failures.push(`${permalink}: unexpectedly marked noindex`);
	}

	for (const match of html.matchAll(
		/(?:src|href)="(\/wp-content\/uploads\/[^"#?]+)["#?]/g,
	)) {
		const mediaPath = normalizeMediaPath(match[1].replaceAll("&amp;", "&"));
		referencedMedia.add(mediaPath.replace(/^\//, ""));
	}
}

for (const taxonomyUrl of taxonomyUrls) {
	if (!(await exists(outputPath(taxonomyUrl)))) {
		failures.push(`${taxonomyUrl}: missing taxonomy page`);
	}
}

const redirects = await readFile(path.resolve("public/_redirects"), "utf8");
const legacyTagRedirects = redirects
	.split("\n")
	.map((line) => line.trim().split(/\s+/))
	.filter(
		([source, target, status]) =>
			source?.startsWith("/tag/") &&
			target?.startsWith("/tag/") &&
			status === "301",
	);
for (const [source, target] of legacyTagRedirects) {
	if (taxonomyUrls.has(source)) {
		failures.push(`${source}: retained taxonomy must not also redirect`);
	}
	if (!(await exists(outputPath(target)))) {
		failures.push(`${source}: redirect target ${target} is missing`);
	}
}

for (const mediaPath of referencedMedia) {
	if (
		!(hasLocalMedia
			? await exists(path.join(mediaRoot, mediaPath))
			: manifestMedia.has(mediaPath))
	) {
		failures.push(`/${mediaPath}: missing R2 source object`);
	}
}

for (const legacyPath of ["about", "about-site", "friends"]) {
	if (!(await exists(path.join(distRoot, legacyPath, "index.html")))) {
		failures.push(`/${legacyPath}/: missing legacy page`);
	}
}

const rss = await readFile(path.join(distRoot, "rss.xml"), "utf8");
const rssItems = (rss.match(/<item>/g) ?? []).length;
if (rssItems !== postFiles.length) {
	failures.push(`RSS contains ${rssItems} items; expected ${postFiles.length}`);
}

const sitemapIndex = await readFile(
	path.join(distRoot, "sitemap-index.xml"),
	"utf8",
);
for (const sitemapName of ["sitemap-pages-0.xml", "sitemap-posts.xml"]) {
	const sitemapUrl = new URL(sitemapName, site).href;
	if (!sitemapIndex.includes(`<loc>${sitemapUrl}</loc>`)) {
		failures.push(`sitemap-index.xml: missing ${sitemapUrl}`);
	}
}

const pageSitemap = await readFile(
	path.join(distRoot, "sitemap-pages-0.xml"),
	"utf8",
);
const sitemap = await readFile(
	path.join(distRoot, "sitemap-posts.xml"),
	"utf8",
);
const sitemapEntries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
	([, entry]) => entry,
);
if (sitemapEntries.length !== postFiles.length) {
	failures.push(
		`sitemap-posts.xml contains ${sitemapEntries.length} URLs; expected ${postFiles.length}`,
	);
}
for (const articleUrl of articleUrls) {
	const absoluteArticleUrl = new URL(articleUrl, site).href;
	const sitemapEntry = sitemapEntries.find((entry) =>
		entry.includes(`<loc>${absoluteArticleUrl}</loc>`),
	);
	if (!sitemapEntry) {
		failures.push(`${articleUrl}: missing from sitemap`);
		continue;
	}
	if (!/<lastmod>[^<]+<\/lastmod>/.test(sitemapEntry)) {
		failures.push(`${articleUrl}: sitemap entry is missing lastmod`);
	}
	for (const image of postImages.get(articleUrl) ?? []) {
		const imageUrl = new URL(image, site).href;
		if (!sitemapEntry.includes(`<image:loc>${imageUrl}</image:loc>`)) {
			failures.push(`${articleUrl}: sitemap is missing image ${image}`);
		}
	}
	if (pageSitemap.includes(absoluteArticleUrl)) {
		failures.push(`${articleUrl}: unexpectedly included in page sitemap`);
	}
}

const robots = await readFile(path.join(distRoot, "robots.txt"), "utf8");
if (!robots.includes(`Sitemap: ${new URL("sitemap-index.xml", site).href}`)) {
	failures.push("robots.txt: missing canonical sitemap index URL");
}

const notFound = await readFile(path.join(distRoot, "404.html"), "utf8");
if (!/name="robots" content="noindex, follow"/.test(notFound)) {
	failures.push("404.html: missing noindex directive");
}
if (await exists(path.join(distRoot, "wp-content"))) {
	failures.push("dist/wp-content exists; media must be served from R2");
}

if (failures.length > 0) {
	console.error(failures.join("\n"));
	process.exitCode = 1;
} else {
	console.log(
		`Validated ${postFiles.length} posts, ${taxonomyUrls.size} taxonomy pages, ${legacyTagRedirects.length} legacy tag redirects, and ${referencedMedia.size} referenced media objects.`,
	);
}
