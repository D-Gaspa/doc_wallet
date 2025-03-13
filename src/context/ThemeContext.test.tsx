import React from "react"
import { render, act, fireEvent } from "@testing-library/react-native"
import { ThemeProvider, useThemeContext } from "./ThemeContext.tsx"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Appearance, Text, Button } from "react-native"
import { waitFor } from "@testing-library/react-native"

jest.mock("@react-native-async-storage/async-storage", () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
}))

jest.mock("react-native/Libraries/Utilities/Appearance", () => ({
    getColorScheme: jest.fn(() => "light"), // Mock system theme as "light"
    addChangeListener: jest.fn(() => ({ remove: jest.fn() })), // Mock event listener
}))

const TestComponent = () => {
    const { themeType, toggleTheme } = useThemeContext()
    return (
        <>
            <Text testID="themeType">{themeType}</Text>
            <Button
                testID="toggleButton"
                onPress={toggleTheme}
                title="Toggle Theme"
            />
        </>
    )
}

describe("ThemeContext", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("loads stored theme on startup", async () => {
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue("dark")

        const { getByTestId } = render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        )
        await act(async () => {}) // Ensures re-render after state update

        await act(async () => {}) // Ensures `useEffect` has completed before checking state

        expect(getByTestId("themeType").props.children).toBe("dark")
    })

    it("defaults to system theme if no stored theme exists", async () => {
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
        ;(Appearance.getColorScheme as jest.Mock).mockReturnValue("dark")

        const { getByTestId } = render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        )
        await act(async () => {}) // Ensures re-render after state update
        // Ensures state is updated

        expect(getByTestId("themeType").props.children).toBe("dark")
    })

    it("toggles between light and dark themes", async () => {
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue("light")

        const { getByTestId } = render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        )
        await act(async () => {}) // Ensures re-render after state update

        const themeText = getByTestId("themeType")
        const toggleButton = getByTestId("toggleButton")

        expect(themeText.props.children).toBe("light")

        await act(async () => {
            fireEvent.press(toggleButton)
        })

        await act(async () => {}) // Ensures re-render after state update

        expect(themeText.props.children).toBe("dark")
        expect(AsyncStorage.setItem).toHaveBeenCalledWith("theme", "dark")
    })

    it("toggleTheme correctly stores the selected theme in AsyncStorage", async () => {
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue("light") // Mock stored theme as light

        const TestComponent = () => {
            const { themeType, toggleTheme } = useThemeContext()
            return (
                <>
                    <Text testID="themeType">{themeType}</Text>
                    <Button
                        testID="toggleButton"
                        onPress={toggleTheme}
                        title="Toggle Theme"
                    />
                </>
            )
        }

        const { getByTestId } = render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        )

        const themeText = getByTestId("themeType")
        const toggleButton = getByTestId("toggleButton")

        expect(themeText.props.children).toBe("light") // Ensure initial state

        await act(async () => {
            fireEvent.press(toggleButton)
        })

        // ✅ Use `waitFor()` with `findByTestId()` for better reliability
        const updatedThemeText = await waitFor(() => getByTestId("themeType"), {
            timeout: 2000,
        })
        expect(updatedThemeText.props.children).toBe("dark")

        expect(AsyncStorage.setItem).toHaveBeenCalledWith("theme", "dark") // Ensure AsyncStorage was updated

        // Toggle back to light
        await act(async () => {
            fireEvent.press(toggleButton)
        })

        const revertedThemeText = await waitFor(
            () => getByTestId("themeType"),
            { timeout: 2000 }
        )
        expect(revertedThemeText.props.children).toBe("light")

        expect(AsyncStorage.setItem).toHaveBeenCalledWith("theme", "light") // Ensure AsyncStorage updated again
    })
})
