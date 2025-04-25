import React, { ReactNode } from "react"
import {
    Pressable,
    Text,
    StyleSheet,
    ActivityIndicator,
    View, // ---> Import View
    ViewStyle,
    TextStyle, // ---> Import TextStyle
} from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts" // Adjust path if needed

// Define Button variants
type ButtonVariant = "primary" | "outline" | "text"

export interface ButtonProps {
    title?: string // Optional title
    onPress: () => void
    loading?: boolean
    disabled?: boolean
    style?: ViewStyle // Style for the Pressable container
    textStyle?: TextStyle // ---> Style specifically for the Text component
    testID?: string
    children?: ReactNode // Allow children override
    variant?: ButtonVariant // ---> Added variant prop
    leftIcon?: ReactNode // ---> Icon on the left
    rightIcon?: ReactNode // ---> Icon on the right
}

export function Button({
    title,
    onPress,
    loading = false,
    disabled = false,
    style,
    textStyle, // Destructure textStyle
    testID,
    children,
    variant = "primary", // Default to 'primary'
    leftIcon, // Destructure leftIcon
    rightIcon, // Destructure rightIcon
}: ButtonProps) {
    const { colors } = useTheme()
    const isDisabled = disabled || loading

    // Determine styles based on variant
    const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
        switch (variant) {
            case "outline":
                return {
                    container: {
                        backgroundColor: "transparent",
                        borderColor: isDisabled
                            ? colors.secondaryText + "80"
                            : colors.primary,
                        borderWidth: 1.5, // Slightly thicker border for outline
                    },
                    text: {
                        color: isDisabled
                            ? colors.secondaryText + "80"
                            : colors.primary,
                    },
                }
            case "text":
                return {
                    container: {
                        backgroundColor: "transparent",
                        elevation: 0, // No shadow for text buttons
                        shadowOpacity: 0,
                    },
                    text: {
                        color: isDisabled
                            ? colors.secondaryText + "80"
                            : colors.primary,
                        fontWeight: "500", // Medium weight for text buttons
                    },
                }
            case "primary":
            default:
                return {
                    container: {
                        backgroundColor: colors.primary,
                        shadowColor: colors.shadow, // Keep shadow for primary
                        elevation: 3, // Reduced elevation slightly
                    },
                    text: {
                        color: colors.tabbarIcon_active, // White text on primary bg
                    },
                }
        }
    }

    const variantStyles = getVariantStyles()
    const loaderColor =
        variant === "primary" ? colors.tabbarIcon_active : colors.primary

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.buttonBase, // Base layout styles
                variantStyles.container, // Apply variant container styles
                isDisabled
                    ? styles.disabledState
                    : pressed
                    ? styles.pressedState
                    : {}, // Opacity states
                style, // Apply external container styles last
            ]}
            android_ripple={{ color: loaderColor + "30" }} // Ripple based on variant color
            testID={testID ?? "button"}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled }}
        >
            <View style={styles.contentContainer}>
                {/* Left Icon */}
                {leftIcon && !loading && (
                    <View style={styles.iconWrapper}>{leftIcon}</View>
                )}

                {/* Content: Loader > Children > Title */}
                {loading ? (
                    <ActivityIndicator size="small" color={loaderColor} />
                ) : children ? (
                    children // Render children if provided
                ) : (
                    title && ( // Render title only if non-empty and no children
                        <Text
                            style={[
                                styles.textBase, // Base text styles
                                variantStyles.text, // Apply variant text styles
                                textStyle, // Apply external text styles
                            ]}
                            numberOfLines={1} // Prevent text wrapping issues
                        >
                            {title}
                        </Text>
                    )
                )}

                {/* Right Icon */}
                {rightIcon && !loading && (
                    <View style={styles.iconWrapper}>{rightIcon}</View>
                )}
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    buttonBase: {
        // Base styles for layout, padding, border radius
        width: "100%",
        paddingVertical: 10, // Slightly reduced padding
        paddingHorizontal: 16, // Horizontal padding
        borderRadius: 24, // Keep border radius
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44, // Ensure minimum touch target height
        shadowOpacity: 0.1, // Base shadow settings
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        borderWidth: 0, // Default no border (set by variants)
    },
    contentContainer: {
        // Container for icon + text/children
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    textBase: {
        // Base styles for text
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },
    iconWrapper: {
        marginHorizontal: 8, // Space between icon and text/children
    },
    disabledState: {
        opacity: 0.5, // Use opacity for disabled state across variants
    },
    pressedState: {
        opacity: 0.8, // Use opacity for pressed state across variants
    },
})
