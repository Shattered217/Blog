import { defineCollection, z } from "astro:content";

const postsCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		tagPermalinks: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		categoryPermalink: z.string().optional().default(""),
		lang: z.string().optional().default(""),
		permalink: z.string().optional().default(""),
		series: z
			.object({
				slug: z.string(),
				name: z.string(),
				order: z.number().int().positive(),
			})
			.optional(),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		prevPublished: z.date().optional(),
		prevPermalink: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
		nextPublished: z.date().optional(),
		nextPermalink: z.string().default(""),
	}),
});
const specCollection = defineCollection({
	schema: z.object({}),
});
export const collections = {
	posts: postsCollection,
	spec: specCollection,
};
