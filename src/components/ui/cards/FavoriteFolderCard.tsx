import React from "react"
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme" // Adjust path
import { Folder } from "../screens/folders/types" // Adjust path

interface FavoriteFolderCardProps {
    folder: Folder
    icon: React.ReactNode
    onPress: () => void
    style?: ViewStyle
    testID?: string
}

export function FavoriteFolderCard({
    folder,
    icon,
    onPress,
    style,
    testID,
}: FavoriteFolderCardProps) {
    const { colors } = useTheme()

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: colors.card, shadowColor: colors.shadow },
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
            testID={testID ?? `fav-folder-${folder.id}`}
        >
            <View style={styles.iconContainer}>{icon}</View>
            <Text
                style={[styles.title, { color: colors.text }]}
                numberOfLines={2} // Allow up to two lines for the title
                ellipsizeMode="tail"
            >
                {folder.title}
            </Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        width: 110, // Adjust width as needed
        height: 110, // Adjust height as needed
        borderRadius: 16,
        padding: 12,
        marginRight: 12, // Space between cards
        alignItems: "center",
        justifyContent: "center", // Center content vertically
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        marginBottom: 8, // Space between icon and text
        width: 36, // Icon size
        height: 36,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 13, // Slightly smaller font size
        fontWeight: "500",
        textAlign: "center",
    },
})
