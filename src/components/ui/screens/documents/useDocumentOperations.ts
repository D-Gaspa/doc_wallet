import { Alert } from "react-native"
import { IDocument } from "../../../../types/document"
import { useDocStore } from "../../../../store"
import { useFavoriteDocumentsStore } from "../../../../store/useFavoriteDocumentsStore.ts"

export const showDocumentOptions = (document: IDocument) => {
    const { addFavorite, removeFavorite, isFavorite } =
        useFavoriteDocumentsStore.getState()
    const isCurrentlyFavorite = isFavorite(document.id)

    Alert.alert(document.title ?? "Document Options", "Choose an action", [
        {
            text: isCurrentlyFavorite
                ? "Remove from Favorites"
                : "Add to Favorites",
            onPress: () => {
                if (isCurrentlyFavorite) {
                    removeFavorite(document.id)
                    console.log("Removed from favorites")
                } else {
                    addFavorite(document.id)
                    console.log("Added to favorites")
                }
            },
        },
        {
            text: "Share",
            onPress: () => {
                // Placeholder for share logic
                console.log("Share document")
            },
        },
        {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
                try {
                    await useDocStore.getState().deleteDocument(document.id)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    Alert.alert("Error", "Failed to delete document.")
                }
            },
        },
        {
            text: "Cancel",
            style: "cancel",
        },
    ])
}
