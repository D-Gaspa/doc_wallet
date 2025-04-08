import React from "react"
import { FlatList, StyleSheet } from "react-native"
import { ExpiringDocumentCard } from "./ExpiringDocumentCard"
import { FavoriteDocumentCard } from "./FavoriteDocuementCard"

export interface DocumentItem {
    type: "favorite" | "expiring"
    title: string
    image?: number // Only for favorite documents
    expirationDate?: string // Only for expiring documents
}

export interface DocumentCarouselProps {
    documents: DocumentItem[]
    onPress: (title: string) => void
}

export function DocumentCardCarousel({
    documents,
    onPress,
}: DocumentCarouselProps) {
    return (
        <FlatList
            data={documents}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.title}
            renderItem={({ item }) => {
                if (item.type === "favorite") {
                    return (
                        <FavoriteDocumentCard
                            title={item.title}
                            image={item.image!}
                            onPress={() => onPress(item.title)}
                        />
                    )
                } else if (item.type === "expiring") {
                    return (
                        <ExpiringDocumentCard
                            documentName={item.title}
                            expirationDate={item.expirationDate!}
                            onPress={() => onPress(item.title)}
                        />
                    )
                }
                return null
            }}
            contentContainerStyle={styles.container}
        />
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginBottom: 20,
        marginTop: 10,
    },
})
