import { defineEcConfig } from "astro-expressive-code"
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers"
// import snazzyLight from "./themes/snazzyLight.json" assert { type: "json" }

export default defineEcConfig({
    plugins: [pluginLineNumbers()],
    themes: ["snazzy-light"],
    styleOverrides: {
        frames: {
            frameBoxShadowCssValue: "none",
            editorActiveTabIndicatorTopColor: "#0000FF",
        },
    },
})
