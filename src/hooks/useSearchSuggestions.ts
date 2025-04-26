import { useState, useEffect, useRef } from "react"
import { useFolderStore } from "../store/useFolderStore"
import { useDocStore } from "../store"

const MAX_SUGGESTIONS = 8

export function useSearchSuggestions(query: string, history: string[] = []) {
    const [suggestions, setSuggestions] = useState<string[]>([])
    const isMountedRef = useRef(true)

    const folders = useFolderStore((s) => s.folders)
    const documents = useDocStore((s) => s.documents)

    // Track component mounted state
    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
        }
    }, [])

    // Update suggestions based on query, history, and available items
    useEffect(() => {
        if (!isMountedRef.current) return

        try {
            const q = (query || "").trim().toLowerCase()
            let newSuggestions: string[]

            // Get all possible items
            const savedItems = [
                ...folders.map((f) => f.title || ""),
                ...documents.map((d) => d.title || ""),
            ].filter(Boolean)

            if (!q) {
                // If query is empty, show recent history
                newSuggestions = history.slice(0, 5)
            } else {
                // Filter history matches
                const histMatches = history.filter(
                    (h) => h && h.toLowerCase().includes(q),
                )

                // Filter saved items, excluding duplicates from history
                const savedMatches = savedItems.filter(
                    (item) =>
                        item &&
                        item.toLowerCase().includes(q) &&
                        !histMatches.includes(item),
                )

                // Combine and limit results
                newSuggestions = [...histMatches, ...savedMatches].slice(
                    0,
                    MAX_SUGGESTIONS,
                )
            }

            if (isMountedRef.current) {
                setSuggestions(newSuggestions)
            }
        } catch (error) {
            console.error("Error generating suggestions:", error)
            if (isMountedRef.current) {
                setSuggestions([])
            }
        }
    }, [query, history, folders, documents])

    return suggestions
}
