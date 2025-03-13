import React from "react"
import { View, StyleSheet, ViewStyle } from "react-native"

export interface StackProps {
    children: React.ReactNode
    spacing?: number
    style?: ViewStyle
    testID?: string
}

export function Stack({ children, spacing = 10, style, testID }: StackProps) {
    return (
        <View
            style={[styles.stack, { gap: spacing }, style]}
            testID={testID ?? "stack"}
        >
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    stack: {
        flexDirection: "column",
    },
})
