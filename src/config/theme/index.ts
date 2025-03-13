import { lightThemeColors, darkThemeColors } from "./colors"
import { typography } from "./typography"
import { spacing } from "./spacing"
import { designTokens } from "./designTokens"
import { Theme as NavigationTheme } from "@react-navigation/native"

interface CustomTheme extends NavigationTheme {
    colors: NavigationTheme["colors"] & {
        secondary: string
        error: string
        success: string
        warning: string
        searchbar: string
        secondaryText: string
        tabbarIcon_active: string
        tabbarIcon_inactive: string
        shadow: string
    }
}
export const lightTheme: CustomTheme = {
    dark: false,
    colors: {
        ...lightThemeColors,
        secondary: lightThemeColors.secondary,
        error: lightThemeColors.error,
        success: lightThemeColors.success,
        warning: lightThemeColors.warning,
        searchbar: lightThemeColors.searchbar,
        secondaryText: lightThemeColors.secondaryText,
        tabbarIcon_active: lightThemeColors.tabbarIcon_active,
        tabbarIcon_inactive: lightThemeColors.tabbarIcon_inactive,
        shadow: lightThemeColors.shadow,
    },
    fonts: { ...typography.fonts },
    ...designTokens,
}

export const darkTheme: CustomTheme = {
    dark: true,
    colors: {
        ...darkThemeColors,
        secondary: darkThemeColors.secondary,
        error: darkThemeColors.error,
        success: darkThemeColors.success,
        warning: darkThemeColors.warning,
        searchbar: darkThemeColors.searchbar,
        secondaryText: darkThemeColors.secondaryText,
        tabbarIcon_active: darkThemeColors.tabbarIcon_active,
        tabbarIcon_inactive: darkThemeColors.tabbarIcon_inactive,
        shadow: darkThemeColors.shadow,
    },
    fonts: { ...typography.fonts },
    ...designTokens,
}

export { typography, spacing, designTokens }

