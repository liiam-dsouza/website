import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

import tagsJson from "./content/tags.json"
import experienceJson from "./content/experience.json"

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

const tags = defineCollection({
    loader: async () => {
        return tagsJson.map((tag) => ({
            id: tag.name.toLowerCase().replace(/\s+/g, '-'),
            name: tag.name,
            emoji: tag.emoji,
        }))
    },
    schema: z.object({
        name: z.string(),
        emoji: z.string(),
    }),
})

const experience = defineCollection({
    loader: async () => {
        return experienceJson.map((experience) => ({
            id: experience.role.toLowerCase().replace(/\s+/g, '-'),
            role: experience.role,
            company: experience.company,
            startDate: experience.startDate,
            endDate: experience.endDate,
            description: experience.description,
            skills: experience.skills,
        }))
    },
    schema: z.object({
        role: z.string(),
        company: z.string(),
        startDate: z.string(),
        endDate: z.string().nullable(),
        description: z.string(),
        skills: z.array(z.string()),
    }),
})

const projects = defineCollection({
    loader: glob({
        pattern: "**/*.{md,mdx}",
        base: "./src/content/projects",
    }),
    schema: ({ image }) => z.object({
        cover: image().optional(),
        coverAlt: z.string().optional(),
        title: z.string(),
        status: z.enum(["In Development", "Completed"]),
        description: z.string().optional(),
        link: z.string().url().optional(),
        technologies: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
        year: z.number()
    }),
})

export const collections = { posts, tags, experience, projects }
