import { Alert } from "react-native"
import { IDocument } from "../../../../types/document"
import { useDocStore } from "../../../../store"

export const showDocumentOptions = (document: IDocument) => {
    Alert.alert(document.title ?? "Document Options", "Choose an action", [
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
