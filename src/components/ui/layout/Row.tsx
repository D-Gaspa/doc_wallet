import React from "react"
import { View, StyleSheet, ViewStyle } from "react-native"

export interface RowProps {
    children: React.ReactNode
    spacing?: number
    align?: "flex-start" | "center" | "flex-end"
    justify?: "flex-start" | "center" | "space-between" | "space-around"
    style?: ViewStyle
    testID?: string
}

export function Row({
    children,
    spacing = 10,
    align = "center",
    justify = "space-between",
    style,
    testID,
}: RowProps) {
    return (
        <View
            style={[
                styles.row,
                { gap: spacing, alignItems: align, justifyContent: justify },
                style,
            ]}
            testID={testID ?? "row"}
        >
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
    },
})
