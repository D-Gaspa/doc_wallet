import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../hooks/useTheme"

export interface CheckboxProps {
    checked: boolean
    onToggle: () => void
    label?: string
    testID?: string
    checkboxSize?: number
    iconSize?: number
    labelStyle?: object
}

export function Checkbox({
    checked,
    onToggle,
    label,
    testID,
    checkboxSize = 24,
    iconSize = 16,
    labelStyle,
}: CheckboxProps) {
    const { colors } = useTheme()

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onToggle}
            testID={testID ?? "checkbox"}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel={label}
        >
            {/* Checkbox Square */}
            <View
                style={[
                    styles.checkboxSquare,
                    // eslint-disable-next-line react-native/no-color-literals,react-native/no-inline-styles
                    {
                        width: checkboxSize,
                        height: checkboxSize,
                        borderColor: colors.primary,
                        backgroundColor: checked
                            ? colors.primary
                            : "transparent",
                        borderRadius: checkboxSize * 0.25,
                    },
                ]}
            >
                {checked && (
                    <FontAwesome6
                        name="check"
                        size={iconSize}
                        color={"#FFFFFF"}
                        iconStyle="solid"
                    />
                )}
            </View>

            {/* Label */}
            {label && (
                <Text
                    style={[styles.label, { color: colors.text }, labelStyle]}
                >
                    {label}
                </Text>
            )}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
    },
    checkboxSquare: {
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        fontSize: 16,
        marginLeft: 10,
    },
})
