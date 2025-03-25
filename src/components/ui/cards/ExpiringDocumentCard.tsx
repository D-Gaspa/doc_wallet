import React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"
import ExpiringIcon from "../assets/svg/ExclamationIcon.svg"

export interface ExpiringDocumentCardProps {
    documentName: string
    expirationDate: string
    onPress: () => void
    testID?: string
}

export function ExpiringDocumentCard({
    documentName,
    expirationDate,
    onPress,
    testID,
}: ExpiringDocumentCardProps) {
    const { colors } = useTheme()

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: colors.card }]}
            onPress={onPress}
            testID={testID}
        >
            <ExpiringIcon width={40} height={40} />
            <View
                style={[styles.textContainer, { shadowColor: colors.shadow }]}
            >
                <Text style={[styles.title, { color: colors.text }]}>
                    Documento a punto de expirar:
                </Text>
                <Text style={[styles.document, { color: colors.primary }]}>
                    {documentName}
                </Text>
                <Text style={[styles.date, { color: colors.error }]}>
                    Fecha de expiración: {expirationDate}
                </Text>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderRadius: 10,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 3,
        height: 90,
        marginHorizontal: 5,
    },
    textContainer: {
        marginLeft: 20,
    },
    title: {
        fontSize: 14,
        fontWeight: "bold",
    },
    document: {
        fontSize: 14,
    },
    date: {
        fontSize: 12,
        fontWeight: "bold",
    },
})
