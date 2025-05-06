import { Alert as RNAlert } from "react-native"
import { useCallback } from "react"
import { IDocument } from "../../../../types/document"
import { useDocStore } from "../../../../store"
import { useFavoriteDocumentsStore } from "../../../../store/useFavoriteDocumentsStore.ts"
import { LoggingService } from "../../../../services/monitoring/loggingService.ts"
// import Share from 'react-native-share';

const logger = LoggingService.getLogger("useDocumentOperations")

export const useDocumentOperations = () => {
    const { addFavorite, removeFavorite, isFavorite } =
        useFavoriteDocumentsStore()
    const { deleteDocument } = useDocStore()

    const handleToggleFavorite = useCallback(
        (documentId: string) => {
            try {
                const currentlyFavorite = isFavorite(documentId)
                if (currentlyFavorite) {
                    removeFavorite(documentId)
                    logger.debug("Removed document from favorites", {
                        documentId,
                    })
                } else {
                    addFavorite(documentId)
                    logger.debug("Added document to favorites", { documentId })
                }
            } catch (error) {
                logger.error("Failed to toggle favorite status", {
                    documentId,
                    error,
                })
                RNAlert.alert("Error", "Could not update favorite status.")
            }
        },
        [addFavorite, removeFavorite, isFavorite],
    )

    const handleDeleteDocument = useCallback(
        (document: IDocument) => {
            RNAlert.alert(
                `Delete "${document.title || "Document"}"`,
                "Are you sure you want to delete this document? This action cannot be undone.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                logger.info(
                                    `User initiated delete for document`,
                                    { documentId: document.id },
                                )
                                await deleteDocument(document.id)
                                logger.info(`Document deleted successfully`, {
                                    documentId: document.id,
                                })
                            } catch (error) {
                                logger.error("Failed to delete document", {
                                    documentId: document.id,
                                    error,
                                })
                                RNAlert.alert(
                                    "Error",
                                    "Failed to delete the document. Please try again.",
                                )
                            }
                        },
                    },
                ],
            )
        },
        [deleteDocument],
    )

    const handleShareDocument = useCallback(async (document: IDocument) => {
        logger.debug("Sharing document", { documentId: document.id })
        try {
            // TODO: Implement sharing functionality
            // const shareOptions = {
            //     title: document.title || 'Share Document',
            //     message: `Check out this document: ${document.title}`,
            //     url: document.sourceUri,
            //     type: document.metadata?.mimeType,
            // };
            // await Share.open(shareOptions);

            // Placeholder Alert:
            RNAlert.alert(
                "Share",
                `Sharing functionality for "${
                    document.title || "Document"
                }" is not yet implemented.`,
            )
        } catch (error) {
            logger.error("Failed to share document", {
                documentId: document.id,
                error,
            })
            RNAlert.alert("Error", "Could not share the document.")
        }
    }, [])

    return {
        handleToggleFavorite,
        handleDeleteDocument,
        handleShareDocument,
        isFavorite,
    }
}
