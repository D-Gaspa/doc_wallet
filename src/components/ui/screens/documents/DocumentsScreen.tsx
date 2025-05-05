import React, { useState, useCallback } from "react" // Step 1: Import useEffect
import { StyleSheet, View } from "react-native"
import { Button } from "../../button"
import { documentImport } from "../../../../services/document/import.ts"
import { types } from "@react-native-documents/picker"
import { useDocStore } from "../../../../store"
import { DocumentType, IDocument } from "../../../../types/document.ts"
import { AddDocumentDetailsSheet } from "./AddDocumentDetailsSheet.tsx"
import { LoadingOverlay } from "../../feedback/LoadingOverlay.tsx"
import { useTagContext } from "../../tag_functionality/TagContext.tsx"
import { useFolderStore } from "../../../../store/useFolderStore.ts"
import { Alert } from "../../feedback"
import { useTheme } from "../../../../hooks/useTheme.ts"
import DocumentScanner, {
    ResponseType,
} from "react-native-document-scanner-plugin"
import { generateUniqueId } from "../../../../utils"
import { useFocusEffect } from "@react-navigation/native"

export const DocumentsScreen = () => {
    const { colors } = useTheme()
    const [pendingDocument, setPendingDocument] = useState<IDocument | null>(
        null,
    )
    const [showAddSheet, setShowAddSheet] = useState(false)
    const [isLoading, setLoading] = useState(false) // Use this for feedback
    const tagContext = useTagContext()
    const docStore = useDocStore()

    const folders = useFolderStore((state) => state.folders)
    const updateFolders = useFolderStore((state) => state.setFolders)
    const [toastVisible, setToastVisible] = useState(false)

    // Removed isScanning and duplicate scannedImage state

    const handleMultipleScannedImages = async (imagePaths: string[]) => {
        // Keep existing logic, but ensure setLoading(false) if an error occurs
        try {
            const mainImageUri = imagePaths[0]
            const newDocument: Partial<IDocument> = {
                title: `Multi-page Scan ${new Date().toLocaleDateString()}`,
                sourceUri: mainImageUri,
                metadata: {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    type: DocumentType.IMAGE,
                    mimeType: "image/jpeg", // Assuming JPEG
                },
            }
            setPendingDocument(newDocument as IDocument)
            setShowAddSheet(true)
            // setLoading(false); // Might not need here if sheet takes over
        } catch (error) {
            console.error("Error processing multiple images:", error)
            setLoading(false) // Stop loading on error
        }
    }

    const handleScanDocument = async () => {
        setLoading(true) // Start loading when scan begins
        try {
            const { scannedImages, status } =
                await DocumentScanner.scanDocument({
                    croppedImageQuality: 100,
                    maxNumDocuments: undefined, // Allows multiple pages if supported
                    responseType: ResponseType.ImageFilePath,
                })

            if (
                status === "success" &&
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
                            type: DocumentType.IMAGE, // Adjust if scanner provides type
                            // mimeType might be available or inferable
                        },
                    }
                    setPendingDocument(newDocument as IDocument)
                    setShowAddSheet(true)
                    // setLoading(false); // Let the sheet handle loading state for saving
                } else {
                    console.debug("Scanned Set of Images", scannedImages)
                    await handleMultipleScannedImages(scannedImages)
                }
            } else if (status === "cancel") {
                console.warn("Scanned Document process: ", status)
                setLoading(false) // Stop loading if user cancels
                // Optionally navigate back or show a message
            } else {
                // Handle other statuses or unexpected results
                console.warn("Scan status not 'success' or 'cancel':", status)
                setLoading(false)
            }
        } catch (error) {
            console.error("Error scanning document:", error)
            setLoading(false) // Stop loading on error
        }
        // Note: setLoading(false) is handled within sheet logic or on cancel/error.
    }

    useFocusEffect(
        useCallback(() => {
            console.log("DocumentsScreen focused") // Add a log
            handleScanDocument()

            return () => {
                console.log("DocumentsScreen blurred or unmounted")
                // If necessary, add cleanup logic here.
                // For instance, if you needed to explicitly cancel the scanner
                // or reset some state when navigating away *during* a scan.
                // Often, for scanners presenting native UI, this might not be needed
                // as navigating away might implicitly cancel it.
            }
        }, []),
    )

    const handleAddSingleDocument = async () => {
        setLoading(true)
        try {
            // ... (rest of the import logic remains the same)
            const importedDocuments = await documentImport.importDocument({
                allowMultiple: false,
                fileTypes: [types.pdf, types.images, types.docx],
                allowVirtualFiles: true,
            })

            if (importedDocuments.length > 0) {
                const document = importedDocuments[0]
                const documentTitle = document.name || `Document_${Date.now()}`
                const uri = document.localUri || document.uri
                const type = document.type || DocumentType.UNKNOWN

                const tempDocument: IDocument = {
                    id: Date.now().toString(),
                    title: documentTitle,
                    sourceUri: uri,
                    tags: [],
                    metadata: {
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        type: type as DocumentType, // Ensure type matches enum
                    },
                }

                setPendingDocument(tempDocument)
                setShowAddSheet(true)
            } else {
                // Handle case where user cancelled the picker
                setLoading(false)
            }
        } catch (error) {
            console.error("Error selecting document:", error)
            setLoading(false)
        }
        // setLoading(false); // Let the sheet handle loading state
    }

    const handleSaveDocument = async (
        doc: IDocument,
        selectedFolderId: string,
        selectedTagIds: string[],
    ) => {
        setLoading(true) // Show loading during save
        try {
            // ... (rest of the save logic remains the same)
            const storedDocument = await docStore.addDocument({
                title: doc.title,
                sourceUri: doc.sourceUri,
                tags: selectedTagIds,
                metadata: doc.metadata,
                parameters: doc.parameters ?? [],
            })

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

            if (selectedTagIds.length > 0) {
                tagContext.syncTagsForItem(
                    storedDocument.id,
                    "document",
                    selectedTagIds,
                )
                console.log(
                    `Added tags for document ${storedDocument.id}:`,
                    tagContext
                        .getTagsForItem(storedDocument.id, "document")
                        .map((t) => t.name),
                )
            }

            setPendingDocument(null) // Clear pending doc after successful save
            console.log("Document added successfully:", storedDocument.id)
            setToastVisible(true) // Show success toast
        } catch (error) {
            console.error("Error saving document:", error)
            // Optionally show an error toast/alert here
        } finally {
            setLoading(false) // Hide loading indicator
            // Keep setShowAddSheet(false) in the AddDocumentDetailsSheet's onClose/onSave handlers
        }
    }

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {/* Step 3: Adjust UI - Remove Scan button and conditional rendering based on isScanning */}
            {/* You might want a placeholder or initial view while the scanner loads */}
            <View style={[styles.frame, { borderColor: colors.border }]} />

            {/* Keep the Upload Button */}
            <Button
                // Use English title
                title="Upload Document"
                onPress={handleAddSingleDocument}
                style={styles.uploadButton}
                // Disable button while loading/scanning to prevent conflicts
                disabled={isLoading}
            />

            {/* The AddDocumentDetailsSheet remains the same */}
            <AddDocumentDetailsSheet
                visible={showAddSheet}
                document={pendingDocument}
                onClose={() => {
                    setShowAddSheet(false)
                    setPendingDocument(null)
                    // Decide if you need to do anything else if the sheet is closed without saving
                    // e.g., navigate back or prompt again?
                }}
                onSave={(doc, folderId, tagIds) => {
                    setShowAddSheet(false) // Close sheet first
                    handleSaveDocument(doc, folderId, tagIds) // Then save
                }}
                folders={folders}
                setFolders={updateFolders}
            />

            {/* Loading overlay covers the screen during scan and save */}
            <LoadingOverlay visible={isLoading} />

            {/* Success Toast remains the same */}
            <Alert
                type={"success"}
                message={"Document was successfully saved"}
                visible={toastVisible}
                onClose={() => setToastVisible(false)}
            />
        </View>
    )
}

// Styles remain the same, but remove scanButton style if it exists
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
        bottom: 120, // Adjust as needed
        width: 220,
        alignSelf: "center",
    },
    // Remove scanButton style if it was here
    /*
    scanButton: {
        // ... removed ...
    },
    */
})
