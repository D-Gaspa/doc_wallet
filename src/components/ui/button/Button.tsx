import React, { ReactNode } from "react"
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"

type ButtonVariant = "primary" | "outline" | "text"

export interface ButtonProps {
    title?: string
    onPress: () => void
    loading?: boolean
    disabled?: boolean
    style?: ViewStyle
    textStyle?: TextStyle
    testID?: string
    children?: ReactNode
    variant?: ButtonVariant
    leftIcon?: ReactNode
    rightIcon?: ReactNode
}

export function Button({
    title,
    onPress,
    loading = false,
    disabled = false,
    style,
    textStyle,
    testID,
    children,
    variant = "primary",
    leftIcon,
    rightIcon,
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
                        borderWidth: 1.5,
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
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    text: {
                        color: isDisabled
                            ? colors.secondaryText + "80"
                            : colors.primary,
                        fontWeight: "500",
                    },
                }
            case "primary":
            default:
                return {
                    container: {
                        backgroundColor: colors.primary,
                        shadowColor: colors.shadow,
                        elevation: 3,
                    },
                    text: {
                        color: colors.tabbarIcon_active,
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
                styles.buttonBase,
                variantStyles.container,
                isDisabled
                    ? styles.disabledState
                    : pressed
                    ? styles.pressedState
                    : {},
                style,
            ]}
            android_ripple={{ color: loaderColor + "30" }}
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
                    title && (
                        <Text
                            style={[
                                styles.textBase,
                                variantStyles.text,
                                textStyle,
                            ]}
                            numberOfLines={1}
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
        width: "100%",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        borderWidth: 0,
    },
    contentContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    textBase: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },
    iconWrapper: {
        marginHorizontal: 8,
    },
    disabledState: {
        opacity: 0.5,
    },
    pressedState: {
        opacity: 0.8,
    },
})
