import React from "react"
import { View, StyleSheet, ViewStyle, SafeAreaView } from "react-native"
import { useThemeContext } from "../../../context/ThemeContext.tsx"

export interface ContainerProps {
    children: React.ReactNode
    style?: ViewStyle
    testID?: string
}

export function Container({ children, style, testID }: ContainerProps) {
    const { colors } = useThemeContext()

    return (
        <SafeAreaView
            style={[styles.safeArea, { backgroundColor: colors.background }]}
        >
            <View
                style={[
                    styles.container,
                    { backgroundColor: colors.background },
                    style,
                ]}
                testID={testID ?? "container"}
            >
                {children}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
})
