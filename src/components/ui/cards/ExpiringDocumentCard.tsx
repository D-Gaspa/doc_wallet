import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../hooks/useTheme"

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
    const iconSize = 36

    return (
        <TouchableOpacity
            style={[
                styles.container,
                // eslint-disable-next-line react-native/no-inline-styles
                {
                    backgroundColor: colors.card,
                    borderColor: colors.warning,
                    borderWidth: 1.5,
                },
            ]}
            onPress={onPress}
            testID={
                testID ??
                `expiring-doc-${documentName
                    .replace(/\s+/g, "-")
                    .toLowerCase()}`
            }
            activeOpacity={0.8}
        >
            <View style={styles.iconContainer}>
                <FontAwesome6
                    name="triangle-exclamation"
                    size={iconSize}
                    color={colors.warning}
                    iconStyle="solid"
                />
            </View>
            <View
                style={[styles.textContainer, { shadowColor: colors.shadow }]}
            >
                <Text style={[styles.title, { color: colors.warning }]}>
                    A Punto de Expirar
                </Text>
                <Text
                    style={[styles.documentName, { color: colors.primary }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {documentName}
                </Text>
                <Text style={[styles.date, { color: colors.secondaryText }]}>
                    Expira: {expirationDate}
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
        fontSize: 13,
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
