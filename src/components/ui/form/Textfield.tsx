// src/components/ui/form/Textfield.tsx
import React from "react"
// ---> Import required types <---
import {
    TextInput,
    StyleSheet,
    ViewStyle,
    TextInputProps,
    StyleProp,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts" // Adjust path if needed

export interface TextFieldProps
    extends Omit<TextInputProps, "style" | "placeholderTextColor"> {
    placeholder: string
    value: string
    onChangeText: (text: string) => void
    style?: StyleProp<ViewStyle> // ---> Use StyleProp<ViewStyle> for flexibility <---
    testID?: string
    hasError?: boolean // ---> Add hasError prop <---
    // Add ref support using forwardRef
}

// ---> Use React.forwardRef to allow passing refs <---
export const TextField = React.forwardRef<TextInput, TextFieldProps>(
    (
        {
            placeholder,
            value,
            onChangeText,
            style,
            testID,
            hasError, // ---> Destructure hasError <---
            ...rest
        },
        ref,
    ) => {
        // ---> Add ref parameter <---
        const { colors } = useTheme()

        // Determine border color based on error state
        const borderColor = hasError ? colors.error : colors.border

        return (
            <TextInput
                ref={ref} // ---> Assign the forwarded ref <---
                style={[
                    styles.input, // Base styles
                    {
                        // Theme-based styles
                        backgroundColor: colors.searchbar,
                        color: colors.text,
                        borderColor: borderColor, // ---> Use dynamic border color <---
                    },
                    // Apply error border width style conditionally
                    hasError && styles.inputError,
                    style, // Apply external styles last
                ]}
                placeholder={placeholder}
                placeholderTextColor={colors.secondaryText}
                value={value}
                onChangeText={onChangeText}
                testID={testID ?? "text-field"}
                {...rest}
            />
        )
    },
)

TextField.displayName = "TextField" // Add display name for forwardRef

const styles = StyleSheet.create({
    input: {
        width: "100%",
        minHeight: 48,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1, // Base border width
    },
    inputError: {
        // Style applied when hasError is true
        borderWidth: 1.5, // Make border thicker for error state
    },
})
