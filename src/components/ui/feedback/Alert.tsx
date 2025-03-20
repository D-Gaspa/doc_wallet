import React, { useEffect, useRef } from "react"
import { Text, StyleSheet, Animated, TouchableOpacity } from "react-native"
import { useThemeContext } from "../../../context/ThemeContext.tsx"

// Import alert icons
import SuccessIcon from "../assets/svg/success.svg"
import WarningIcon from "../assets/svg/warning-outline.svg"
import InfoIcon from "../assets/svg/ExclamationIcon.svg"
import ErrorIcon from "../assets/svg/error.svg"

export type AlertType = "success" | "error" | "warning" | "info"

export interface AlertProps {
    type: AlertType
    message: string
    visible: boolean
    onClose: () => void
    autoDismiss?: boolean
    duration?: number // Auto-dismiss time (default: 3 sec)
}

export function Alert({
    type,
    message,
    visible,
    onClose,
    autoDismiss = true,
    duration = 3000,
}: AlertProps) {
    const { colors } = useThemeContext()
    const fadeAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (visible) {
            // Fade in animation
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start()

            if (autoDismiss) {
                const timer = setTimeout(() => {
                    handleClose()
                }, duration)
                return () => clearTimeout(timer)
            }
        } else {
            // Fade out when alert is hidden
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start()
        }
    }, [visible])

    const handleClose = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => onClose())
    }

    const alertStyles = {
        success: { background: colors.success, icon: colors.success },
        error: { background: colors.error, icon: colors.error },
        warning: { background: colors.warning, icon: colors.warning },
        info: { background: colors.primary, icon: "#FFFFFF" }, // Ensure info uses white
    }

    const IconComponent =
        type === "success"
            ? SuccessIcon
            : type === "error"
            ? ErrorIcon
            : type === "warning"
            ? WarningIcon
            : InfoIcon

    if (!visible) return null // Prevents unnecessary renders

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: alertStyles[type].background,
                    opacity: fadeAnim,
                    shadowColor: colors.shadow,
                },
            ]}
        >
            <IconComponent
                width={24}
                height={24}
                fill={alertStyles[type].icon}
            />
            <Text style={[styles.message, { color: colors.tabbarIcon_active }]}>
                {message}
            </Text>

            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={{ color: colors.text }}>✕</Text>
            </TouchableOpacity>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        bottom: 100,
        borderRadius: 10,
        marginHorizontal: 20,
        marginTop: 10,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 3,
        zIndex: 1,
    },
    message: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: "bold",
    },
    closeButton: {
        marginLeft: 10,
        padding: 5,
    },
})
