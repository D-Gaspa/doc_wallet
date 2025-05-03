// components/ui/cards/NotificationCard.tsx
import React from "react"
import { View, Text, StyleSheet, Platform } from "react-native"
import { format } from "date-fns"
import { useThemeContext } from "../../../context/ThemeContext.tsx"

type Props = {
    title: string
    body: string
    sentAt: string
}

export const NotificationCard = ({ title, body, sentAt }: Props) => {
    const { colors } = useThemeContext()

    return (
        <View style={styles.cardWrapper}>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {title}
                </Text>
                <Text style={[styles.body, { color: colors.text }]}>
                    {body}
                </Text>
                <Text style={styles.time}>
                    {format(new Date(sentAt), "PPpp")}
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 12,
        borderRadius: 10,
        overflow: "hidden",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
            },
            android: {
                elevation: 3,
            },
        }),
    },
    card: {
        padding: 16,
        borderRadius: 10,
    },
    title: { fontWeight: "600", fontSize: 16, marginBottom: 4 },
    body: { fontSize: 14 },
    // eslint-disable-next-line react-native/no-color-literals
    time: { marginTop: 10, fontSize: 12, color: "#888" },
})
