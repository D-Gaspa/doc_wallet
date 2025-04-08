import React, { useEffect, useState } from "react"
import { View, StyleSheet, Text } from "react-native"
import { useThemeContext } from "../../../context/ThemeContext.tsx"
import { DocumentCardCarousel } from "../cards"
import { useAlertStore } from "../../../store/useAlertStore.ts"
import { IDocument } from "../../../types/document.ts"

export function ProfileScreen() {
    const { colors } = useThemeContext()
    const getExpiringDocuments = useAlertStore((s) => s.getExpiringDocuments)
    const [expiringDocs, setExpiringDocs] = useState<IDocument[]>([])

    useEffect(() => {
        const docs = getExpiringDocuments()
        setExpiringDocs(docs)
    }, [getExpiringDocuments]) // re-run only if the function ref changes

    const handleCardPress = (title: string) => {
        console.log("Open document:", title)
    }

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Text style={styles.header}>Tu perfil</Text>

            {expiringDocs.length > 0 && (
                <DocumentCardCarousel
                    documents={expiringDocs.map((doc) => ({
                        type: "expiring",
                        title: doc.title ?? "Sin título",
                        expirationDate:
                            doc.parameters?.find(
                                (p) => p.key === "expiration_date",
                            )?.value ?? "Sin fecha",
                    }))}
                    onPress={handleCardPress}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
})
