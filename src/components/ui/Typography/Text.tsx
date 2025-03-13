import React from "react"
import { Text as RNText, TextProps, StyleSheet } from "react-native"
import { useThemeContext } from "../../../context/ThemeContext"
import { typography } from "../../../config/theme"

export type TextVariant = "xl" | "lg" | "md" | "base" | "sm" | "xm"
export type TextWeight = "regular" | "medium" | "bold" | "heavy"

interface CustomTextProps extends TextProps {
    variant?: TextVariant
    weight?: TextWeight
}

export function Text({
    variant = "base",
    weight = "regular",
    style,
    ...props
}: CustomTextProps) {
    const { colors } = useThemeContext()

    return (
        <RNText
            style={[
                styles.text,
                {
                    fontSize: typography.fontSize[variant],
                    lineHeight: typography.lineHeight[variant] + 5, // Add 5 for extra spacing
                    fontFamily: typography.fonts[weight].fontFamily,
                    fontWeight: typography.fonts[weight].fontWeight,
                    color: colors.text,
                },
                style,
            ]}
            {...props}
        />
    )
}

const styles = StyleSheet.create({
    text: {
        flexWrap: "wrap", // Ensures text wraps properly
        textAlignVertical: "center", // Keeps text aligned properly
    },
})
