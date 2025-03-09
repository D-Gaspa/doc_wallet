import { lightThemeColors, darkThemeColors } from "./colors"
import { typography } from "./typography"
import { spacing } from "./spacing"
import { designTokens } from "./designTokens"
import { Theme as NavigationTheme } from "@react-navigation/native"

export const lightTheme: NavigationTheme = {
    dark: false,
    colors: { ...lightThemeColors },
    fonts: { ...typography.fonts },
    ...designTokens,
}

export const darkTheme: NavigationTheme = {
    dark: true,
    colors: { ...darkThemeColors },
    fonts: { ...typography.fonts },
    ...designTokens,
}

export { typography, spacing, designTokens }
