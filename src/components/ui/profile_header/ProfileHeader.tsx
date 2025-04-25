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
import { useTheme } from "../../../hooks/useTheme" // [cite: 191]
import { useNavigation } from "@react-navigation/native"
import SettingsIcon from "../assets/svg/settings.svg"
import EditIcon from "../assets/svg/edit.svg"
import NotificationsIcon from "../assets/svg/bell.svg" // ---> Import Notification Icon
import DefaultProfile from "../../ui/assets/images/default-avatar.png" // [cite: 191]
// import DefaultCover from '../../ui/assets/images/default-cover.png';

// Get screen width - assuming standard padding of 20 used in parent containers
const screenWidth = Dimensions.get("window").width
const containerPadding = 20 // Adjust if your standard padding differs

export interface ProfileHeaderProps {
    username: string
    profileImage?: string // [cite: 191]
    coverImage?: string
    onPressEdit: () => void // [cite: 191]
    // Optional: Add handler for notifications button
    onPressNotifications?: () => void
}

export function ProfileHeader({
    username,
    profileImage,
    coverImage,
    onPressEdit,
    onPressNotifications, // Add prop for notification press
}: ProfileHeaderProps) {
    const { colors } = useTheme() // [cite: 191]
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

                {/* Edit Profile Button - Moved outside avatar */}
                <TouchableOpacity
                    onPress={onPressEdit}
                    style={[
                        styles.editProfileButton,
                        { backgroundColor: colors.card },
                    ]}
                    testID="edit-profile-button"
                >
                    <EditIcon width={18} height={18} color={colors.text} />
                    <Text
                        style={[
                            styles.editProfileButtonText,
                            { color: colors.text },
                        ]}
                    >
                        Edit Profile
                    </Text>
                </TouchableOpacity>
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
        // Container for avatar, name, edit button
        alignItems: "center",
        // This container respects the parent's padding implicitly
        marginTop: -120, // Overlap calculation: - (avatar height / 2) - (cover marginBottom / 2) - Adjust as needed
        zIndex: 1, // Ensure it's above the cover photo but below icons if necessary
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
        fontWeight: "bold", // [cite: 200]
        textAlign: "center",
    },
    editProfileButton: {
        // Style for the new edit button
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16, // Space below username
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        elevation: 2, // Android shadow
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    editProfileButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: "600",
    },
})
