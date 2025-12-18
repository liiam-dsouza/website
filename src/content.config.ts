import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

const posts = defineCollection({
    loader: glob({
        pattern: "**/*.{md,mdx}",
        base: "./src/content/posts",
    }),
    schema: ({ image }) => z.object({
        cover: image().optional(),
        coverAlt: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        date: z.date(),
        tags: z.array(z.string()).optional(),
    }),
})

export const collections = { posts }
