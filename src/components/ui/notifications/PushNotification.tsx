import React from "react"
import { StyleSheet, Text, View, Image } from "react-native"
import { useTheme } from "../../../hooks/useTheme"

type Props = {
    title: string
    subtitle: string
    icon?: string
    timestamp: string
}

export const PushNotification = ({
    title,
    subtitle,
    icon,
    timestamp,
}: Props) => {
    const { colors } = useTheme()

    return (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
            {icon && <Image source={{ uri: icon }} style={styles.icon} />}
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {title}
                </Text>
                <Text style={[styles.subtitle, { color: colors.text + "99" }]}>
                    {subtitle}
                </Text>
                <Text style={[styles.timestamp, { color: colors.text + "66" }]}>
                    {timestamp}
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: "center",
    },
    icon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontWeight: "bold",
        fontSize: 16,
    },
    subtitle: {
        fontSize: 14,
    },
    timestamp: {
        fontSize: 12,
        marginTop: 4,
    },
})
