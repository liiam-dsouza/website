import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import lottie from "astro-integration-lottie"
import catppuccin from "@catppuccin/starlight";


import icon from "astro-icon";

import mdx from "@astrojs/mdx";

import sitemap from "@astrojs/sitemap";

import expressiveCode from "astro-expressive-code";

export default defineConfig({
    vite: {
        plugins: [
            tailwindcss()
        ],
    },
    markdown: {
        shikiConfig: {
            theme: 'snazzy-light',
        },
    },

    integrations: [
        icon(),
        expressiveCode(),
        mdx(),
        lottie(),
        sitemap(),
    ],
    site: "https://liamdsouza.com",
})
