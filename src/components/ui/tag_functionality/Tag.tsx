// src/components/ui/tag_functionality/Tag.tsx
import React from "react"
import { TouchableOpacity, Text, StyleSheet, View } from "react-native"
import { useTheme } from "../../../hooks/useTheme"

export interface TagProps {
    id: string
    name: string
    color: string
    onPress?: () => void
    onLongPress?: () => void
    selected?: boolean
    testID?: string
}

export function Tag({
    id,
    name,
    color,
    onPress,
    onLongPress,
    selected = false,
    testID,
}: TagProps) {
    const { colors } = useTheme()

    // Handle the long press event
    const handleLongPress = () => {
        if (onLongPress) {
            // Call the long press handler
            onLongPress()

            // Return true to indicate the event was handled
            // and shouldn't trigger the regular press handler
            return true
        }
    }

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: color + "20" }, // 20% opacity
                { borderColor: color },
                selected && styles.selected,
            ]}
            onPress={onPress}
            onLongPress={handleLongPress}
            // Set a reasonable delay for long press (default is 500ms)
            delayLongPress={500}
            // Make it more responsive to touch
            activeOpacity={0.7}
            testID={testID ?? `tag-${id}`}
        >
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text
                style={[styles.text, { color: colors.text }]}
                numberOfLines={1}
            >
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
    selected: {
        borderWidth: 2,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    text: {
        fontSize: 14,
        fontWeight: "500",
    },
})
