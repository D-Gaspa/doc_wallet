import React from "react"
import { View, Text, StyleSheet, ActivityIndicator } from "react-native"
import { useTheme } from "../../hooks/useTheme.ts"

const LoadingScreens = () => {
    const { colors } = useTheme() // Ensure we get colors from the theme

    return (
        <View
            testID="loading-screens"
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View testID="loading-indicator">
                <ActivityIndicator testID="activity-indicator" />
            </View>
            <Text testID="loading-spinner">Loading...</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
})

export default LoadingScreens
