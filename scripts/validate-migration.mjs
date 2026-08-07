import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const postsRoot = path.resolve("src/content/posts/imported");
const distRoot = path.resolve("dist");
const mediaRoot = path.resolve("media");
const site = "https://nvcc-v.com";

async function walk(directory, extension) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(absolutePath, extension)));
		if (entry.isFile() && entry.name.endsWith(extension)) files.push(absolutePath);
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

const failures = [];
const postFiles = await walk(postsRoot, ".md");
const articleUrls = [];
const taxonomyUrls = new Set();
const referencedMedia = new Set();

for (const postFile of postFiles) {
	const markdown = await readFile(postFile, "utf8");
	const permalink = frontmatterJson(markdown, "permalink");
	const categoryPermalink = frontmatterJson(markdown, "categoryPermalink");
	const tagPermalinks = frontmatterJson(markdown, "tagPermalinks") ?? [];
	if (!permalink) {
		failures.push(`${postFile}: missing permalink`);
		continue;
	}

	articleUrls.push(permalink);
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

	for (const match of html.matchAll(/(?:src|href)="(\/wp-content\/uploads\/[^"#?]+)["#?]/g)) {
		let mediaPath = match[1].replaceAll("&amp;", "&");
		try {
			mediaPath = decodeURIComponent(mediaPath);
		} catch {
			// WordPress filenames are not guaranteed to be URI encoded.
		}
		referencedMedia.add(mediaPath.replace(/^\//, ""));
	}
}

for (const taxonomyUrl of taxonomyUrls) {
	if (!(await exists(outputPath(taxonomyUrl)))) {
		failures.push(`${taxonomyUrl}: missing taxonomy page`);
	}
}

for (const mediaPath of referencedMedia) {
	if (!(await exists(path.join(mediaRoot, mediaPath)))) {
		failures.push(`/${mediaPath}: missing R2 source object`);
	}
}

for (const legacyPath of ["关于本站", "友情链接"]) {
	if (!(await exists(path.join(distRoot, legacyPath, "index.html")))) {
		failures.push(`/${legacyPath}/: missing legacy page`);
	}
}

const rss = await readFile(path.join(distRoot, "rss.xml"), "utf8");
const rssItems = (rss.match(/<item>/g) ?? []).length;
if (rssItems !== postFiles.length) {
	failures.push(`RSS contains ${rssItems} items; expected ${postFiles.length}`);
}

const sitemap = await readFile(path.join(distRoot, "sitemap-0.xml"), "utf8");
for (const articleUrl of articleUrls) {
	if (!sitemap.includes(new URL(articleUrl, site).href)) {
		failures.push(`${articleUrl}: missing from sitemap`);
	}
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
		`Validated ${postFiles.length} posts, ${taxonomyUrls.size} taxonomy pages, and ${referencedMedia.size} referenced media objects.`,
	);
}
