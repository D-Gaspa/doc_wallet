import React, { ReactNode } from "react"
import {
    Pressable,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"

export interface ButtonProps {
    title?: string // ahora opcional
    onPress: () => void
    loading?: boolean
    disabled?: boolean
    style?: ViewStyle
    testID?: string
    children?: ReactNode // permitimos children
}

export function Button({
    title,
    onPress,
    loading = false,
    disabled = false,
    style,
    testID,
    children,
}: ButtonProps) {
    const { colors } = useTheme()
    const isDisabled = disabled || loading

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.button,
                {
                    backgroundColor: colors.primary,
                    shadowColor: colors.shadow,
                    opacity: isDisabled ? 0.6 : pressed ? 0.8 : 1,
                },
                style,
            ]}
            android_ripple={{ color: colors.tabbarIcon_active + "20" }}
            testID={testID ?? "button"}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={colors.tabbarIcon_active}
                />
            ) : children ? (
                children
            ) : (
                title != null && (
                    <Text
                        style={[
                            styles.text,
                            { color: colors.tabbarIcon_active },
                        ]}
                    >
                        {title}
                    </Text>
                )
            )}
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        width: "100%",
        paddingVertical: 12,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 5,
    },
    text: {
        fontSize: 16,
        fontWeight: "bold",
    },
})
