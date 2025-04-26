import React from "react"
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"

export interface FavoriteDocumentCardProps {
    title: string
    image: number
    onPress: () => void
    testID?: string
}

export function FavoriteDocumentCard({
    title,
    image,
    onPress,
    testID,
}: FavoriteDocumentCardProps) {
    const { colors } = useTheme()

    return (
        <TouchableOpacity
            style={styles.shadowContainer}
            onPress={onPress}
            testID={testID}
        >
            <View style={[styles.container, { shadowColor: colors.shadow }]}>
                <Image source={image} style={styles.image} />
                <View
                    style={[
                        styles.overlay,
                        { backgroundColor: colors.background + "99" },
                    ]}
                />
                <Text style={[styles.title, { color: colors.text }]}>
                    {title}
                </Text>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    shadowContainer: {
        width: 200,
        height: 130,
        marginHorizontal: 5,

        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 3,
    },
    container: {
        flex: 1,
        borderRadius: 20,
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
        borderRadius: 20,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    title: {
        position: "absolute",
        bottom: 10,
        left: 10,
        fontSize: 14,
        fontWeight: "bold",
    },
})
