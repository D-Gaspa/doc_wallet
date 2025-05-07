import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useTheme } from "../../../hooks/useTheme"

export interface TagProps {
    id: string
    name: string
    color: string
    onPress?: () => void
    onLongPress?: () => void
    selected?: boolean
    testID?: string
    size?: "default" | "small"
}

export function Tag({
    id,
    name,
    color,
    onPress,
    onLongPress,
    selected = false,
    testID,
    size = "default",
}: TagProps) {
    const { colors } = useTheme()

    const handleLongPress = () => {
        if (onLongPress) {
            onLongPress()
            return true
        }
    }
    const containerStyle = [
        styles.container,
        {
            backgroundColor: color + "20",
            borderColor: color,
        },
        selected && styles.selected,
        selected && {
            backgroundColor: color + "40",
        },
        size === "small" && styles.containerSmall,
    ]
    const dotStyle = [
        styles.dot,
        { backgroundColor: color },
        size === "small" && styles.dotSmall,
    ]
    const textStyle = [
        styles.text,
        { color: colors.text },
        size === "small" && styles.textSmall,
    ]

    return (
        <TouchableOpacity
            style={containerStyle}
            onPress={onPress}
            onLongPress={handleLongPress}
            delayLongPress={500}
            activeOpacity={0.7}
            testID={testID ?? `tag-${id}`}
        >
            <View style={dotStyle} />
            <Text style={textStyle} numberOfLines={1}>
                {name}
            </Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 6,
        margin: 4,
        borderWidth: 1,
    },
    containerSmall: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 12,
        margin: 2,
    },
    selected: {
        borderWidth: 3,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    dotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    text: {
        fontSize: 14,
        fontWeight: "500",
    },
    textSmall: {
        fontSize: 11,
    },
})
