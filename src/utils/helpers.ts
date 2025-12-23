export const withBase = (path: string) => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "")
    const cleanPath = path.replace(/^\/+/, "")
    return `${base}/${cleanPath}`
}

export const readingTime = (text: string | undefined) => {
    if (!text) return 0
    const wordsPerMinute = 200
    const words = text.trim().split(/\s+/).length
    const minutes = Math.ceil(words / wordsPerMinute)
    return minutes
}
