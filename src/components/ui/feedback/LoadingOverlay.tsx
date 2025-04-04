import React from "react"
import { View, StyleSheet, ActivityIndicator } from "react-native"
import { useThemeContext } from "../../../context/ThemeContext"

interface LoadingOverlayProps {
    visible: boolean
}

export const LoadingOverlay = ({ visible }: LoadingOverlayProps) => {
    const { colors } = useThemeContext()

    if (!visible) return null

    return (
        <View style={styles.overlay}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    )
}

const styles = StyleSheet.create({
    // eslint-disable-next-line react-native/no-color-literals
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.2)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
    },
})
