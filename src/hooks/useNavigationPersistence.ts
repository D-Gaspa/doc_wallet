// src/hooks/useNavigationPersistence.ts
import { useEffect, useState } from "react"
import { Linking, Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { NAVIGATION_STATE_KEY } from "../navigation/persistence.ts"
import { LoggingService } from "../services/monitoring/loggingService"

const logger = LoggingService.getLogger("NavigationPersistence")

/**
 * Hook to handle navigation state persistence
 * This allows the app to restore the user's last navigation state after a reload
 */
export function useNavigationPersistence() {
    const [isReady, setIsReady] = useState(Platform.OS === "web") // Web uses URL-based routing
    const [initialState, setInitialState] = useState(undefined)

    useEffect(() => {
        const restoreState = async () => {
            try {
                logger.debug("Attempting to restore navigation state")
                // Check if we have a deep link first
                const initialUrl = await Linking.getInitialURL()

                if (initialUrl) {
                    logger.debug(
                        "Deep link detected, skipping state restoration",
                        { initialUrl },
                    )
                }

                // Only restore if there's no deep link
                if (Platform.OS !== "web" && initialUrl == null) {
                    const savedState =
                        await AsyncStorage.getItem(NAVIGATION_STATE_KEY)

                    if (savedState) {
                        logger.debug("Navigation state restored from storage")
                        setInitialState(JSON.parse(savedState))
                    } else {
                        logger.debug("No saved navigation state found")
                    }
                }
            } catch (error) {
                logger.warn("Failed to restore navigation state:", error)
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
                JSON.stringify(state),
            ).catch((error) => {
                logger.warn("Failed to save navigation state:", error)
            })
        }
    }

    return {
        isReady,
        initialState,
        onStateChange,
    }
}
