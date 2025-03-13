import React from "react"
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native"
import { useThemeContext } from "../../../context/ThemeContext"
import ArrowIcon from "../assets/svg/Arrow 1.svg"

export interface DocumentCardProps {
    title: string
    image: number
    onPress: () => void
    testID?: string
}

export function DocumentCard({
    title,
    image,
    onPress,
    testID,
}: DocumentCardProps) {
    const { colors } = useThemeContext()

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    borderBottomColor: colors.secondaryText,
                    shadowColor: colors.shadow,
                },
            ]}
            onPress={onPress}
            testID={testID}
        >
            <Image source={image} style={styles.image} />

            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {title}
                </Text>
                <View style={styles.viewContainer}>
                    <Text style={[styles.viewText, { color: colors.primary }]}>
                        Visualizar documento
                    </Text>
                    <ArrowIcon width={16} height={16} stroke={colors.primary} />
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        marginHorizontal: 5,
        borderBottomWidth: 1,
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 5,
        marginRight: 15,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
    },
    viewContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
    },
    viewText: {
        fontSize: 16,
        marginRight: 5,
    },
})
