import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_SITE = "https://nvcc-v.com/";
const DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow";
const DEFAULT_SITEMAP = "sitemap-index.xml";
const MAX_URLS_PER_REQUEST = 10_000;

function usage() {
	console.log(`Usage:
  pnpm seo:submit:indexnow -- <url-or-path> [...]
  pnpm seo:submit:indexnow -- --file urls.txt
  pnpm seo:submit:indexnow -- --sitemap[=https://nvcc-v.com/sitemap-index.xml]

Options:
  --dry-run          Resolve and validate URLs without submitting them
  --file <path>      Read one URL or site-relative path per line
  --sitemap[=<url>]  Submit every canonical URL in the sitemap index
  --help             Show this help

Environment:
  SITE_URL, INDEXNOW_ENDPOINT, INDEXNOW_KEY, INDEXNOW_KEY_FILE`);
}

function parseArguments(argv) {
	const options = { dryRun: false, files: [], sitemap: null, urls: [] };
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === "--") continue;
		if (argument === "--help" || argument === "-h") {
			usage();
			process.exit(0);
		}
		if (argument === "--dry-run") {
			options.dryRun = true;
			continue;
		}
		if (argument === "--file") {
			const file = argv[++index];
			if (!file) throw new Error("--file requires a path");
			options.files.push(file);
			continue;
		}
		if (argument === "--sitemap") {
			options.sitemap = DEFAULT_SITEMAP;
			continue;
		}
		if (argument.startsWith("--sitemap=")) {
			options.sitemap = argument.slice("--sitemap=".length);
			continue;
		}
		if (argument.startsWith("-")) {
			throw new Error(`Unknown option: ${argument}`);
		}
		options.urls.push(argument);
	}
	return options;
}

function decodeXml(value) {
	return value
		.replaceAll("&amp;", "&")
		.replaceAll("&lt;", "<")
		.replaceAll("&gt;", ">")
		.replaceAll("&quot;", '"')
		.replaceAll("&apos;", "'");
}

function childLocations(xml, element) {
	const blocks =
		xml.match(new RegExp(`<${element}\\b[\\s\\S]*?<\\/${element}>`, "gi")) ??
		[];
	return blocks.flatMap((block) => {
		const location = block.match(/<loc\b[^>]*>([\s\S]*?)<\/loc>/i)?.[1];
		return location ? [decodeXml(location.trim())] : [];
	});
}

async function collectSitemapUrls(sitemapUrl, visited = new Set()) {
	const absoluteUrl = sitemapUrl.href;
	if (visited.has(absoluteUrl)) return [];
	visited.add(absoluteUrl);

	const response = await fetch(absoluteUrl, {
		headers: { "User-Agent": "nvcc-v.com SEO submission script" },
	});
	if (!response.ok) {
		throw new Error(
			`Could not read sitemap ${absoluteUrl}: HTTP ${response.status}`,
		);
	}
	const xml = await response.text();
	const children = childLocations(xml, "sitemap");
	if (children.length > 0) {
		const nested = await Promise.all(
			children.map((location) =>
				collectSitemapUrls(new URL(location, sitemapUrl), visited),
			),
		);
		return nested.flat();
	}
	return childLocations(xml, "url");
}

async function loadUrlsFromFile(file) {
	const content = await readFile(file, "utf8");
	return content
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"));
}

async function discoverKey() {
	if (process.env.INDEXNOW_KEY) return process.env.INDEXNOW_KEY.trim();
	if (process.env.INDEXNOW_KEY_FILE) {
		return (await readFile(process.env.INDEXNOW_KEY_FILE, "utf8")).trim();
	}

	const publicDirectory = path.resolve("public");
	const candidates = [];
	for (const entry of await readdir(publicDirectory, { withFileTypes: true })) {
		if (!entry.isFile() || !entry.name.endsWith(".txt")) continue;
		const key = entry.name.slice(0, -4);
		if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) continue;
		const content = (
			await readFile(path.join(publicDirectory, entry.name), "utf8")
		).trim();
		if (content === key) candidates.push(key);
	}
	if (candidates.length !== 1) {
		throw new Error(
			`Expected one IndexNow key file in public/, found ${candidates.length}. Set INDEXNOW_KEY_FILE explicitly.`,
		);
	}
	return candidates[0];
}

function normalizeUrls(values, site) {
	const urls = new Set();
	for (const value of values) {
		const url = new URL(value, site);
		url.hash = "";
		if (url.origin !== site.origin) {
			throw new Error(`URL is outside ${site.origin}: ${url.href}`);
		}
		if (url.protocol !== "https:")
			throw new Error(`Only HTTPS URLs are allowed: ${url.href}`);
		urls.add(url.href);
	}
	return [...urls].sort();
}

async function verifyKey(site, key) {
	const keyLocation = new URL(`${key}.txt`, site);
	const response = await fetch(keyLocation, { cache: "no-store" });
	if (!response.ok) {
		throw new Error(
			`IndexNow key is not live at ${keyLocation.href}: HTTP ${response.status}`,
		);
	}
	if ((await response.text()).trim() !== key) {
		throw new Error(
			`IndexNow key file content does not match ${keyLocation.href}`,
		);
	}
	return keyLocation;
}

async function main() {
	const options = parseArguments(process.argv.slice(2));
	if (
		!options.sitemap &&
		options.files.length === 0 &&
		options.urls.length === 0
	) {
		usage();
		throw new Error("Provide at least one URL, --file, or --sitemap");
	}

	const site = new URL(process.env.SITE_URL ?? DEFAULT_SITE);
	const values = [...options.urls];
	for (const file of options.files)
		values.push(...(await loadUrlsFromFile(file)));
	if (options.sitemap) {
		values.push(...(await collectSitemapUrls(new URL(options.sitemap, site))));
	}

	const urls = normalizeUrls(values, site);
	if (urls.length === 0) throw new Error("No URLs were found to submit");
	const key = await discoverKey();
	if (!/^[A-Za-z0-9-]{8,128}$/.test(key))
		throw new Error("The IndexNow key format is invalid");

	console.log(
		`Prepared ${urls.length} URL(s) for IndexNow on ${site.hostname}.`,
	);
	if (options.dryRun) {
		for (const url of urls.slice(0, 20)) console.log(`  ${url}`);
		if (urls.length > 20) console.log(`  ... and ${urls.length - 20} more`);
		return;
	}

	const keyLocation = await verifyKey(site, key);
	const endpoint = process.env.INDEXNOW_ENDPOINT ?? DEFAULT_ENDPOINT;
	for (let offset = 0; offset < urls.length; offset += MAX_URLS_PER_REQUEST) {
		const urlList = urls.slice(offset, offset + MAX_URLS_PER_REQUEST);
		const response = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json; charset=utf-8" },
			body: JSON.stringify({
				host: site.hostname,
				key,
				keyLocation: keyLocation.href,
				urlList,
			}),
		});
		if (response.status !== 200 && response.status !== 202) {
			const detail = (await response.text()).trim();
			throw new Error(
				`IndexNow rejected URLs ${offset + 1}-${offset + urlList.length}: HTTP ${response.status}${detail ? ` ${detail}` : ""}`,
			);
		}
		console.log(
			`IndexNow accepted URLs ${offset + 1}-${offset + urlList.length}: HTTP ${response.status}.`,
		);
	}
}

main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
