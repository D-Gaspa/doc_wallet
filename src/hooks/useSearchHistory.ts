import { useState, useEffect, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const STORAGE_KEY = "@app:search_history"
const MAX_HISTORY = 10

export function useSearchHistory() {
    const [history, setHistory] = useState<string[]>([])
    const isMountedRef = useRef(true)
    const isLoadingRef = useRef(false)

    // Track component mounted state
    useEffect(() => {
        isMountedRef.current = true

        // Load history on mount
        loadHistory()

        return () => {
            isMountedRef.current = false
        }
    }, [])

    // Safe function to load history from storage
    const loadHistory = async () => {
        // Prevent concurrent loads
        if (isLoadingRef.current) return
        isLoadingRef.current = true

        try {
            const json = await AsyncStorage.getItem(STORAGE_KEY)

            // Only update state if component is still mounted
            if (isMountedRef.current && json) {
                try {
                    const parsed = JSON.parse(json)
                    // Ensure we have a valid array
                    if (Array.isArray(parsed)) {
                        setHistory(parsed.filter(Boolean))
                    }
                } catch (parseError) {
                    console.error("Failed to parse search history:", parseError)
                    // If parse fails, reset history
                    await AsyncStorage.removeItem(STORAGE_KEY)
                    if (isMountedRef.current) {
                        setHistory([])
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load search history:", error)
        } finally {
            isLoadingRef.current = false
        }
    }

    // Add a query to history
    const addToHistory = async (query: string) => {
        if (!isMountedRef.current) return

        try {
            const trimmed = (query || "").trim()
            if (!trimmed) return

            // Ensure we don't add duplicates and limit size
            const updatedHistory = [
                trimmed,
                ...history.filter((item) => item !== trimmed),
            ].slice(0, MAX_HISTORY)

            // Only update state if component is still mounted
            if (isMountedRef.current) {
                setHistory(updatedHistory)
            }

            // Save to storage
            await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(updatedHistory),
            )
        } catch (error) {
            console.error("Failed to add to search history:", error)
        }
    }

    // Clear history
    const clearHistory = async () => {
        if (!isMountedRef.current) return

        try {
            if (isMountedRef.current) {
                setHistory([])
            }
            await AsyncStorage.removeItem(STORAGE_KEY)
        } catch (error) {
            console.error("Failed to clear search history:", error)
        }
    }

    return {
        history,
        addToHistory,
        clearHistory,
    }
}
