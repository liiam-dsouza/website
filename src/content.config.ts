import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

import { eventsJson } from "@content/events"
import { experienceJson } from "@content/experience"


const posts = defineCollection({
    loader: glob({
        pattern: "**/*.{md,mdx}",
        base: "./src/content/posts",
    }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        type: z.string(),
        kind: z.array(z.string()).optional().default([]),
        tags: z.array(z.string()).optional().default([]),
        date: z.date(),
        draft: z.boolean().optional().default(false),
    }),
})

const experience = defineCollection({
    loader: async () => {
        return experienceJson.map((experience) => ({
            id: experience.role.toLowerCase().replace(/\s+/g, '-'),
            role: experience.role,
            company: experience.company,
            description: experience.description,
            skills: experience.skills,
            startDate: experience.startDate,
            endDate: experience.endDate,
        }))
    },
    schema: z.object({
        role: z.string(),
        company: z.string(),
        description: z.string(),
        startDate: z.date(),
        endDate: z.date().nullable(),
        skills: z.array(z.string()),
    }),
})

const events = defineCollection({
    loader: async () => {
        return eventsJson.map((event) => ({
            id: `${ event.title + event.role }`.toLowerCase().replace(/\s+/g, '-'),
            cover: event.cover,
            coverAlt: event.coverAlt,
            title: event.title,
            role: event.role,
            type: event.type,
            date: event.date,
            description: event.description,
        }))
    },
    schema: z.object({
        cover: z.string(),
        coverAlt: z.string(),
        title: z.string(),
        role: z.string(),
        type: z.string(),
        date: z.date(),
        description: z.string(),
    }),
})

const projects = defineCollection({
    loader: glob({
        pattern: "**/*.{md,mdx}",
        base: "./src/content/projects",
    }),
    schema: z.object({
        cover: z.string().optional().default(""),
        coverAlt: z.string().optional().default("Project cover image"),
        title: z.string(),
        status: z.enum(["In Development", "Completed"]),
        featured: z.boolean(),
        description: z.string(),
        startDate: z.date(),
        endDate: z.date().nullable(),
        tags: z.array(z.string()),
        category: z.string(),
        link: z.string().url(),
    }),
})

const resources = defineCollection({
    loader: glob({
        pattern: "**/*.{md,mdx}",
        base: "./src/content/resources",
    }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        link: z.string().url(),
        tags: z.array(z.string()),
    }),
})

export const collections = { posts, experience, events, projects, resources }
