import React from "react"
import {
    Dimensions,
    Image,
    ImageSourcePropType,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../hooks/useTheme"
import { useNavigation } from "@react-navigation/native"
import DefaultProfile from "../assets/images/default-avatar.png"

const screenWidth = Dimensions.get("window").width
const containerPadding = 20

export interface ProfileHeaderProps {
    username: string
    profileImage?: string
    coverImage?: string
    onPressEdit?: () => void
    onPressNotifications?: () => void
    testID?: string
}

export function ProfileHeader({
    username,
    profileImage,
    coverImage,
    onPressNotifications,
    testID,
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

    const handleGoToNotifications = () => {
        if (onPressNotifications) {
            onPressNotifications()
        } else {
            navigation.navigate("Notifications" as never)
            console.log("Navigate to Notifications")
        }
    }

    return (
        <View style={styles.outerContainer} testID={testID ?? "profile-header"}>
            {/* Cover Photo Area */}
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
                    {/* Notifications Button */}
                    <TouchableOpacity
                        onPress={handleGoToNotifications}
                        style={[
                            styles.iconButton,
                            { backgroundColor: colors.card + "aa" },
                        ]}
                        testID="go-to-notifications"
                        accessibilityLabel="Ir a notificaciones"
                    >
                        <FontAwesome6
                            name="bell"
                            size={20}
                            color={colors.text}
                            iconStyle="solid"
                        />
                    </TouchableOpacity>

                    {/* Settings Button */}
                    <TouchableOpacity
                        onPress={handleGoToSettings}
                        style={[
                            styles.iconButton,
                            { backgroundColor: colors.card + "aa" },
                        ]}
                        testID="go-to-settings"
                        accessibilityLabel="Ir a configuración"
                    >
                        <FontAwesome6
                            name="gear"
                            size={20}
                            color={colors.text}
                            iconStyle="solid"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Profile Content Area (Avatar and Name) */}
            <View style={styles.profileInfoContainer}>
                {/* Profile Picture */}
                <View
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

                {/* Username */}
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
        width: "100%",
        marginBottom: 20,
    },
    coverPhotoContainer: {
        width: screenWidth,
        marginHorizontal: -containerPadding,
        height: 180,
        position: "relative",
        marginBottom: 60,
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
        position: "absolute",
        top: 45,
        right: containerPadding + 10,
        flexDirection: "row",
        zIndex: 2,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    avatar: {
        width: "100%",
        height: "100%",
    },
    username: {
        marginTop: 12,
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
    },
})
