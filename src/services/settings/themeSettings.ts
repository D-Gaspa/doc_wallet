import AsyncStorage from "@react-native-async-storage/async-storage"

const THEME_KEY = "theme"

export const themeSettings = {
    getTheme: async () => {
        try {
            const storedTheme = await AsyncStorage.getItem(THEME_KEY)
            return storedTheme === "dark" || storedTheme === "light"
                ? storedTheme
                : null
        } catch (error) {
            console.error("Error getting theme from AsyncStorage", error)
            return null
        }
    },

    saveTheme: async (theme: "light" | "dark") => {
        try {
            await AsyncStorage.setItem(THEME_KEY, theme)
        } catch (error) {
            console.error("Error saving theme to AsyncStorage", error)
        }
    },
}
