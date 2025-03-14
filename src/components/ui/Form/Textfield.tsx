import React from "react"
import { TextInput, StyleSheet, ViewStyle } from "react-native"
import { useThemeContext } from "../../../context/ThemeContext.tsx"

export interface TextFieldProps {
    placeholder: string
    value: string
    onChangeText: (text: string) => void
    style?: ViewStyle
    testID?: string
}

export function TextField({
    placeholder,
    value,
    onChangeText,
    style,
    testID,
}: TextFieldProps) {
    const { colors } = useThemeContext()

    return (
        <TextInput
            style={[
                styles.input,
                {
                    backgroundColor: colors.searchbar,
                    color: colors.secondaryText,
                    borderColor: colors.border,
                },
                style,
            ]}
            placeholder={placeholder}
            placeholderTextColor={colors.secondaryText}
            value={value}
            onChangeText={onChangeText}
            testID={testID ?? "text-field"}
        />
    )
}

const styles = StyleSheet.create({
    input: {
        width: "100%",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 15,
        fontSize: 16,
        borderWidth: 1,
    },
})
