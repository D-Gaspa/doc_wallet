import { lightThemeColors, darkThemeColors } from "./colors"
import { typography } from "./typography"
import { spacing } from "./spacing"
import { designTokens } from "./designTokens"

const lightTheme = {
    colors: lightThemeColors,
    typography,
    spacing,
    ...designTokens,
}

const darkTheme = {
    colors: darkThemeColors,
    typography,
    spacing,
    ...designTokens,
}

export { lightTheme, darkTheme, typography, spacing, designTokens }
