import React, { useState } from "react"
import { Image, StyleSheet, View } from "react-native"
import { Button } from "../../button"
import { useThemeContext } from "../../../../context/ThemeContext.tsx"
import { documentImport } from "../../../../services/document/import.ts"
import { types } from "@react-native-documents/picker"
import { useDocStore } from "../../../../store"
import { DocumentType, IDocument } from "../../../../types/document.ts"
import { AddDocumentDetailsSheet } from "./AddDocumentDetailsSheet.tsx"
import { LoadingOverlay } from "../../feedback/LoadingOverlay.tsx"
import { useTagContext } from "../../tag_functionality/TagContext.tsx"
import { useFolderStore } from "../../../../store/useFolderStore.ts"
import { Alert } from "../../feedback"
import DocumentScanner, {
    ResponseType,
} from "react-native-document-scanner-plugin"
import { generateUniqueId } from "../../../../utils"

export const DocumentsScreen = () => {
    const { colors } = useThemeContext()
    const [pendingDocument, setPendingDocument] = useState<IDocument | null>(
        null,
    )
    const [showAddSheet, setShowAddSheet] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const tagContext = useTagContext()
    const docStore = useDocStore()

    const folders = useFolderStore((state) => state.folders)
    const updateFolders = useFolderStore((state) => state.setFolders)
    const [toastVisible, setToastVisible] = useState(false)

    const [scannedImage] = useState(null)

    const handleMultipleScannedImages = async (imagePaths: string[]) => {
        try {
            const mainImageUri = imagePaths[0]

            // TODO: Create merged pdf file and then store it
            const newDocument: Partial<IDocument> = {
                title: `Multi-page Scan ${new Date().toLocaleDateString()}`,
                sourceUri: mainImageUri,
                metadata: {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    type: DocumentType.IMAGE,
                    mimeType: "image/jpeg",
                },
            }

            setPendingDocument(newDocument as IDocument)
            setShowAddSheet(true)
        } catch (error) {
            console.error("Error processing multiple images:", error)
        }
    }

    const handleScanDocument = async () => {
        try {
            const { scannedImages, status } =
                await DocumentScanner.scanDocument({
                    croppedImageQuality: 100,
                    maxNumDocuments: undefined,
                    responseType: ResponseType.ImageFilePath,
                })

            if (
                status == "success" &&
                scannedImages &&
                scannedImages.length > 0
            ) {
                console.debug("Scanned Document process: ", status)

                if (scannedImages.length === 1) {
                    const sourceUri = scannedImages[0]
                    const filename =
                        sourceUri.split("/").pop() ||
                        `Scan_${generateUniqueId()}.jpg`
                    const newDocument: Partial<IDocument> = {
                        title: filename,
                        sourceUri,
                        metadata: {
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            type: DocumentType.IMAGE,
                        },
                    }
                    setPendingDocument(newDocument as IDocument)
                    setShowAddSheet(true)
                } else {
                    console.debug("Scanned Set of Images", scannedImages)
                    await handleMultipleScannedImages(scannedImages)
                }
            }

            if (status == "cancel") {
                console.warn("Scanned Document process: ", status)
            }
        } catch (error) {
            console.error("Error scanning document:", error)
        }
    }

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
                const documentTitle = document.name || `Document_${Date.now()}`
                const uri = document.localUri || document.uri
                const type = document.type || DocumentType.UNKNOWN

                // Create a temporary document object to pass to the details sheet
                // We don't store it in docStore yet - only creating a temporary object
                const tempDocument: IDocument = {
                    id: Date.now().toString(), // Temporary ID, which will be replaced when actually saving
                    title: documentTitle,
                    sourceUri: uri,
                    tags: [],
                    metadata: {
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        type: type,
                    },
                }

                setPendingDocument(tempDocument)
                setShowAddSheet(true)
            }
        } catch (error) {
            console.error("Error selecting document:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveDocument = async (
        doc: IDocument,
        selectedFolderId: string,
        selectedTagIds: string[],
    ) => {
        setLoading(true)
        try {
            const tenDaysFromNow = new Date()
            tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10)
            // Store the document
            const storedDocument = await docStore.addDocument({
                title: doc.title,
                sourceUri: doc.sourceUri,
                tags: selectedTagIds,
                metadata: doc.metadata,
                parameters: [
                    {
                        id: `${Date.now()}`,
                        documentId: "temp", // if you don’t have an id yet
                        key: "expiration_date",
                        value: tenDaysFromNow.toISOString(),
                        type: "date",
                        isSearchable: true,
                        isSystem: true,
                    },
                ],
            })

            // Update folder association
            if (selectedFolderId) {
                const updatedFolders = folders.map((folder) =>
                    folder.id === selectedFolderId
                        ? {
                              ...folder,
                              documentIds: [
                                  ...new Set([
                                      ...(folder.documentIds || []),
                                      storedDocument.id,
                                  ]),
                              ],
                          }
                        : folder,
                )
                updateFolders(updatedFolders)
            }

            // Associate tags with the document in the persistent store
            if (selectedTagIds.length > 0) {
                tagContext.syncTagsForItem(
                    storedDocument.id,
                    "document",
                    selectedTagIds,
                )

                // Verify tags were associated (for debugging)
                console.log(
                    `Added tags for document ${storedDocument.id}:`,
                    tagContext
                        .getTagsForItem(storedDocument.id, "document")
                        .map((t) => t.name),
                )
            }

            setPendingDocument(null)
            console.log("Document added successfully:", storedDocument.id)
        } catch (error) {
            console.error("Error saving document:", error)
        } finally {
            setLoading(false)
            setToastVisible(true)
        }
    }

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {scannedImage ? (
                <Image resizeMode="contain" source={{ uri: scannedImage }} />
            ) : (
                <>
                    {/* Fake Scanner Frame / Placeholder */}
                    <View
                        style={[styles.frame, { borderColor: colors.border }]}
                    />
                </>
            )}
            <Button
                title="Escanear documento"
                onPress={handleScanDocument}
                style={styles.scanButton}
            />

            <Button
                title="Subir documento"
                onPress={handleAddSingleDocument}
                style={styles.uploadButton}
            />

            <AddDocumentDetailsSheet
                visible={showAddSheet}
                document={pendingDocument}
                onClose={() => {
                    setShowAddSheet(false)
                    setPendingDocument(null)
                }}
                onSave={(doc, folderId, tagIds) => {
                    setShowAddSheet(false)
                    handleSaveDocument(doc, folderId, tagIds).then((r) => r)
                }}
                folders={folders}
                setFolders={updateFolders} // Pass the global updater function
            />
            <LoadingOverlay visible={isLoading} />
            <Alert
                type={"success"}
                message={"Document was successfully saved"}
                visible={toastVisible}
                onClose={() => setToastVisible(false)}
            />
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
    scanButton: {
        position: "absolute",
        bottom: 180,
        width: 220,
        alignSelf: "center",
    },
})
