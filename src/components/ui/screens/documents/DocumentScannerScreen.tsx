import React, { useCallback, useState } from "react"
import { StyleSheet, View } from "react-native"
import { useDocStore } from "../../../../store"
import { DocumentType, IDocument } from "../../../../types/document"
import { AddDocumentDetailsSheet } from "./AddDocumentDetailsSheet"
import { LoadingOverlay } from "../../feedback/LoadingOverlay"
import { useTagContext } from "../../tag_functionality/TagContext"
import { useFolderStore } from "../../../../store/useFolderStore"
import { Alert } from "../../feedback"
import { useTheme } from "../../../../hooks/useTheme"
import DocumentScanner, {
    ResponseType,
} from "react-native-document-scanner-plugin"
import { generateUniqueId } from "../../../../utils"
import {
    NavigationProp,
    useFocusEffect,
    useNavigation,
} from "@react-navigation/native"
import { TabParamList } from "../../../../App"

interface DocumentScannerScreenProps {
    navigation: NavigationProp<TabParamList, "Files">
    route: undefined
    setActiveTab: (tab: keyof TabParamList) => void
}

/**
 * DocumentScannerScreen Component
 *
 * Initiates a document scan upon focus, allows adding details, saves the document,
 * and navigates back to the Home tab.
 */
export const DocumentScannerScreen = ({
    setActiveTab,
}: DocumentScannerScreenProps) => {
    const { colors } = useTheme()
    const navigation = useNavigation<NavigationProp<TabParamList>>()
    const tagContext = useTagContext()
    const docStore = useDocStore()
    const updateFolders = useFolderStore((state) => state.setFolders)

    const [pendingDocument, setPendingDocument] = useState<IDocument | null>(
        null,
    )
    const [showAddSheet, setShowAddSheet] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const [toastVisible, setToastVisible] = useState(false)
    const [scanAttemptedThisFocus, setScanAttemptedThisFocus] = useState(false)

    /** Navigates the user back to the 'Home' tab. */
    const navigateHome = useCallback(() => {
        console.log("Navigating to Home...")
        setActiveTab("Home")
        navigation.navigate("Home")
    }, [navigation, setActiveTab])

    /** Initiates the document scanning process. */
    const handleScanDocument = useCallback(async () => {
        if (isLoading || showAddSheet) {
            console.log("Scan prevented: Already busy.")
            return
        }

        console.log("Starting scan...")
        setLoading(true)
        setScanAttemptedThisFocus(true)

        try {
            const { scannedImages, status } =
                await DocumentScanner.scanDocument({
                    croppedImageQuality: 100,
                    maxNumDocuments: 1,
                    responseType: ResponseType.ImageFilePath,
                })

            if (
                status === "success" &&
                scannedImages &&
                scannedImages.length > 0
            ) {
                console.log("Scan successful.")
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
            } else if (status === "cancel") {
                console.warn("Scan cancelled by user.")
                setLoading(false)
                setScanAttemptedThisFocus(false)
                navigateHome()
            } else {
                console.warn("Scan status not 'success' or 'cancel':", status)
                setScanAttemptedThisFocus(false)
                setLoading(false)
                navigateHome()
            }
        } catch (error) {
            console.error("Error scanning document:", error)
            setScanAttemptedThisFocus(false)
            setLoading(false)
            navigateHome()
        }
    }, [isLoading, showAddSheet, navigateHome])

    /** Saves the document with details from the sheet. */
    const handleSaveDocument = useCallback(
        async (
            doc: IDocument,
            selectedFolderId: string | null,
            selectedTagIds: string[],
        ) => {
            setLoading(true)
            setShowAddSheet(false)
            let success = false

            try {
                const storedDocument = await docStore.addDocument({
                    title: doc.title,
                    sourceUri: doc.sourceUri,
                    tags: selectedTagIds,
                    metadata: doc.metadata,
                    parameters: doc.parameters ?? [],
                })
                console.log("Document added successfully:", storedDocument.id)

                if (selectedFolderId && selectedFolderId !== "root") {
                    const currentFolders = useFolderStore.getState().folders
                    const updatedFolders = currentFolders.map((folder) =>
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
                    console.log(`Folder ${selectedFolderId} updated.`)
                }

                if (selectedTagIds.length > 0) {
                    tagContext.syncTagsForItem(
                        storedDocument.id,
                        "document",
                        selectedTagIds,
                    )
                    console.log(`Tags synced for ${storedDocument.id}`)
                }

                setPendingDocument(null)
                success = true
            } catch (error) {
                console.error("Error saving document:", error)
                success = false
            } finally {
                if (success) {
                    console.log("Save successful, showing toast...")
                    setToastVisible(true)
                    setTimeout(() => {
                        setLoading(false)
                        navigateHome()
                    }, 700)
                } else {
                    setLoading(false)
                    navigateHome()
                }
            }
        },
        [docStore, updateFolders, tagContext, navigateHome],
    )

    /** Handles closing the details sheet without saving. */
    const handleCloseSheet = useCallback(() => {
        console.log("Closing sheet without saving.")
        setShowAddSheet(false)
        setPendingDocument(null)
        setLoading(false)
        navigateHome()
    }, [navigateHome])

    /** Triggers scan automatically when the screen comes into focus, but only once per focus session. */
    useFocusEffect(
        useCallback(() => {
            console.log("DocumentScannerScreen focused")
            if (!scanAttemptedThisFocus && !isLoading && !showAddSheet) {
                console.log("Attempting auto-scan on focus...")
                handleScanDocument().then((r) => r)
            } else {
                console.log("Auto-scan skipped:", {
                    scanAttemptedThisFocus,
                    isLoading,
                    showAddSheet,
                })
            }

            return () => {
                console.log(
                    "DocumentScannerScreen blurred/unmounted - Resetting scan flag",
                )
                setScanAttemptedThisFocus(false)
            }
        }, [
            scanAttemptedThisFocus,
            isLoading,
            showAddSheet,
            handleScanDocument,
        ]),
    )

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <AddDocumentDetailsSheet
                visible={showAddSheet}
                document={pendingDocument}
                onClose={handleCloseSheet}
                onSave={(doc, folderId, tagIds) => {
                    if (doc) {
                        handleSaveDocument(doc, folderId, tagIds).then((r) => r)
                    } else {
                        console.error(
                            "Attempted to save with null document data.",
                        )
                        handleCloseSheet()
                    }
                }}
            />

            {/* Loading Overlay */}
            <LoadingOverlay visible={isLoading} />

            {/* Success Toast */}
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
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
})
