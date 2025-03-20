import React from "react"
import {
    Pressable,
    Text,
    StyleSheet,
    View,
    Image,
    ImageSourcePropType,
} from "react-native"
import { useThemeContext } from "../../../context/ThemeContext.tsx"
import DefaultProfile from "../../ui/assets/images/default-avatar.png" // Importing local asset

export interface ProfileHeaderProps {
    username: string
    profileImage?: string // Only accept URL strings
    onPressEdit: () => void
}

export function ProfileHeader({
    username,
    profileImage,
    onPressEdit,
}: ProfileHeaderProps) {
    const { colors } = useThemeContext()

    // Resolve the correct ImageSourcePropType
    const resolvedImage: ImageSourcePropType = profileImage
        ? { uri: profileImage }
        : (DefaultProfile as ImageSourcePropType) // Explicitly cast the static import

    return (
        <View style={styles.wrapper}>
            {/* Avatar Container */}
            <Pressable onPress={onPressEdit} style={styles.avatarContainer}>
                <Image
                    source={resolvedImage}
                    style={[styles.avatar, { backgroundColor: colors.primary }]}
                />
            </Pressable>

            {/* Name Container */}
            <View
                style={[
                    styles.nameContainer,
                    {
                        backgroundColor: colors.card,
                        shadowColor: colors.shadow,
                    },
                ]}
            >
                <Text style={[styles.username, { color: colors.text }]}>
                    {username}
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: "center",
        marginTop: 20,
    },
    avatarContainer: {
        width: 80, // Square size
        height: 80,
        overflow: "hidden",
        position: "absolute",
        top: -25, // Slightly overlaps the name container
        zIndex: 2,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10, // Square with rounded corners
    },
    avatar: {
        width: "100%",
        height: "100%",
        borderRadius: 10, // Match square shape
    },
    nameContainer: {
        width: 260, // Rectangular width
        height: 50, // Rectangular height
        borderRadius: 12, // Rounded rectangle
        justifyContent: "center",
        alignItems: "center",
        marginTop: 50, // Creates room for avatar overlap
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 5,
        elevation: 4,
    },
    username: {
        fontSize: 16,
        fontWeight: "bold",
    },
})
