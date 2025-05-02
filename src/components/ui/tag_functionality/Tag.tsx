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
    size?: "default" | "small";
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

    // Handle the long press event
    const handleLongPress = () => {
        if (onLongPress) {
            onLongPress()
            return true
        }
    }
    const containerStyle = [
        styles.container,
        { backgroundColor: color + "20", borderColor: color },
        selected && styles.selected,
        size === "small" && styles.containerSmall, // Apply small style
    ];
    const dotStyle = [
        styles.dot,
        { backgroundColor: color },
        size === "small" && styles.dotSmall, // Apply small style
    ];
    const textStyle = [
        styles.text,
        { color: colors.text },
        size === "small" && styles.textSmall, // Apply small style
    ];

    return (
        <TouchableOpacity
            style={containerStyle} // Use combined style
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
    );
}
const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        paddingHorizontal: 8, // Default padding
        paddingVertical: 6,   // Default padding
        margin: 4,
        borderWidth: 1,
    },
    containerSmall: { // Styles for small tags
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 12,
        margin: 2,
    },
    selected: {
        borderWidth: 1.5, // Make border slightly thicker when selected
        // You might want a different background/border for selected small tags too
    },
    dot: {
        width: 8, // Default size
        height: 8, // Default size
        borderRadius: 4, // Default size
        marginRight: 6, // Default margin
    },
    dotSmall: { // Styles for small dot
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    text: {
        fontSize: 14, // Default font size
        fontWeight: "500",
    },
    textSmall: { // Style for small text
        fontSize: 11,
    },
});
