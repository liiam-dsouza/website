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

export const formatDuration = (start: Date, end: Date) => {
    let months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) + 1

    const years = Math.floor(months / 12)
    months = months % 12

    const parts: string[] = []

    if (years > 0) parts.push(`${years} yr${years > 1 ? "s" : ""}`)
    if (months > 0) parts.push(`${months} mo${months > 1 ? "s" : ""}`)

    return parts.join(" ")
}

export const formatMonthYear = (date: Date) => {
    date.toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    })
}
