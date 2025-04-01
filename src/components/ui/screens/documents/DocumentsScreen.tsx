import React, { useState } from "react"
import { View, StyleSheet } from "react-native"
import { Button } from "../../button"
import { useThemeContext } from "../../../../context/ThemeContext.tsx"
import { documentImport } from "../../../../services/document/import.ts"
import { types } from "@react-native-documents/picker"
import { documentPreview } from "../../../../services/document/preview.ts"
import { useDocStore } from "../../../../store"
import { documentStorage } from "../../../../services/document/storage.ts"
import { DocumentType, IDocument } from "../../../../types/document.ts"
import { AddDocumentDetailsSheet } from "./AddDocumentDetailsSheet.tsx"
import { Folder } from "../folders/types.ts"
import { LoadingOverlay } from "../../feedback/LoadingOverlay.tsx"
import { useTagContext } from "../../tag_functionality/TagContext.tsx"

export const DocumentsScreen = () => {
    const { colors } = useThemeContext()
    const [pendingDocument, setPendingDocument] = useState<IDocument | null>(
        null,
    )
    const [showAddSheet, setShowAddSheet] = useState(false)
    const [folders, setFolders] = useState<Folder[]>([])
    const [isLoading, setLoading] = useState(false)
    const tagContext = useTagContext()

    const handleAddSingleDocument = async () => {
        setLoading(true)
        try {
            const importedDocuments = await documentImport.importDocument({
                allowMultiple: false,
                fileTypes: [types.pdf, types.images, types.docx],
                allowVirtualFiles: true,
            })

            // Check if any documents were selected (user might cancel import)
            if (importedDocuments.length > 0) {
                const document = importedDocuments[0]

                const documentTitle = document.name || "Document_${Date.now()}"
                const uri = document.localUri || document.uri
                const type = document.type || DocumentType.UNKNOWN

                const docStore = useDocStore.getState()

                // Add logging to debug the URI values
                console.log("Adding document with URI: ${uri")

                const storedDocument = await docStore.addDocument({
                    title: documentTitle,
                    sourceUri: uri,
                    tags: [],
                    metadata: {
                        createdAt: Date.now().toString(),
                        updatedAt: Date.now().toString(),
                        type: type,
                    },
                })

                console.log("Document stored successfully:", storedDocument)

                docStore.selectDocument(storedDocument.id)

                // Give a short delay to ensure encryption is complete
                await new Promise((resolve) => setTimeout(resolve, 200))

                const previewResult = await docStore.getDocumentPreview(
                    storedDocument.id,
                )

                if (!previewResult) {
                    console.error("Failed to get document preview")
                    throw new Error("Document preview could not be generated")
                }

                console.log("Preview URI: ${previewResult.sourceUri}")
                console.log("Document type: ${previewResult.metadata.type}")

                setPendingDocument({
                    ...storedDocument,
                    sourceUri: previewResult.sourceUri, // use preview URI
                })

                setShowAddSheet(true)

                // Determine the MIME type from the document type
                let mimeType: string | undefined
                if (previewResult.metadata.type === DocumentType.PDF) {
                    mimeType = "application/pdf"
                } else if (previewResult.metadata.type === DocumentType.IMAGE) {
                    mimeType = "image/jpeg"
                } else if (
                    previewResult.metadata.type === DocumentType.IMAGE_PNG
                ) {
                    mimeType = "image/png"
                }

                // View the document using the preview URI
                await documentPreview.viewDocumentByUri(
                    previewResult.sourceUri,
                    mimeType,
                    async () => {
                        // Clean up after viewing
                        const storage = await documentStorage
                        await storage.deletePreviewFile(previewResult.sourceUri)
                        console.log("Preview file cleaned up after viewing")
                    },
                )
            }
        } catch (error) {
            console.error("Error handling document:", error)
            // Show an error message to the user
            // You might want to add a Toast or Alert here
        } finally {
            setLoading(false)
        }
    }
    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {/* Fake Scanner Frame / Placeholder */}
            <View style={[styles.frame, { borderColor: colors.border }]} />

            <Button
                title="Subir documento"
                onPress={handleAddSingleDocument}
                style={styles.uploadButton}
            />

            <AddDocumentDetailsSheet
                visible={showAddSheet}
                document={pendingDocument}
                onClose={() => setShowAddSheet(false)}
                onSave={async (doc) => {
                    setShowAddSheet(false)
                    setLoading(true)

                    // Delay 100ms to let tag associations register
                    setTimeout(() => {
                        const hydratedTags = tagContext.getTagsForItem(
                            doc.id,
                            "document",
                        )
                        console.log(
                            "✅ Hydrated tags after tagging:",
                            hydratedTags,
                        )

                        setPendingDocument({
                            ...doc,
                            tags: hydratedTags.map((tag) => tag.id),
                        })

                        setLoading(false)
                    }, 100)
                }}
                folders={folders}
                setFolders={setFolders}
            />
            <LoadingOverlay visible={isLoading} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    frame: {
        width: 250,
        height: 250,
        borderWidth: 3,
        borderRadius: 16,
        borderStyle: "dashed",
        marginBottom: 32,
    },
    uploadButton: {
        position: "absolute",
        bottom: 120, // push it above the tab bar
        width: 220,
        alignSelf: "center",
    },
})
