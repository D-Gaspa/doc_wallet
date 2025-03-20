export const generateUniqueId = (): string => {
    // Create a timestamp-based string with a random component
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    )
}
