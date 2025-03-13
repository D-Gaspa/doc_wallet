import React from "react"
import { TouchableOpacity, View, Text, StyleSheet } from "react-native"
import { useThemeContext } from "../../../context/ThemeContext"
import CheckIcon from "../assets/svg/Check.svg"

export interface CheckboxProps {
    checked: boolean
    onToggle: () => void
    label?: string
    testID?: string
}

export function Checkbox({ checked, onToggle, label, testID }: CheckboxProps) {
    const { colors } = useThemeContext()

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onToggle}
            testID={testID ?? "checkbox"}
            activeOpacity={0.7}
        >
            {/* Checkbox Square */}
            <View
                style={[
                    styles.checkbox,
                    // eslint-disable-next-line react-native/no-color-literals,react-native/no-inline-styles
                    {
                        borderColor: colors.primary,
                        backgroundColor: checked
                            ? colors.primary
                            : "transparent",
                    },
                ]}
            >
                {checked && (
                    <CheckIcon width={18} height={18} stroke={"#FFFFFF"} />
                )}
            </View>

            {/* Label */}
            {label && (
                <Text style={[styles.label, { color: colors.secondaryText }]}>
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
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6, // Slightly rounded corners
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        fontSize: 16,
        marginLeft: 8,
    },
})
