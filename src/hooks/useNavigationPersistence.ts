import { useEffect, useState } from "react"
import { Linking, Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { NAVIGATION_STATE_KEY } from "../navigation/persistence.ts"

/**
 * Hook to handle navigation state persistence
 * This allows the app to restore the user's last navigation state after a reload
 * (Should probably be moved to hooks folder)
 */
export function useNavigationPersistence() {
    const [isReady, setIsReady] = useState(Platform.OS === "web") // Web uses URL-based routing
    const [initialState, setInitialState] = useState(undefined)

    useEffect(() => {
        const restoreState = async () => {
            try {
                // Check if we have a deep link first
                const initialUrl = await Linking.getInitialURL()

                // Only restore if there's no deep link
                if (Platform.OS !== "web" && initialUrl == null) {
                    const savedState = await AsyncStorage.getItem(
                        NAVIGATION_STATE_KEY
                    )

                    if (savedState) {
                        setInitialState(JSON.parse(savedState))
                    }
                }
            } catch (error) {
                console.warn("Failed to restore navigation state:", error)
            } finally {
                setIsReady(true)
            }
        }

        if (!isReady) {
            restoreState().then((r) => r)
        }
    }, [isReady])

    // Function to persist navigation state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onStateChange = (state: any) => {
        if (Platform.OS !== "web") {
            AsyncStorage.setItem(
                NAVIGATION_STATE_KEY,
                JSON.stringify(state)
            ).catch((error) => {
                console.warn("Failed to save navigation state:", error)
            })
        }
    }

    return {
        isReady,
        initialState,
        onStateChange,
    }
}
