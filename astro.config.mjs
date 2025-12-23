import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import lottie from "astro-integration-lottie"

import icon from "astro-icon";

import mdx from "@astrojs/mdx";

import sitemap from "@astrojs/sitemap";

export default defineConfig({
  vite: {
      plugins: [
          tailwindcss()
      ],
  },

  integrations: [icon(), mdx(), lottie(), sitemap() ],
  site: "https://liamdsouza.com",
})
