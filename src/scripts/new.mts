#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { execSync } from "node:child_process"

import { kebabToTitleCase } from "@utils/templateHelpers.ts"

type ContentType = "post" | "project"

interface ConfigEntry {
    dir: string
    template: string
}

const CONFIG: Record<ContentType, ConfigEntry> = {
    post: {
        dir: "src/content/posts",
        template: "src/templates/post.mdx",
    },
    project: {
        dir: "src/content/projects",
        template: "src/templates/project.mdx",
    },
}

const [, , typeArg, slug] = process.argv

if (!typeArg || !slug) {
    console.error("❌ Usage: pnpm new <type> <slug>")
    process.exit(1)
}

if (!(typeArg in CONFIG)) {
    console.error(
        `❌ Unknown type "${typeArg}". Valid types: ${Object.keys(CONFIG).join(", ")}`
    )
    process.exit(1)
}

const type = typeArg as ContentType
const { dir, template } = CONFIG[type]

const filename = `${slug}.mdx`
const filepath = path.join(dir, filename)

if (!fs.existsSync(template)) {
    console.error(`❌ Template not found: ${template}`)
    process.exit(1)
}

if (fs.existsSync(filepath)) {
    console.error(`❌ ${type} already exists: ${filename}`)
    process.exit(1)
}

const rawTemplate = fs.readFileSync(template, "utf8")

const title = kebabToTitleCase(slug)
const date = new Date().toISOString().split("T")[0]

const output = rawTemplate
    .replace(/{{ title }}/g, title)
    .replace(/{{ date }}/g, date)

fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(filepath, output)

console.log("✅ Done!")
console.log("Using template:", template)
console.log("Writing to:", filepath)

setTimeout(() => {
    execSync(`code ${filepath}`, { stdio: "inherit" })
}, 1500)
