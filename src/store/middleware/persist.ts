import AsyncStorage from "@react-native-async-storage/async-storage"
import { createJSONStorage } from "zustand/middleware"

export const asyncStorageMiddleware = createJSONStorage(() => ({
    getItem: async (name) => {
        try {
            const value = await AsyncStorage.getItem(name)
            return value ?? null
        } catch (error) {
            console.error(
                `AsyncStorage getItem failed for key "${name}":`,
                error,
            )
            return null
        }
    },
    setItem: async (name, value) => {
        try {
            await AsyncStorage.setItem(name, value)
        } catch (error) {
            console.error(
                `AsyncStorage setItem failed for key "${name}":`,
                error,
            )
        }
    },
    removeItem: async (name) => {
        try {
            await AsyncStorage.removeItem(name)
        } catch (error) {
            console.error(
                `AsyncStorage removeItem failed for key "${name}":`,
                error,
            )
        }
    },
}))
