import AsyncStorage from "@react-native-async-storage/async-storage"
import { themeSettings } from "../../../services/settings/themeSettings.ts"

jest.mock("@react-native-async-storage/async-storage", () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
}))

describe("themeSettings", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, "error").mockImplementation(() => {})
    })

    it("should save the theme to AsyncStorage", async () => {
        await themeSettings.saveTheme("dark")
        expect(AsyncStorage.setItem).toHaveBeenCalledWith("theme", "dark")
    })

    it("should retrieve the theme from AsyncStorage if valid", async () => {
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue("light")
        const theme = await themeSettings.getTheme()
        expect(theme).toBe("light")
    })

    it("should return null if the stored theme is invalid", async () => {
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue("invalid-theme")
        const theme = await themeSettings.getTheme()
        expect(theme).toBeNull()
    })

    it("should return null if AsyncStorage.getItem throws an error", async () => {
        ;(AsyncStorage.getItem as jest.Mock).mockRejectedValue(
            new Error("AsyncStorage error"),
        )
        const theme = await themeSettings.getTheme()
        expect(theme).toBeNull()
    })

    it("should handle errors when saving theme", async () => {
        ;(AsyncStorage.setItem as jest.Mock).mockRejectedValue(
            new Error("AsyncStorage error"),
        )
        await expect(themeSettings.saveTheme("dark")).resolves.toBeUndefined()
        expect(AsyncStorage.setItem).toHaveBeenCalledWith("theme", "dark")
    })
})
