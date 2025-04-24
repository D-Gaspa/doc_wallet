import React from "react"
import {
    View,
    Text,
    StyleSheet,
    Image,
    ImageSourcePropType,
    Pressable,
    TouchableOpacity,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { useNavigation } from "@react-navigation/native"
import SettingsIcon from "../assets/svg/settings.svg"
import EditIcon from "../assets/svg/edit.svg"
import DefaultProfile from "../../ui/assets/images/default-avatar.png"

export interface ProfileHeaderProps {
    username: string
    profileImage?: string
    onPressEdit: () => void
}

export function ProfileHeader({
    username,
    profileImage,
    onPressEdit,
}: ProfileHeaderProps) {
    const { colors } = useTheme()
    const navigation = useNavigation()

    const resolvedImage: ImageSourcePropType =
        profileImage && true ? { uri: profileImage } : DefaultProfile

    const handleGoToSettings = () => {
        navigation.navigate("Settings" as never)
    }

    return (
        <View style={styles.container}>
            {/* Top right settings */}
            <TouchableOpacity
                onPress={handleGoToSettings}
                style={[
                    styles.settingsButton,
                    { backgroundColor: colors.card },
                ]}
                testID="go-to-settings"
            >
                <SettingsIcon width={22} height={22} stroke={colors.text} />
            </TouchableOpacity>

            {/* Avatar and name */}
            <View style={styles.profileContent}>
                <Pressable onPress={onPressEdit} style={styles.avatarWrapper}>
                    <Image source={resolvedImage} style={styles.avatar} />
                    <View
                        style={[
                            styles.editIcon,
                            { backgroundColor: colors.card },
                        ]}
                    >
                        <EditIcon width={16} height={16} stroke={colors.text} />
                    </View>
                </Pressable>

                <Text style={[styles.username, { color: colors.text }]}>
                    {username}
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        alignItems: "center",
        paddingTop: 30,
        paddingBottom: 20,
        position: "relative",
    },
    settingsButton: {
        position: "absolute",
        top: 16,
        right: 16,
        padding: 8,
        borderRadius: 12,
        zIndex: 2,
        elevation: 2,
    },
    profileContent: {
        alignItems: "center",
    },
    avatarWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: "hidden",
        elevation: 5,
        position: "relative",
    },
    avatar: {
        width: "100%",
        height: "100%",
        borderRadius: 50,
    },
    editIcon: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        elevation: 3,
    },
    username: {
        marginTop: 12,
        fontSize: 20,
        fontWeight: "bold",
    },
})
