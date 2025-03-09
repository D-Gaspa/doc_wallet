import React from "react"
import { ActivityIndicator, View, StyleSheet } from "react-native"
import { useTheme } from "../../hooks/useTheme"

const LoadingIndicator = () => {
    const { colors } = useTheme()
    return (
        <View style={styles.container} testID="loading-indicator">
            <ActivityIndicator
                size="large"
                color={colors.primary}
                testID="activity-indicator"
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { justifyContent: "center", alignItems: "center", flex: 1 },
})

export default LoadingIndicator
