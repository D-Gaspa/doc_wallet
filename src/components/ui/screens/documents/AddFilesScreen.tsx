import React, { useState } from "react"
import { StyleSheet, View } from "react-native"
import { Button } from "../../button"
import { useThemeContext } from "../../../../context/ThemeContext.tsx"
import { useFolderStore } from "../../../../store/useFolderStore.ts"
import { useDocStore } from "../../../../store"
import { documentImport } from "../../../../services/document/import.ts"
import { documentPreview } from "../../../../services/document/preview.ts"
import { documentStorage } from "../../../../services/document/storage.ts"
import { types } from "@react-native-documents/picker"
import { DocumentType } from "../../../../types/document.ts"
import { DocumentDetailsSheet } from "./DocumentDetailsSheet.tsx"
import { useTagContext } from "../../tag_functionality/TagContext.tsx"
import { LoadingOverlay } from "../../feedback/LoadingOverlay.tsx"

export const AddFileScreen = () => {
    const { colors } = useThemeContext()
    const { folders, setFolders } = useFolderStore()
    const docStore = useDocStore((s) => s)
    const tagContext = useTagContext()

    const [showAddSheet, setShowAddSheet] = useState(false)
    const [isLoading, setLoading] = useState(false)

    const handleAddDocumentFlow = async ({
        selectedFolderId,
        selectedTagIds,
    }: {
        selectedFolderId: string
        selectedTagIds: string[]
    }) => {
        setLoading(true)
        try {
            const importedDocs = await documentImport.importDocument({
                allowMultiple: false,
                fileTypes: [types.pdf, types.images, types.docx],
                allowVirtualFiles: true,
            })

            if (importedDocs.length === 0) return

            const file = importedDocs[0]
            const uri = file.localUri || file.uri
            const type = file.type || DocumentType.UNKNOWN
            const title = file.name || `Document_${Date.now()}`

            // Save document to store
            const storedDoc = await docStore.addDocument({
                title,
                sourceUri: uri,
                tags: selectedTagIds,
                metadata: {
                    createdAt: Date.now().toString(),
                    updatedAt: Date.now().toString(),
                    type,
                },
            })

            // Link document to folder
            const updatedFolders = folders.map((folder) =>
                folder.id === selectedFolderId
                    ? {
                          ...folder,
                          documentIds: [
                              ...new Set([
                                  ...(folder.documentIds || []),
                                  storedDoc.id,
                              ]),
                          ],
                      }
                    : folder,
            )
            setFolders(updatedFolders)

            // Associate tags
            selectedTagIds.forEach((tagId) => {
                const tag = tagContext.tags.find((t) => t.id === tagId)
                if (tag) {
                    tagContext.associateTag(
                        tagId,
                        storedDoc.id,
                        "document",
                        tag,
                    )
                }
            })
            tagContext.syncTagsForItem(storedDoc.id, "document", selectedTagIds)

            // Optional preview generation
            await new Promise((res) => setTimeout(res, 200))
            const preview = await docStore.getDocumentPreview(storedDoc.id)
            if (preview?.sourceUri) {
                const mime = documentPreview.getMimeTypeForDocumentType(
                    preview.metadata?.type ?? DocumentType.PDF,
                )

                await documentPreview.viewDocumentByUri(
                    preview.sourceUri,
                    mime,
                    async () => {
                        const storage = await documentStorage
                        await storage.deletePreviewFile(preview.sourceUri)
                    },
                )
            }
        } catch (err) {
            console.error("❌ Error adding document:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View style={[styles.frame, { borderColor: colors.border }]} />

            <Button
                title="Subir documento"
                onPress={() => setShowAddSheet(true)}
                style={styles.uploadButton}
            />

            <DocumentDetailsSheet
                visible={showAddSheet}
                onClose={() => setShowAddSheet(false)}
                onComplete={(data) => {
                    setShowAddSheet(false)
                    handleAddDocumentFlow(data)
                    setShowAddSheet(false)
                }}
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
        bottom: 120,
        width: 220,
        alignSelf: "center",
    },
})
