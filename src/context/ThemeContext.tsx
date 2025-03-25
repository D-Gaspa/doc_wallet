import React, { createContext, useContext, useEffect, useState } from "react"
import { Appearance } from "react-native"
import { darkTheme, lightTheme } from "../config/theme"
import { LoggingService } from "../services/monitoring/loggingService"
import { themeSettings } from "../services/settings/themeSettings.ts"

const logger = LoggingService.getLogger("ThemeContext")

type ThemeType = "light" | "dark"

interface ThemeContextProps {
    theme: typeof lightTheme
    colors: typeof lightTheme.colors
    themeType: ThemeType
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [themeType, setThemeType] = useState<ThemeType>("light")

    useEffect(() => {
        let isMounted = true

        const loadTheme = async () => {
            try {
                const storedTheme = await themeSettings.getTheme()
                if (isMounted) {
                    logger.info(`Loaded stored theme: ${storedTheme}`)
                    if (storedTheme === "dark" || storedTheme === "light") {
                        setThemeType(storedTheme as ThemeType)
                    } else {
                        const systemTheme = Appearance.getColorScheme()
                        logger.info(
                            `No stored theme found, using system theme: ${systemTheme}`,
                        )
                        setThemeType(systemTheme === "dark" ? "dark" : "light")
                    }
                }
            } catch (error) {
                logger.error("Failed to load theme", error)
            }
        }

        loadTheme().then((r) => r)

        return () => {
            isMounted = false // Prevent state updates after unmount
        }
    }, [])

    const toggleTheme = async () => {
        try {
            const newTheme = themeType === "light" ? "dark" : "light"
            await themeSettings.saveTheme(newTheme)
            setThemeType(newTheme)
            logger.info(`Theme switched to ${newTheme}`)
        } catch (error) {
            logger.error("Error toggling theme", error)
        }
    }

    return (
        <ThemeContext.Provider
            value={{
                theme: themeType === "dark" ? darkTheme : lightTheme,
                colors:
                    themeType === "dark" ? darkTheme.colors : lightTheme.colors,
                themeType,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    )
}

export const useThemeContext = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error("useThemeContext must be used within a ThemeProvider")
    }
    return context
}
