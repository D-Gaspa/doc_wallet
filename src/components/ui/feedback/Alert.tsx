import React, { useEffect, useRef } from "react"
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../hooks/useTheme"

export type AlertType = "success" | "error" | "warning" | "info"

export interface AlertProps {
    type: AlertType
    message: string
    visible: boolean
    onClose: () => void
    autoDismiss?: boolean
    duration?: number
    testID?: string
}

export function Alert({
    type,
    message,
    visible,
    onClose,
    autoDismiss = true,
    duration = 3000,
    testID,
}: AlertProps) {
    const { colors } = useTheme()
    const fadeAnim = useRef(new Animated.Value(0)).current
    const iconSize = 20
    const closeIconSize = 16

    useEffect(() => {
        if (visible) {
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
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start()
        }
    }, [visible, autoDismiss, duration, fadeAnim, onClose])

    const handleClose = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => onClose())
    }

    const alertConfig = {
        success: {
            background: colors.success,
            iconColor: colors.tabbarIcon_active,
            iconName: "circle-check" as const,
        },
        error: {
            background: colors.error,
            iconColor: colors.tabbarIcon_active,
            iconName: "circle-xmark" as const,
        },
        warning: {
            background: colors.warning,
            iconColor: colors.text,
            iconName: "triangle-exclamation" as const,
        },
        info: {
            background: colors.primary,
            iconColor: colors.tabbarIcon_active,
            iconName: "circle-info" as const,
        },
    }

    const currentConfig = alertConfig[type]

    if (!visible) return null

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: currentConfig.background,
                    opacity: fadeAnim,
                    shadowColor: colors.shadow,
                },
            ]}
            testID={testID ?? `alert-${type}`}
        >
            {/* Alert Type Icon */}
            <View style={styles.iconWrapper}>
                <FontAwesome6
                    name={currentConfig.iconName}
                    size={iconSize}
                    color={currentConfig.iconColor}
                    iconStyle="solid"
                />
            </View>

            {/* Message Text */}
            <Text
                style={[
                    styles.message,
                    type === "success" || type === "error" || type === "info"
                        ? { color: colors.tabbarIcon_active }
                        : { color: colors.text },
                ]}
            >
                {message}
            </Text>

            {/* Close Button with Icon */}
            <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                testID="alert-close-button"
                accessibilityLabel="Cerrar alerta"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <FontAwesome6
                    name="xmark"
                    size={closeIconSize}
                    color={
                        type === "success" ||
                        type === "error" ||
                        type === "info"
                            ? colors.tabbarIcon_active
                            : colors.text
                    }
                    iconStyle="solid"
                />
            </TouchableOpacity>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginHorizontal: 20,
        marginTop: 10,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 3,
    },
    iconWrapper: {
        marginRight: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
    },
    closeButton: {
        marginLeft: 10,
        padding: 5,
        alignItems: "center",
        justifyContent: "center",
    },
})
