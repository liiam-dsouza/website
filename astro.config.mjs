import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import lottie from "astro-integration-lottie"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import icon from "astro-icon"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import expressiveCode from "astro-expressive-code"

import react from "@astrojs/react";

export default defineConfig({
    vite: {
        plugins: [
            tailwindcss()
        ],
    },

    integrations: [icon(), expressiveCode(), mdx({
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
    }), lottie(), sitemap(), react()],
    site: "https://liamdsouza.com",
})