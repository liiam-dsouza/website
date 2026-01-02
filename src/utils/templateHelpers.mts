const LOWERCASE_WORDS = new Set([
    "a", "an", "and", "as", "at", "but", "by", "for", "from",
    "in", "into", "nor", "of", "on", "or", "over", "per",
    "the", "to", "up", "via", "with",
])

const ACRONYMS = new Set([
    "api", "http", "https", "css", "html", "js", "ts",
    "json", "graphql", "sql", "ui", "ux", "cdn",
])

export function kebabToTitleCase(slug) {
    const parts = slug
        .toLowerCase()
        .replace(/[^a-z0-9:-]/g, "")
        .split(":")

    return parts.map((part, partIndex) => {
        const words = part.split("-").filter(Boolean)

        return words.map((word, wordIndex) => {
            if (ACRONYMS.has(word)) return word.toUpperCase()

            if (partIndex === 0 && wordIndex !== 0 && LOWERCASE_WORDS.has(word)) return word

            return word.charAt(0).toUpperCase() + word.slice(1)
        })
        .join(" ")
    })
    .join(": ")
}
