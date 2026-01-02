import { defineEcConfig } from "astro-expressive-code"
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers"

export default defineEcConfig({
    plugins: [pluginLineNumbers()],
    themes: ["snazzy-light"],
    frames: {
        showCopyToClipboardButton: true,
    },
    styleOverrides: {
        frames: {
            frameBoxShadowCssValue: "none",
            editorActiveTabIndicatorTopColor: "#0000FF",
        },
    },
})
