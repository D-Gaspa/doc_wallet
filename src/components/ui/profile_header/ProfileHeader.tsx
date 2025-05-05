import React from "react"
import {
    View,
    Text,
    StyleSheet,
    Image,
    ImageSourcePropType,
    TouchableOpacity,
    Dimensions, // Import Dimensions
} from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { useNavigation } from "@react-navigation/native"
import SettingsIcon from "../assets/svg/settings.svg"
import NotificationsIcon from "../assets/svg/bell.svg"
import DefaultProfile from "../../ui/assets/images/default-avatar.png"

const screenWidth = Dimensions.get("window").width
const containerPadding = 20

export interface ProfileHeaderProps {
    username: string
    profileImage?: string
    coverImage?: string
    onPressEdit: () => void
    onPressNotifications?: () => void
}

export function ProfileHeader({
    username,
    profileImage,
    coverImage,
    onPressNotifications,
}: ProfileHeaderProps) {
    const { colors } = useTheme()
    const navigation = useNavigation()

    const resolvedProfileImage: ImageSourcePropType = profileImage
        ? { uri: profileImage }
        : DefaultProfile

    const resolvedCoverImage: ImageSourcePropType | null = coverImage
        ? { uri: coverImage }
        : null

    const handleGoToSettings = () => {
        navigation.navigate("Settings" as never)
    }

    // Placeholder for navigation to notifications
    const handleGoToNotifications = () => {
        if (onPressNotifications) {
            onPressNotifications()
        } else {
            // navigation.navigate("Notifications" as never); // Example navigation
            console.log("Navigate to Notifications")
        }
    }

    return (
        // Note: Container style is removed as positioning is handled internally now
        <View style={styles.outerContainer}>
            {/* Cover Photo Area - Use negative margin to extend edge-to-edge */}
            {/* This assumes the parent container has horizontal padding */}
            <View
                style={[
                    styles.coverPhotoContainer,
                    { backgroundColor: colors.secondary },
                ]}
            >
                {resolvedCoverImage ? (
                    <Image
                        source={resolvedCoverImage}
                        style={styles.coverPhoto}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.coverPhotoPlaceholder} />
                )}

                {/* Icons Wrapper (Top Right) */}
                <View style={styles.headerIconsWrapper}>
                    <TouchableOpacity
                        onPress={handleGoToNotifications} // Use the new handler
                        style={[
                            styles.iconButton, // Use common style
                            { backgroundColor: colors.card + "aa" },
                        ]}
                        testID="go-to-notifications"
                    >
                        {/* Use the new Notifications Icon */}
                        <NotificationsIcon
                            width={22}
                            height={22}
                            color={colors.text}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleGoToSettings}
                        style={[
                            styles.iconButton, // Use common style
                            { backgroundColor: colors.card + "aa" },
                        ]}
                        testID="go-to-settings"
                    >
                        <SettingsIcon
                            width={22}
                            height={22}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Profile Content Area (Avatar and Name) */}
            <View style={styles.profileInfoContainer}>
                {/* Profile Picture (Overlapping Cover) - No edit overlay */}
                <View // Changed Pressable to View, edit button is now separate
                    style={[
                        styles.avatarWrapper,
                        { borderColor: colors.background },
                    ]}
                >
                    <Image
                        source={resolvedProfileImage}
                        style={styles.avatar}
                    />
                </View>

                {/* Username Below Avatar */}
                <Text style={[styles.username, { color: colors.text }]}>
                    {username}
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    outerContainer: {
        alignItems: "center",
        width: "100%", // Takes full width from parent
    },
    coverPhotoContainer: {
        width: screenWidth, // Force full screen width
        // Use negative margin to counter parent padding (adjust 'containerPadding' if needed)
        marginHorizontal: -containerPadding,
        height: 180,
        position: "relative", // Needed for absolute positioning of icons
        marginBottom: 60, // Ensure space for the overlapping avatar height
    },
    coverPhoto: {
        width: "100%",
        height: "100%",
    },
    coverPhotoPlaceholder: {
        width: "100%",
        height: "100%",
    },
    headerIconsWrapper: {
        // Wrapper for top-right icons
        position: "absolute",
        top: 40, // Adjust as needed for status bar
        right: containerPadding, // Align with original content edge before negative margin
        flexDirection: "row",
        zIndex: 2,
    },
    iconButton: {
        // Common style for top-right icon buttons
        padding: 8,
        borderRadius: 18,
        marginLeft: 8, // Space between icons
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    profileInfoContainer: {
        alignItems: "center",
        marginTop: -120,
        zIndex: 1,
    },
    avatarWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        elevation: 5, // Android shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    avatar: {
        width: "100%",
        height: "100%",
    },
    // editIconWrapper style is removed
    username: {
        marginTop: 12,
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
    },
})
