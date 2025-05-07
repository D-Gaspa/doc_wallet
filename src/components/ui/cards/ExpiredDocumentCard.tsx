import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../hooks/useTheme"

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
    const iconSize = 36

    return (
        <TouchableOpacity
            style={[
                styles.container,
                // eslint-disable-next-line react-native/no-inline-styles
                {
                    backgroundColor: colors.card,
                    borderColor: colors.error,
                    borderWidth: 1.5,
                    opacity: 0.75,
                },
            ]}
            onPress={onPress}
            testID={
                testID ??
                `expired-doc-${documentName.replace(/\s+/g, "-").toLowerCase()}`
            }
            activeOpacity={0.8}
        >
            <View style={styles.iconContainer}>
                <FontAwesome6
                    name="calendar-xmark"
                    size={iconSize}
                    color={colors.error}
                    iconStyle="solid"
                />
            </View>
            <View
                style={[styles.textContainer, { shadowColor: colors.shadow }]}
            >
                <Text style={[styles.title, { color: colors.error }]}>
                    Documento Expirado
                </Text>
                <Text
                    style={[styles.documentName, { color: colors.text }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
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
        padding: 12,
        borderRadius: 12,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
        height: 90,
        marginHorizontal: 8,
        minWidth: 220,
    },
    iconContainer: {
        marginRight: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    textContainer: {
        marginLeft: 0,
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 2,
    },
    documentName: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 2,
    },
    date: {
        fontSize: 12,
        fontWeight: "500",
    },
})
