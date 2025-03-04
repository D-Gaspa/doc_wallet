import AsyncStorage from "@react-native-async-storage/async-storage"

export const NAVIGATION_STATE_KEY = "DOCWALLET_NAVIGATION_STATE_V1"

export async function clearNavigationState() {
    try {
        await AsyncStorage.removeItem(NAVIGATION_STATE_KEY)
        return true
    } catch (error) {
        console.warn("Failed to clear navigation state:", error)
        return false
    }
}
