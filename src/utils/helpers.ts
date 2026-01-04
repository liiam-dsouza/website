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

export const sortTags = (tags: string[]) => {
    return tags.sort((a, b) => {
        const textA = a.slice(a.indexOf(" ") + 1)
        const textB = b.slice(b.indexOf(" ") + 1)
        return textA.localeCompare(textB)
    })
}

export const getTagId = (tag: string): string => {
    return tag.slice(tag.indexOf(" ") + 1)
}

export const formatTags = (tags: string[] | string): string[] => {
    function processTag(tag: string): string {
        const spaceIndex = tag.indexOf(" ")
        if (spaceIndex === -1) return tag.toUpperCase()
        const emoji = tag.slice(0, spaceIndex)
        const text = tag.slice(spaceIndex + 1).toUpperCase()
        return `${emoji} ${text}`
    }

    if (Array.isArray(tags)) {
        return tags.map(tag => {
            return processTag(tag)
        })
    } else {
        return [processTag(tags)]
    }
}

export const slugify = (input: string): string => {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // remove non-word characters
        .replace(/\s+/g, "-")     // spaces → dashes
        .replace(/-+/g, "-")      // collapse multiple dashes
}

