import React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"
import ExpiredIcon from "../assets/svg/error.svg"

export interface ExpiredDocumentCardProps {
    documentName: string
    expirationDate: string
    onPress: () => void
    testID?: string
}

export function ExpiredDocumentCard({
    documentName,
    expirationDate,
    onPress,
    testID,
}: ExpiredDocumentCardProps) {
    const { colors } = useTheme()

    return (
        <TouchableOpacity
            style={[
                styles.container,
                // eslint-disable-next-line react-native/no-inline-styles
                {
                    backgroundColor: colors.card,
                    borderColor: colors.error,
                    borderWidth: 1.5,
                    opacity: 0.7,
                },
            ]}
            onPress={onPress}
            testID={testID}
        >
            <ExpiredIcon width={40} height={40} />
            <View
                style={[styles.textContainer, { shadowColor: colors.shadow }]}
            >
                <Text style={[styles.title, { color: colors.error }]}>
                    Documento expirado
                </Text>
                <Text style={[styles.document, { color: colors.text }]}>
                    {documentName}
                </Text>
                <Text style={[styles.date, { color: colors.error }]}>
                    Expiró: {expirationDate}
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
