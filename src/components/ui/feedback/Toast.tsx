import React, { useEffect, useRef } from "react"
import { Text, StyleSheet, Animated } from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"

export interface ToastProps {
    message: string
    visible: boolean
    duration?: number // Optional duration prop (default 3 sec)
    onDismiss?: () => void // Callback to update visibility state
}

export function Toast({
    message,
    visible,
    duration = 3000,
    onDismiss,
}: ToastProps) {

    const { colors } = useTheme()
    const opacity = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (visible) {
            // Fade in
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start()

            // Auto-dismiss after `duration` milliseconds
            const timer = setTimeout(() => {
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    if (onDismiss) onDismiss() // Call parent state setter
                })
            }, duration)

            return () => clearTimeout(timer) // Cleanup timer on unmount
        } else {
            // Fade out when visibility is set to false
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start()
        }
    }, [visible])

    if (!visible) return null // Prevent unnecessary renders

    return (
        <Animated.View
            style={[styles.toast, { backgroundColor: colors.primary, opacity }]}
        >
            <Text style={[styles.text, { color: colors.tabbarIcon_active }]}>
                {message}
            </Text>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    toast: {
        position: "absolute",
        bottom: 100, // Adjust position to avoid overlapping tabbar
        left: "10%",
        right: "10%",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: "center",
        zIndex: 1,
    },
    text: {
        fontSize: 14,
        fontWeight: "bold",
    },
})
