import AsyncStorage from "@react-native-async-storage/async-storage"
import { LoggingService } from "../services/monitoring/loggingService"

const logger = LoggingService.getLogger("NavigationPersistence")

export const NAVIGATION_STATE_KEY = "DOCWALLET_NAVIGATION_STATE_V1"

export async function clearNavigationState() {
    try {
        await AsyncStorage.removeItem(NAVIGATION_STATE_KEY)
        logger.info("Navigation state cleared successfully")
        return true
    } catch (error) {
        logger.warn("Failed to clear navigation state:", error)
        return false
    }
}
