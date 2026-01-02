#!/usr/bin/env node
import fs from "fs"
import path from "path"
import process from "process"

import { kebabToTitleCase } from "../utils/templateHelpers.mjs"
import { execSync } from "child_process"

const [, , type, slug] = process.argv

if (!type || !slug) {
    console.error("❌ Usage: pnpm new <type> <slug>")
    process.exit(1)
}

const CONFIG = {
    post: {
        dir: "src/content/posts",
        template: "src/templates/post.mdx",
    },
    project: {
        dir: "src/content/projects",
        template: "src/templates/project.mdx",
    },
}

if (!(type in CONFIG)) {
    console.error(
        `❌ Unknown type "${type}". Valid types: ${Object.keys(CONFIG).join(", ")}`
    )
    process.exit(1)
}

const { dir, template } = CONFIG[type as keyof typeof CONFIG]

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
    execSync(`code ${filepath}`)
}, 1500)

