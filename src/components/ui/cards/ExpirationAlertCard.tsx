import React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import InfoIcon from "../assets/svg/ExclamationIcon.svg" // assuming that's the icon used

interface Props {
    documentName: string
    expirationDate: string
    onPress?: () => void
}

export function ExpiringDocumentCard({
    documentName,
    expirationDate,
    onPress,
}: Props) {
    const { colors } = useTheme()

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                styles.card,
                {
                    backgroundColor: colors.background,
                    shadowColor: colors.shadow,
                },
            ]}
        >
            <View
                style={[
                    styles.iconContainer,
                    { backgroundColor: colors.primary },
                ]}
            >
                <InfoIcon width={24} height={24} fill={colors.primary} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                    Documento a punto de expirar: {documentName}
                </Text>
                <Text style={[styles.subtitle, { color: colors.text }]}>
                    Fecha de expiración: {expirationDate}
                </Text>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        padding: 16,
        marginRight: 12,
        minWidth: 300,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: "400",
    },
})
