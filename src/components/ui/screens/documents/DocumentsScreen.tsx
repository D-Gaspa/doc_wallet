// DocumentsScreen.tsx

import React, { useCallback, useState } from "react"
import { StyleSheet, View } from "react-native"
import { useDocStore } from "../../../../store"
import {
    DocumentType,
    IDocument,
    IDocumentParameters,
} from "../../../../types/document"
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
    useNavigation,
    NavigationProp,
    useFocusEffect,
} from "@react-navigation/native"
import { TabParamList } from "../../../../App"

interface CommonDetails {
    folderId: string
    tagIds: string[]
    expirationDate?: string
    notificationTimes?: number[]
}

interface DocumentsScreenProps {
    navigation: NavigationProp<TabParamList, "Files">
    route: undefined
    setActiveTab: (tab: keyof TabParamList) => void
}

export const DocumentsScreen = ({ setActiveTab }: DocumentsScreenProps) => {
    const { colors } = useTheme()
    const navigation = useNavigation<NavigationProp<TabParamList>>()
    const [pendingScanURIs, setPendingScanURIs] = useState<string[] | null>(
        null,
    )
    const [showAddSheet, setShowAddSheet] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const tagContext = useTagContext()
    const docStore = useDocStore()
    const folders = useFolderStore((state) => state.folders)
    const updateFolders = useFolderStore((state) => state.setFolders)
    const [toastVisible, setToastVisible] = useState(false)
    const [scanAttemptedThisFocus, setScanAttemptedThisFocus] = useState(false)

    const navigateHome = useCallback(() => {
        console.log("Navigating to Home...")
        setActiveTab("Home")
        setPendingScanURIs(null)
        setShowAddSheet(false)
        setScanAttemptedThisFocus(false)
        setLoading(false)
        navigation.navigate("Home")
    }, [navigation, setActiveTab])

    const handleScanDocument = useCallback(async () => {
        if (isLoading || showAddSheet) {
            console.log("Scan prevented: Already busy.")
            return
        }
        console.log("Starting multi-document scan...")
        setLoading(true)
        setScanAttemptedThisFocus(true)
        try {
            const { scannedImages, status } =
                await DocumentScanner.scanDocument({
                    croppedImageQuality: 100,
                    maxNumDocuments: 10,
                    responseType: ResponseType.ImageFilePath,
                })

            if (
                status === "success" &&
                scannedImages &&
                scannedImages.length > 0
            ) {
                console.log(
                    `Scan successful with ${scannedImages.length} images.`,
                )
                setPendingScanURIs(scannedImages)
                setShowAddSheet(true) // Open sheet to collect common details
            } else if (status === "cancel") {
                console.warn("Scan cancelled by user.")
                setPendingScanURIs(null)
                setLoading(false)
                setScanAttemptedThisFocus(false)
                navigateHome()
            } else {
                console.warn(
                    `Scan status not 'success' or 'cancel' (${status}), or no images scanned.`,
                )
                setPendingScanURIs(null)
                setLoading(false)
                setScanAttemptedThisFocus(false)
                navigateHome()
            }
        } catch (error) {
            console.error("Error scanning document:", error)
            setPendingScanURIs(null)
            setLoading(false)
            setScanAttemptedThisFocus(false)
            // Optionally navigate home
            navigateHome()
        }
    }, [isLoading, showAddSheet, navigateHome])

    const handleSaveMultipleDocuments = useCallback(
        async (details: CommonDetails) => {
            const uris = pendingScanURIs
            if (!uris || uris.length === 0) {
                console.error("Save attempted with no pending scan URIs.")
                setShowAddSheet(false)
                setLoading(false)
                navigateHome()
                return
            }

            console.log(
                `Attempting to save ${uris.length} documents with common details.`,
            )
            setLoading(true)
            setShowAddSheet(false)
            let success = false
            const newDocumentIds: string[] = []
            try {
                for (const uri of uris) {
                    const filename =
                        uri.split("/").pop() || `Scan_${generateUniqueId()}.jpg`
                    const newDocId = generateUniqueId()

                    const parameters: IDocumentParameters[] = []
                    if (details.expirationDate) {
                        parameters.push({
                            key: "expiration_date",
                            value: details.expirationDate,
                            id: "expiration_date_" + newDocId,
                            documentId: newDocId,
                            type: "date",
                            isSearchable: true,
                            isSystem: true,
                        })
                        if (
                            details.notificationTimes &&
                            details.notificationTimes.length > 0
                        ) {
                            parameters.push({
                                key: "expiration_notifications",
                                value: JSON.stringify(
                                    details.notificationTimes,
                                ),
                                id: "expiration_notifications_" + newDocId, // Unique ID
                                documentId: newDocId,
                                type: "json",
                                isSearchable: false,
                                isSystem: true,
                            })
                        }
                    }

                    const newDocumentData: Omit<IDocument, "id"> & {
                        id?: string
                    } = {
                        id: newDocId, // Pass the generated ID
                        title: filename,
                        sourceUri: uri,
                        tags: details.tagIds, // Apply common tags
                        metadata: {
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            type: DocumentType.IMAGE,
                        },
                        parameters: parameters,
                    }

                    const storedDocument = await docStore.addDocument(
                        newDocumentData as IDocument,
                    ) // Cast if store expects full IDocument
                    const addedDocId = storedDocument.id ?? newDocId // Use the returned ID if available, otherwise our generated one
                    console.log("Document added successfully:", addedDocId)
                    newDocumentIds.push(addedDocId)

                    if (details.tagIds.length > 0) {
                        tagContext.syncTagsForItem(
                            addedDocId,
                            "document",
                            details.tagIds,
                        )
                        console.log(`Tags synced for ${addedDocId}`)
                    }
                }

                if (details.folderId && newDocumentIds.length > 0) {
                    const currentFolders = useFolderStore.getState().folders
                    const updatedFolders = currentFolders.map((folder) =>
                        folder.id === details.folderId
                            ? {
                                  ...folder,
                                  documentIds: [
                                      ...new Set([
                                          ...(folder.documentIds || []),
                                          ...newDocumentIds,
                                      ]),
                                  ],
                              } // Spread the new IDs array
                            : folder,
                    )
                    updateFolders(updatedFolders)
                    console.log(
                        `Folder ${details.folderId} updated with ${newDocumentIds.length} documents.`,
                    )
                }

                success = true
            } catch (error) {
                console.error("Error saving one or more documents:", error)
                success = false
            } finally {
                setPendingScanURIs(null)
                if (success) {
                    console.log("Batch save successful, showing toast...")
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
        [pendingScanURIs, docStore, tagContext, updateFolders, navigateHome],
    )

    // handleCloseSheet remains mostly the same, ensures URIs are cleared
    const handleCloseSheet = useCallback(() => {
        console.log("Closing sheet without saving.")
        setShowAddSheet(false)
        setPendingScanURIs(null)
        setLoading(false)
        navigateHome()
    }, [navigateHome])

    useFocusEffect(
        useCallback(() => {
            console.log("DocumentsScreen focused")
            if (
                !scanAttemptedThisFocus &&
                !isLoading &&
                !showAddSheet &&
                !pendingScanURIs
            ) {
                // Added !pendingScanURIs check
                console.log("Attempting auto-scan on focus...")
                handleScanDocument()
            } else {
                console.log("Auto-scan skipped:", {
                    scanAttemptedThisFocus,
                    isLoading,
                    showAddSheet,
                    hasPendingURIs: !!pendingScanURIs,
                })
            }

            return () => {
                console.log(
                    "DocumentsScreen blurred or unmounted - Resetting scan flag",
                )
                setScanAttemptedThisFocus(false)
            }
        }, [
            scanAttemptedThisFocus,
            isLoading,
            showAddSheet,
            pendingScanURIs,
            handleScanDocument,
        ]), // Added pendingScanURIs dependency
    )

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <AddDocumentDetailsSheet
                visible={showAddSheet}
                onClose={handleCloseSheet}
                onSave={handleSaveMultipleDocuments}
                folders={folders}
            />

            <LoadingOverlay visible={isLoading} />

            <Alert
                type={"success"}
                message={`${
                    pendingScanURIs?.length || "Documents"
                } saved successfully`}
                visible={toastVisible}
                onClose={() => setToastVisible(false)}
            />
            {!isLoading && !showAddSheet && (
                <View style={styles.placeholder}></View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    placeholder: { justifyContent: "center", alignItems: "center" }, // Added placeholder style
})
