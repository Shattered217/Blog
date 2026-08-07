import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

export function pathsEqual(path1: string, path2: string) {
	const normalizedPath1 = path1.replace(/^\/|\/$/g, "").toLowerCase();
	const normalizedPath2 = path2.replace(/^\/|\/$/g, "").toLowerCase();
	return normalizedPath1 === normalizedPath2;
}

function joinUrl(...parts: string[]): string {
	const joined = parts.join("/");
	return joined.replace(/\/+/g, "/");
}

export function getPostUrl(
	slug: string,
	published: Date,
	permalink?: string,
): string {
	if (permalink?.trim()) {
		return url(`/${permalink.trim().replace(/^\/+|\/+$/g, "")}/`);
	}

	const year = published.getFullYear();
	const month = String(published.getMonth() + 1).padStart(2, "0");
	const day = String(published.getDate()).padStart(2, "0");
	return url(`/${year}/${month}/${day}/${slug}/`);
}

export function getTagUrl(tag: string, permalink?: string): string {
	if (!tag) return url("/archive/");
	if (permalink?.trim()) {
		return url(`/${permalink.trim().replace(/^\/+|\/+$/g, "")}/`);
	}
	return url(`/archive/?tag=${encodeURIComponent(tag.trim())}`);
}

export function getCategoryUrl(
	category: string | null,
	permalink?: string,
): string {
	if (
		!category ||
		category.trim() === "" ||
		category.trim().toLowerCase() === i18n(I18nKey.uncategorized).toLowerCase()
	)
		return url("/archive/?uncategorized=true");
	if (permalink?.trim()) {
		return url(`/${permalink.trim().replace(/^\/+|\/+$/g, "")}/`);
	}
	return url(`/archive/?category=${encodeURIComponent(category.trim())}`);
}

export function getDir(path: string): string {
	const lastSlashIndex = path.lastIndexOf("/");
	if (lastSlashIndex < 0) {
		return "/";
	}
	return path.substring(0, lastSlashIndex + 1);
}

export function url(path: string) {
	return joinUrl("", import.meta.env.BASE_URL, path);
}
