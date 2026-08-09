import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const distRoot = path.resolve("dist");
const site = "https://nvcc-v.com";

async function walk(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(absolutePath)));
		if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolutePath);
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

function attributes(tag) {
	const values = {};
	for (const [, name, value] of tag.matchAll(
		/([:\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g,
	)) {
		values[name] = value ?? "";
	}
	return values;
}

function metaValue(html, key, value) {
	for (const tag of html.match(/<meta\b[^>]*>/g) ?? []) {
		const attrs = attributes(tag);
		if (attrs[key] === value) return attrs.content;
	}
	return undefined;
}

function pagePath(filePath) {
	const relative = path.relative(distRoot, filePath).replaceAll(path.sep, "/");
	if (relative === "index.html") return "/";
	if (relative.endsWith("/index.html")) {
		return `/${relative.slice(0, -"index.html".length)}`;
	}
	return `/${relative}`;
}

async function internalTargetExists(href) {
	const pathname = href.split(/[?#]/, 1)[0];
	if (!pathname || pathname === "/") return exists(path.join(distRoot, "index.html"));
	if (pathname.startsWith("/wp-content/uploads/")) return true;

	let decoded = pathname;
	try {
		decoded = decodeURIComponent(pathname);
	} catch {
		// Keep malformed-but-literal paths for the existence check.
	}
	const relative = decoded.replace(/^\/+/, "");
	if (path.extname(relative)) return exists(path.join(distRoot, relative));
	return exists(path.join(distRoot, relative, "index.html"));
}

const failures = [];
const titlePages = new Map();
const descriptionPages = new Map();
const canonicalPages = new Map();
const nonArticleUrls = new Set();
const htmlFiles = await walk(distRoot);
let indexablePages = 0;
let articlePages = 0;
let checkedInternalLinks = 0;
let checkedLocalImages = 0;

for (const htmlFile of htmlFiles) {
	const html = await readFile(htmlFile, "utf8");
	const pathname = pagePath(htmlFile);
	const robots = metaValue(html, "name", "robots");
	if (/\bnoindex\b/i.test(robots ?? "")) continue;
	indexablePages++;

	const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
	if (h1Count !== 1) failures.push(`${pathname}: has ${h1Count} H1 elements`);

	const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
	const description = metaValue(html, "name", "description");
	const canonical = (html.match(/<link\b[^>]*>/g) ?? [])
		.map(attributes)
		.find((attrs) => attrs.rel === "canonical")?.href;
	const expectedCanonical = new URL(pathname, site).href;

	if (!title) failures.push(`${pathname}: missing title`);
	else titlePages.set(title, [...(titlePages.get(title) ?? []), pathname]);
	if (!description) failures.push(`${pathname}: missing meta description`);
	else {
		descriptionPages.set(description, [
			...(descriptionPages.get(description) ?? []),
			pathname,
		]);
	}
	if (canonical !== expectedCanonical) {
		failures.push(`${pathname}: canonical is ${canonical ?? "missing"}`);
	} else {
		canonicalPages.set(canonical, [
			...(canonicalPages.get(canonical) ?? []),
			pathname,
		]);
	}

	const ogImage = metaValue(html, "property", "og:image");
	const twitterImage = metaValue(html, "name", "twitter:image");
	if (!ogImage?.startsWith(`${site}/`)) failures.push(`${pathname}: invalid og:image`);
	if (twitterImage !== ogImage) failures.push(`${pathname}: twitter:image mismatch`);
	if (!metaValue(html, "property", "og:image:alt")) {
		failures.push(`${pathname}: missing og:image:alt`);
	}

	const isArticle = /^\/\d{4}\/\d{2}\/\d{2}\//.test(pathname);
	if (isArticle) {
		articlePages++;
		if (metaValue(html, "property", "og:type") !== "article") {
			failures.push(`${pathname}: og:type is not article`);
		}
		for (const property of ["article:published_time", "article:modified_time"]) {
			if (!metaValue(html, "property", property)) {
				failures.push(`${pathname}: missing ${property}`);
			}
		}

		const jsonLdSource =
			/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1];
		try {
			const jsonLd = JSON.parse(jsonLdSource ?? "");
			if (jsonLd["@type"] !== "BlogPosting") throw new Error("wrong @type");
			if (jsonLd.url !== expectedCanonical) throw new Error("wrong url");
			if (jsonLd.mainEntityOfPage?.["@id"] !== expectedCanonical) {
				throw new Error("wrong mainEntityOfPage");
			}
			if (jsonLd.image !== ogImage) throw new Error("image mismatch");
			if (!jsonLd.publisher?.logo?.url) throw new Error("missing publisher logo");
		} catch (error) {
			failures.push(`${pathname}: invalid BlogPosting JSON-LD (${error.message})`);
		}

		const coverContainer = /<div id="post-cover"[\s\S]*?<img\b[^>]*>/.exec(html)?.[0];
		if (!coverContainer) {
			failures.push(`${pathname}: missing article cover`);
		} else {
			const coverTag = /<img\b[^>]*>/.exec(coverContainer)?.[0] ?? "";
			const coverAttrs = attributes(coverTag);
			if (coverAttrs.loading !== "eager" || coverAttrs.fetchpriority !== "high") {
				failures.push(`${pathname}: article cover is not eager/high priority`);
			}
		}
	} else {
		nonArticleUrls.add(expectedCanonical);
	}

	for (const imageTag of html.match(/<img\b[^>]*>/g) ?? []) {
		const attrs = attributes(imageTag);
		if (!attrs.src?.startsWith("/wp-content/uploads/")) continue;
		checkedLocalImages++;
		if (!attrs.alt?.trim()) failures.push(`${pathname}: local image has empty alt`);
		if (!attrs.width || !attrs.height) {
			failures.push(`${pathname}: local image is missing intrinsic dimensions`);
		}
		if (!attrs.loading || !attrs.decoding) {
			failures.push(`${pathname}: local image is missing loading attributes`);
		}
	}

	for (const anchorTag of html.match(/<a\b[^>]*>/g) ?? []) {
		const href = attributes(anchorTag).href;
		if (!href?.startsWith("/") || href.startsWith("//")) continue;
		checkedInternalLinks++;
		if (!(await internalTargetExists(href))) {
			failures.push(`${pathname}: internal link target is missing: ${href}`);
		}
	}
}

for (const [title, pages] of titlePages) {
	if (pages.length > 1) failures.push(`duplicate title on ${pages.join(", ")}: ${title}`);
}
for (const [description, pages] of descriptionPages) {
	if (pages.length > 1) {
		failures.push(`duplicate description on ${pages.join(", ")}: ${description}`);
	}
}
for (const [canonical, pages] of canonicalPages) {
	if (pages.length > 1) failures.push(`duplicate canonical ${canonical}`);
}

const postSitemap = await readFile(path.join(distRoot, "sitemap-posts.xml"), "utf8");
const postSitemapEntries = postSitemap.match(/<url>/g)?.length ?? 0;
if (articlePages !== postSitemapEntries) {
	failures.push(
		`found ${articlePages} article pages; sitemap contains ${postSitemapEntries}`,
	);
}

const pageSitemap = await readFile(path.join(distRoot, "sitemap-pages-0.xml"), "utf8");
const pageSitemapEntries = pageSitemap.match(/<url>/g)?.length ?? 0;
if (pageSitemapEntries !== nonArticleUrls.size) {
	failures.push(
		`sitemap-pages-0.xml contains ${pageSitemapEntries} URLs; expected ${nonArticleUrls.size}`,
	);
}
for (const pageUrl of nonArticleUrls) {
	if (!pageSitemap.includes(`<loc>${pageUrl}</loc>`)) {
		failures.push(`sitemap-pages-0.xml is missing ${pageUrl}`);
	}
}

if (failures.length > 0) {
	console.error(failures.join("\n"));
	process.exitCode = 1;
} else {
	console.log(
		`Audited ${indexablePages} indexable pages, ${articlePages} articles, ${checkedInternalLinks} internal links, and ${checkedLocalImages} local image instances.`,
	);
}
