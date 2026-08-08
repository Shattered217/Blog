import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl, getTagUrl } from "@utils/url-utils.ts";

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
		sorted[i].data.nextPublished = sorted[i - 1].data.published;
		sorted[i].data.nextPermalink = sorted[i - 1].data.permalink;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
		sorted[i].data.prevPublished = sorted[i + 1].data.published;
		sorted[i].data.prevPermalink = sorted[i + 1].data.permalink;
	}

	return sorted;
}

export function getRelatedPosts(
	current: CollectionEntry<"posts">,
	posts: CollectionEntry<"posts">[],
	limit = 3,
) {
	const tags = new Set(current.data.tags.map((tag) => tag.toLowerCase()));
	const category = current.data.category?.toLowerCase();
	const seriesSlug = current.data.series?.slug;

	return posts
		.filter((post) => post.id !== current.id)
		.map((post) => {
			const sharedTags = post.data.tags.filter((tag) =>
				tags.has(tag.toLowerCase()),
			).length;
			const sameCategory = Boolean(
				category && post.data.category?.toLowerCase() === category,
			);
			const sameSeries = Boolean(
				seriesSlug && post.data.series?.slug === seriesSlug,
			);
			return {
				post,
				score:
					sharedTags * 4 + Number(sameCategory) * 2 + Number(sameSeries) * 6,
			};
		})
		.filter(({ score }) => score > 0)
		.sort(
			(a, b) =>
				b.score - a.score ||
				b.post.data.published.getTime() - a.post.data.published.getTime(),
		)
		.slice(0, limit)
		.map(({ post }) => post);
}

export function getSeriesPosts(
	current: CollectionEntry<"posts">,
	posts: CollectionEntry<"posts">[],
) {
	const seriesSlug = current.data.series?.slug;
	if (!seriesSlug) return [];
	return posts
		.filter((post) => post.data.series?.slug === seriesSlug)
		.sort((a, b) => (a.data.series?.order ?? 0) - (b.data.series?.order ?? 0));
}

export type SeriesGroup = {
	slug: string;
	name: string;
	posts: CollectionEntry<"posts">[];
};

export function getSeriesGroups(
	posts: CollectionEntry<"posts">[],
): SeriesGroup[] {
	const groups = new Map<string, SeriesGroup>();
	for (const post of posts) {
		const series = post.data.series;
		if (!series) continue;
		const group = groups.get(series.slug) ?? {
			slug: series.slug,
			name: series.name,
			posts: [],
		};
		group.posts.push(post);
		groups.set(series.slug, group);
	}
	return Array.from(groups.values()).map((group) => ({
		...group,
		posts: group.posts.sort(
			(a, b) => (a.data.series?.order ?? 0) - (b.data.series?.order ?? 0),
		),
	}));
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
	url: string;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const countMap: { [key: string]: number } = {};
	const permalinkMap: { [key: string]: string } = {};
	allBlogPosts.forEach((post) => {
		post.data.tags.forEach((tag: string, index: number) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
			permalinkMap[tag] ||= post.data.tagPermalinks[index] || "";
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({
		name: key,
		count: countMap[key],
		url: getTagUrl(key, permalinkMap[key]),
	}));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	const count: { [key: string]: number } = {};
	const permalinkMap: { [key: string]: string } = {};
	allBlogPosts.forEach((post) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
		permalinkMap[categoryName] ||= post.data.categoryPermalink;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c, permalinkMap[c]),
		});
	}
	return ret;
}
