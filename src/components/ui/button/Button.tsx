import React from "react"
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native"
import { useThemeContext } from "../../../context/ThemeContext.tsx"

export interface ButtonProps {
    title: string
    onPress: () => void
    style?: ViewStyle
    testID?: string
}

export function Button({ title, onPress, style, testID }: ButtonProps) {
    const { colors } = useThemeContext()

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: colors.primary,
                    shadowColor: colors.shadow,
                },
                style,
            ]}
            onPress={onPress}
            testID={testID ?? "button"}
        >
            <Text style={[styles.text, { color: colors.tabbarIcon_active }]}>
                {title}
            </Text>
        </TouchableOpacity>
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
