import React, { forwardRef, useImperativeHandle, useState } from "react"
import { StyleSheet, View } from "react-native"
import { Container, Spacer, Stack } from "../../layout"
import { Button } from "../../button"
import { Alert as AlertComponent, AlertType } from "../../feedback/Alert"
import { LoggingService } from "../../../../services/monitoring/loggingService"
import { FolderType, UnifiedFolderModal } from "./FolderModal"
import { TagProvider, useTagContext } from "../../tag_functionality/TagContext"
import { BatchTagManager } from "../../tag_functionality/BatchTagManager"
import { FolderHeader } from "./FolderHeader"
import { FoldersList } from "./FolderList.tsx"
import { FolderSelectionControls } from "./FolderSelectionControls.tsx"
import { TagManagerSection } from "../../tag_functionality/TagManagerSection"
import { useFolderOperations } from "./useFolderOperations"
import { useSelectionMode } from "./useSelectionMode"
import { Folder } from "./types"
import { useFolderStore } from "../../../../store/useFolderStore.ts"
import { useDocStore } from "../../../../store"
import { DocumentType, IDocument } from "../../../../types/document.ts"
import { documentPreview } from "../../../../services/document/preview.ts"
import { documentStorage } from "../../../../services/document/storage.ts"
import * as FileSystem from "expo-file-system"
import { LoadingOverlay } from "../../feedback/LoadingOverlay.tsx"
import { DocumentCard } from "../../cards"
import { showDocumentOptions } from "../documents/useDocumentOperations.ts"

const FolderMainViewContent = forwardRef((_, ref) => {
    const logger = LoggingService.getLogger
        ? LoggingService.getLogger("FolderMainView")
        : { debug: console.debug }

    // Access tag context
    const tagContext = useTagContext()

    // State for folders
    const folders = useFolderStore((state) => state.folders)
    const setFolders = useFolderStore((state) => state.setFolders)
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setLoading] = useState(false)

    const documents = useDocStore((state) => state.documents)

    // State for the unified modal
    const [folderModalVisible, setFolderModalVisible] = useState(false)
    const [folderModalMode, setFolderModalMode] = useState<"create" | "edit">(
        "create",
    )
    const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null)

    // Alert state using the existing AlertType from the Alert component
    const [alert, setAlert] = useState<{
        visible: boolean
        message: string
        type: AlertType
    }>({
        visible: false,
        message: "",
        type: "info",
    })

    const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([])
    const [batchTagModalVisible, setBatchTagModalVisible] = useState(false)

    useImperativeHandle(ref, () => ({
        resetToRootFolder: () => {
            logger.debug("Resetting to root folder view")
            setCurrentFolderId(null)
        },
    }))

    const {
        handleCreateFolder,
        handleUpdateFolder,
        getCurrentFolders,
        getCurrentFolderName,
        showFolderOptions,
    } = useFolderOperations({
        folders,
        setFolders,
        currentFolderId,
        setAlert,
        setFolderModalMode,
        setFolderToEdit,
        setFolderModalVisible,
        logger,
    })

    const {
        selectionMode,
        selectedFolderIds,
        toggleSelectionMode,
        handleSelectAll,
        handleFolderSelect,
    } = useSelectionMode()

    const handleDocumentPress = async (doc: IDocument) => {
        setLoading(true)
        try {
            const docStore = useDocStore.getState()

            // Give encryption time to finish (same as DocumentsScreen)
            await new Promise((resolve) => setTimeout(resolve, 200))

            // Get the preview file URI (decrypted)
            const previewResult = await docStore.getDocumentPreview(doc.id)

            if (!previewResult || !previewResult.sourceUri) {
                setAlert({
                    visible: true,
                    message: "No preview available for this document.",
                    type: "error",
                })
                return
            }

            // Determine MIME type based on metadata
            const mimeType = documentPreview.getMimeTypeForDocumentType(
                previewResult.metadata?.type ?? DocumentType.PDF,
            )

            // Optional: check if the preview file actually exists
            const fileInfo = await FileSystem.getInfoAsync(
                previewResult.sourceUri,
            )
            if (!fileInfo.exists || fileInfo.size === 0) {
                setAlert({
                    visible: true,
                    message: "Preview file is missing or empty.",
                    type: "error",
                })
                return
            }

            // Preview the decrypted file using its URI
            await documentPreview.viewDocumentByUri(
                previewResult.sourceUri,
                mimeType,
                async () => {
                    const storage = await documentStorage
                    await storage.deletePreviewFile(previewResult.sourceUri)
                    logger.debug("Cleaned up preview file after viewing")
                },
            )
        } catch (err) {
            logger.debug("Error opening document", err)
            setAlert({
                visible: true,
                message: documentPreview.getErrorMessage(err),
                type: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const getDocumentsForCurrentFolder = (): IDocument[] => {
        const current = folders.find((f) => f.id === currentFolderId)
        if (!current || !current.documentIds) return []

        return documents.filter((doc) => current.documentIds!.includes(doc.id))
    }

    const handleFolderPress = (folderId: string) => {
        if (selectionMode) {
            // In selection mode, pressing toggles selection instead of navigating
            handleFolderSelect(folderId)
        } else {
            logger.debug("Navigating to folder", { folderId })
            setCurrentFolderId(folderId)
        }
    }

    const handleBackPress = () => {
        if (selectionMode) {
            // Exit selection mode when pressing back in selection mode
            toggleSelectionMode()
            return
        }

        if (!currentFolderId) return

        const currentFolder = folders.find((f) => f.id === currentFolderId)
        if (currentFolder) {
            logger.debug("Navigating to parent folder", {
                from: currentFolderId,
                to: currentFolder.parentId,
            })
            setCurrentFolderId(currentFolder.parentId)
        }
    }

    const handleCreateFolderPress = () => {
        setFolderModalMode("create")
        setFolderToEdit(null)
        setFolderModalVisible(true)
    }

    const handleSaveFolder = (
        folderName: string,
        folderType: FolderType,
        customIconId?: string,
        folderId?: string,
    ) => {
        if (folderId) {
            // Update existing folder
            handleUpdateFolder(folderId, folderName, folderType, customIconId)
        } else {
            handleCreateFolder(folderName, folderType, customIconId)
        }
    }

    const handleTagFilterPress = (tagId: string | null) => {
        if (tagId === null) {
            setSelectedTagFilters([])
        } else {
            setSelectedTagFilters((prev) => {
                if (prev.includes(tagId)) {
                    return prev.filter((id) => id !== tagId)
                } else {
                    return [...prev, tagId]
                }
            })
        }
    }

    const handleAddTagToFolder = (tagId: string, folderId: string) => {
        tagContext.associateTag(tagId, folderId, "folder")

        setAlert({
            visible: true,
            message: "Tag added to folder",
            type: "success",
        })

        logger.debug("Added tag to folder", { tagId, folderId })
    }

    const filteredFolders =
        searchQuery || selectedTagFilters.length > 0
            ? folders.filter((folder) => {
                  const inCurrentDirectory = folder.parentId === currentFolderId

                  // Apply search filter
                  const matchesSearch =
                      !searchQuery ||
                      folder.title
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())

                  // Apply tag filters if any are selected
                  let matchesTags = true
                  if (selectedTagFilters.length > 0) {
                      const folderTags = tagContext.getTagsForItem(
                          folder.id,
                          "folder",
                      )
                      const folderTagIds = folderTags.map((tag) => tag.id)
                      // Folder must have ALL selected tags (AND logic)
                      matchesTags = selectedTagFilters.every((tagId) =>
                          folderTagIds.includes(tagId),
                      )
                  }

                  return inCurrentDirectory && matchesSearch && matchesTags
              })
            : getCurrentFolders()

    return (
        <Container testID="folder-main-view">
            <View style={styles.contentContainer}>
                <Stack spacing={16} style={styles.scrollContent}>
                    {/* Header Section */}
                    <FolderHeader
                        currentFolderId={currentFolderId}
                        getCurrentFolderName={getCurrentFolderName}
                        handleBackPress={handleBackPress}
                        folders={folders}
                        selectedTagFilters={selectedTagFilters}
                        setSelectedTagFilters={setSelectedTagFilters}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                    {/* documents in current folder */}
                    {currentFolderId && (
                        <>
                            <Spacer size={16} />
                            {getDocumentsForCurrentFolder().map((doc) => (
                                <DocumentCard
                                    key={doc.id}
                                    document={doc}
                                    tags={tagContext.getTagsForItem(
                                        doc.id,
                                        "document",
                                    )}
                                    onPress={() => handleDocumentPress(doc)}
                                    onLongPress={() => showDocumentOptions(doc)}
                                    testID={`document-${doc.id}`}
                                    showAddTagButton={false}
                                    maxTags={3}
                                />
                            ))}
                        </>
                    )}

                    {/* Selection Controls */}
                    <FolderSelectionControls
                        selectionMode={selectionMode}
                        selectedFolderIds={selectedFolderIds}
                        filteredFolders={filteredFolders}
                        toggleSelectionMode={toggleSelectionMode}
                        handleSelectAll={handleSelectAll}
                        setBatchTagModalVisible={setBatchTagModalVisible}
                    />

                    <Spacer size={8} />

                    {/* Folder List */}
                    <FoldersList
                        folders={filteredFolders}
                        selectedFolderIds={selectedFolderIds}
                        selectedTagFilters={selectedTagFilters}
                        tagContext={tagContext}
                        handleFolderPress={handleFolderPress}
                        handleFolderSelect={handleFolderSelect}
                        showFolderOptions={(folder) =>
                            showFolderOptions(
                                folder,
                                selectionMode,
                                handleFolderSelect,
                            )
                        }
                        selectionMode={selectionMode}
                        handleAddTagToFolder={handleAddTagToFolder}
                    />
                </Stack>

                {/* Create Folder Button */}
                <View style={styles.buttonContainer}>
                    <Button
                        title="Create new folder"
                        onPress={handleCreateFolderPress}
                        testID="create-folder-button"
                    />
                </View>

                {/* Tag Manager for current folder */}
                {currentFolderId && !selectionMode && (
                    <TagManagerSection
                        folderId={currentFolderId}
                        folderName={getCurrentFolderName()}
                        handleTagFilterPress={handleTagFilterPress}
                        selectedTagFilters={selectedTagFilters}
                    />
                )}

                {/* Unified Folder Modal */}
                <UnifiedFolderModal
                    isVisible={folderModalVisible}
                    onClose={() => {
                        setFolderModalVisible(false)
                        setFolderToEdit(null)
                    }}
                    onSave={handleSaveFolder}
                    mode={folderModalMode}
                    initialData={
                        folderToEdit
                            ? {
                                  id: folderToEdit.id,
                                  name: folderToEdit.title,
                                  type: folderToEdit.type || "custom",
                                  customIconId: folderToEdit.customIconId,
                              }
                            : {}
                    }
                    parentFolderId={currentFolderId}
                />

                {/* Batch Tag Manager */}
                <BatchTagManager
                    isVisible={batchTagModalVisible}
                    onClose={() => setBatchTagModalVisible(false)}
                    itemIds={selectedFolderIds}
                    itemType="folder"
                    onTagsApplied={() => {
                        // Exit selection mode after applying tags
                        toggleSelectionMode()
                    }}
                />
            </View>

            <LoadingOverlay visible={isLoading} />

            {/* Alert notification */}
            {alert.visible && (
                <View style={styles.alertContainer}>
                    <AlertComponent
                        type={alert.type}
                        message={alert.message}
                        visible={alert.visible}
                        onClose={() => setAlert({ ...alert, visible: false })}
                        autoDismiss={true}
                        duration={3000}
                    />
                </View>
            )}
        </Container>
    )
})

FolderMainViewContent.displayName = "FolderMainViewContent"

export const FolderMainView = forwardRef((props, ref) => {
    return (
        <TagProvider>
            <FolderMainViewContent ref={ref} {...props} />
        </TagProvider>
    )
})

FolderMainView.displayName = "FolderMainView"

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        position: "relative",
    },
    scrollContent: {
        flex: 1,
    },
    buttonContainer: {
        position: "absolute",
        bottom: 60, // Position above the TabBar
        left: 20,
        right: 20,
        zIndex: 1,
    },
    alertContainer: {
        position: "absolute",
        bottom: 120,
        left: 0,
        right: 0,
        zIndex: 10,
    },
})
