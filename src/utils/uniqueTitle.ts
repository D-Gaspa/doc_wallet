// utils/uniqueTitle.ts
export function generateUniqueTitle(
    baseTitle: string,
    existingTitles: string[],
): string {
    if (!existingTitles.includes(baseTitle)) return baseTitle

    let counter = 1
    let newTitle = `${baseTitle} (${counter})`

    while (existingTitles.includes(newTitle)) {
        counter++
        newTitle = `${baseTitle} (${counter})`
    }

    return newTitle
}
