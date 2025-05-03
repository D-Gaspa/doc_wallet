import React, {
    forwardRef,
    useImperativeHandle,
    useState,
    useEffect,
    useRef,
} from "react"
import { StyleSheet, View } from "react-native"
import { Container, Spacer, Stack } from "../../layout"
import { Alert as AlertComponent, AlertType } from "../../feedback/Alert"
import { LoggingService } from "../../../../services/monitoring/loggingService"
import { FolderType, UnifiedFolderModal } from "./FolderModal"
import { TagProvider, useTagContext } from "../../tag_functionality/TagContext"
import { BatchTagManager } from "../../tag_functionality/BatchTagManager"
import { FolderHeader, FolderSortOption } from "./FolderHeader"
import { FoldersList } from "./FolderList.tsx"
import { FolderSelectionControls } from "./FolderSelectionControls.tsx"
import { TagManagerSection } from "../../tag_functionality/TagManagerSection"
import { useFolderOperations } from "./useFolderOperations"
import { useSelectionMode } from "./useSelectionMode"
import { useRoute, useIsFocused, RouteProp } from "@react-navigation/native"
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
import { FolderMoveModal } from "./FolderMoveModal"
// Removed unused useTheme import if 'colors' was the only thing used
// import { useTheme } from "../../../../hooks/useTheme";
import { TabParamList } from "../../../../App"
import { FolderActionModal } from "./FolderActionModal.tsx"
import { AddDocumentDetailsSheet } from "../documents/AddDocumentDetailsSheet.tsx"
import { ExpandingFab } from "../../../ExpandingFab.tsx" // Adjusted path assuming it's in ui/button
import { documentImport } from "../../../../services/document/import.ts" // <-- Added import
import { types } from "@react-native-documents/picker" // <-- Added import

export interface FolderMainViewRef {
    resetToRootFolder(): void
    navigateToFolder(folderId: string): void
}
type FolderMainViewRouteProp = RouteProp<TabParamList, "Home">

const FolderMainViewContent = forwardRef((_props, ref) => {
    const logger = LoggingService.getLogger
        ? LoggingService.getLogger("FolderMainView")
        : {
              debug: console.debug,
              info: console.info,
              warn: console.warn,
              error: console.error,
          }

    const tagContext = useTagContext()
    const folders = useFolderStore((state) => state.folders)
    const setFolders = useFolderStore((state) => state.setFolders)
    const docStore = useDocStore() // <-- Get docStore instance
    const documents = useDocStore((state) => state.documents) // Keep this if you need reactive access

    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setLoading] = useState(false)
    const route = useRoute<FolderMainViewRouteProp>()
    const isFocused = useIsFocused()
    const [actionModalVisible, setActionModalVisible] = useState(false)
    const [folderForAction, setFolderForAction] = useState<Folder | null>(null)
    const [showAddDocSheet, setShowAddDocSheet] = useState(false)
    const [pendingDocument, setPendingDocument] = useState<IDocument | null>(
        null,
    )
    const [sortOption, setSortOption] = useState<FolderSortOption>("name")
    const [moveFolderModalVisible, setMoveFolderModalVisible] = useState(false)
    const navigatedFromParams = useRef(false)
    const [folderModalVisible, setFolderModalVisible] = useState(false)
    const [folderModalMode, setFolderModalMode] = useState<"create" | "edit">(
        "create",
    )
    const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null)

    const handleAddDocumentPress = async () => {
        setLoading(true)
        try {
            // Now documentImport and types are defined
            const importedDocs = await documentImport.importDocument({
                allowMultiple: false,
                fileTypes: [types.pdf, types.images, types.docx],
                allowVirtualFiles: true,
            })
            if (importedDocs.length > 0) {
                const doc = importedDocs[0]
                const tempDoc: IDocument = {
                    id: `temp_${Date.now()}`,
                    title: doc.name ?? `Document_${Date.now()}`,
                    sourceUri: doc.localUri ?? doc.uri,
                    metadata: {
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        type: doc.type ?? DocumentType.UNKNOWN,
                    },
                    tags: [],
                }
                logger.debug("Document picked, showing details sheet", {
                    tempId: tempDoc.id,
                })
                setPendingDocument(tempDoc)
                setShowAddDocSheet(true)
            } else {
                logger.debug("Document import cancelled by user.")
            }
        } catch (error) {
            logger.error("Error selecting document:", error)
            setAlert({
                visible: true,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to select document.",
                type: "error",
            })
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
        setShowAddDocSheet(false)
        setPendingDocument(null)
        try {
            // Now docStore is defined
            const storedDocument = await docStore.addDocument({
                title: doc.title,
                sourceUri: doc.sourceUri,
                tags: selectedTagIds,
                metadata: doc.metadata,
            })
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
                          updatedAt: new Date(),
                      }
                    : folder,
            )
            setFolders(updatedFolders)
            tagContext.syncTagsForItem(
                storedDocument.id,
                "document",
                selectedTagIds,
            )
            logger.info("Document added successfully via FolderMainView", {
                docId: storedDocument.id,
                folderId: selectedFolderId,
            })
            setAlert({
                visible: true,
                message: "Document added successfully!",
                type: "success",
            })
        } catch (error) {
            logger.error("Error saving document:", error)
            setAlert({
                visible: true,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to save document.",
                type: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const internalNavigateToFolder = (folderId: string) => {
        logger.debug("Navigating internally to folder:", folderId)
        setCurrentFolderId(folderId)
    }

    useEffect(() => {
        const targetFolderId = route.params?.folderId
        if (isFocused && targetFolderId && !navigatedFromParams.current) {
            logger.debug(
                `FolderMainView focused with folderId param: ${targetFolderId}`,
            )
            internalNavigateToFolder(targetFolderId)
            navigatedFromParams.current = true
        } else if (!isFocused) {
            navigatedFromParams.current = false
        }
    }, [isFocused, route.params?.folderId])

    useImperativeHandle(ref, () => ({
        resetToRootFolder: () => {
            logger.debug("Resetting to root folder view")
            setCurrentFolderId(null)
        },
        navigateToFolder: internalNavigateToFolder,
    }))

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

    const {
        handleCreateFolder,
        handleUpdateFolder,
        getCurrentFolders,
        handleShareFolder,
        handleDeleteFolder,
        getCurrentFolderName,
        handleToggleFavorite,
        handleMoveFolders,
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

    const sortFolders = (foldersToSort: Folder[]) => {
        // Renamed variable
        return [...foldersToSort].sort((a, b) => {
            if (sortOption === "name") {
                return a.title.localeCompare(b.title)
            } else if (sortOption === "date") {
                const timeA = a.updatedAt?.getTime() ?? 0
                const timeB = b.updatedAt?.getTime() ?? 0
                return timeB - timeA
            } else if (sortOption === "type") {
                if (a.type && b.type) {
                    return a.type.localeCompare(b.type)
                } else if (a.type) {
                    return -1
                } else if (b.type) {
                    return 1
                }
                return 0
            }
            return 0
        })
    }

    const handleShowActionModal = (folder: Folder) => {
        setFolderForAction(folder)
        setActionModalVisible(true)
        logger.debug("Showing action modal for folder", { folderId: folder.id })
    }

    const handleCloseActionModal = () => {
        setActionModalVisible(false)
        setFolderForAction(null)
    }

    const handleEditAction = (folder: Folder) => {
        setFolderModalMode("edit")
        setFolderToEdit(folder)
        setFolderModalVisible(true)
        logger.debug("Triggering edit from action modal", {
            folderId: folder.id,
        })
    }

    const handleShareAction = (folder: Folder) => {
        handleShareFolder(folder)
        logger.debug("Triggering share from action modal", {
            folderId: folder.id,
        })
    }

    const handleMoveSelectedFolders = (targetFolderId: string | null) => {
        if (selectedFolderIds.length === 0) return
        try {
            handleMoveFolders(selectedFolderIds, targetFolderId)
            setAlert({
                visible: true,
                message: "Se ha movido exitosamente",
                type: "success",
            })
            setMoveFolderModalVisible(false)
            toggleSelectionMode()
        } catch (error) {
            logger.error("Error durante la operación:", error)
            setAlert({
                visible: true,
                message: "An error occurred while moving folders.",
                type: "error",
            })
        }
    }

    const handleDocumentPress = async (doc: IDocument) => {
        setLoading(true)
        try {
            const docStoreState = useDocStore.getState() // Get current state directly if needed
            await new Promise((resolve) => setTimeout(resolve, 200))
            const previewResult = await docStoreState.getDocumentPreview(doc.id) // Use state method

            if (!previewResult || !previewResult.sourceUri) {
                setAlert({
                    visible: true,
                    message: "No hay preview para este contenido.",
                    type: "error",
                })
                setLoading(false) // Ensure loading is stopped
                return
            }
            const mimeType = documentPreview.getMimeTypeForDocumentType(
                previewResult.metadata?.type ?? DocumentType.PDF,
            )
            const fileInfo = await FileSystem.getInfoAsync(
                previewResult.sourceUri,
            )
            if (!fileInfo.exists || fileInfo.size === 0) {
                setAlert({
                    visible: true,
                    message: "Preview file is missing or empty.",
                    type: "error",
                })
                setLoading(false) // Ensure loading is stopped
                return
            }
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
        // Use the reactive documents from the store directly
        return documents.filter((doc) => current.documentIds!.includes(doc.id))
    }

    const handleFolderPress = (folderId: string) => {
        if (selectionMode) {
            handleFolderSelect(folderId)
        } else {
            internalNavigateToFolder(folderId)
        }
    }

    const handleBackPress = () => {
        if (selectionMode) {
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
            handleUpdateFolder(folderId, folderName, folderType, customIconId)
        } else {
            handleCreateFolder(folderName, folderType, customIconId)
        }
    }

    const handleTagFilterPress = (tagId: string | null) => {
        if (tagId === null) {
            setSelectedTagFilters([])
        } else {
            setSelectedTagFilters((prev) =>
                prev.includes(tagId)
                    ? prev.filter((id) => id !== tagId)
                    : [...prev, tagId],
            )
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

    const filteredFolders = (() => {
        if (!searchQuery && selectedTagFilters.length === 0) {
            return getCurrentFolders()
        }
        return folders.filter((folder) => {
            const matchesSearch =
                !searchQuery ||
                folder.title.toLowerCase().includes(searchQuery.toLowerCase())
            let matchesTags = true
            if (selectedTagFilters.length > 0) {
                const folderTags = tagContext.getTagsForItem(
                    folder.id,
                    "folder",
                )
                const folderTagIds = folderTags.map((tag) => tag.id)
                matchesTags = selectedTagFilters.every((tagId) =>
                    folderTagIds.includes(tagId),
                )
            }
            const inCurrentDirectory = folder.parentId === currentFolderId
            return searchQuery
                ? matchesSearch && matchesTags
                : inCurrentDirectory && matchesTags
        })
    })()

    const sortedFolders = sortFolders(filteredFolders)

    const getFilteredDocuments = () => {
        if (!searchQuery) {
            return getDocumentsForCurrentFolder()
        }
        // Use the reactive documents from the store directly
        return documents.filter(
            (doc) =>
                doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ??
                false,
        )
    }

    const documentsToShow = searchQuery
        ? getFilteredDocuments()
        : getDocumentsForCurrentFolder()

    return (
        <Container testID="folder-main-view">
            <View style={styles.contentContainer}>
                <Stack spacing={16} style={styles.scrollContent}>
                    <FolderHeader
                        currentFolderId={currentFolderId}
                        getCurrentFolderName={getCurrentFolderName}
                        handleBackPress={handleBackPress}
                        folders={folders}
                        selectedTagFilters={selectedTagFilters}
                        setSelectedTagFilters={setSelectedTagFilters}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        sortOption={sortOption}
                        setSortOption={setSortOption}
                    />
                    {documentsToShow.length > 0 && (
                        <>
                            <Spacer size={16} />
                            {documentsToShow.map((doc) => {
                                const parent = folders.find((f) =>
                                    f.documentIds?.includes(doc.id),
                                )
                                return (
                                    <DocumentCard
                                        key={doc.id}
                                        document={doc}
                                        tags={tagContext.getTagsForItem(
                                            doc.id,
                                            "document",
                                        )}
                                        onPress={() => {
                                            if (searchQuery && parent) {
                                                setSearchQuery("")
                                                setCurrentFolderId(parent.id)
                                            } else {
                                                handleDocumentPress(doc)
                                            }
                                        }}
                                        onLongPress={() =>
                                            showDocumentOptions(doc)
                                        }
                                        testID={`document-${doc.id}`}
                                        showAddTagButton={true}
                                        maxTags={3}
                                    />
                                )
                            })}
                        </>
                    )}
                    <FolderSelectionControls
                        selectionMode={selectionMode}
                        selectedFolderIds={selectedFolderIds}
                        filteredFolders={filteredFolders}
                        toggleSelectionMode={toggleSelectionMode}
                        handleSelectAll={() => handleSelectAll(filteredFolders)} // Pass filteredFolders here
                        setBatchTagModalVisible={setBatchTagModalVisible}
                        onMovePress={() => setMoveFolderModalVisible(true)}
                    />
                    <Spacer size={8} />
                    <FoldersList
                        folders={sortedFolders}
                        selectedFolderIds={selectedFolderIds}
                        selectedTagFilters={selectedTagFilters}
                        handleToggleFavorite={handleToggleFavorite}
                        handleFolderPress={handleFolderPress}
                        handleDeleteFolder={handleDeleteFolder}
                        handleFolderSelect={handleFolderSelect}
                        showFolderOptions={handleShowActionModal}
                        selectionMode={selectionMode}
                        handleAddTagToFolder={handleAddTagToFolder}
                        isFiltering={
                            searchQuery !== "" || selectedTagFilters.length > 0
                        }
                        hasDocuments={documentsToShow.length > 0}
                    />
                </Stack>
                {!selectionMode && (
                    <ExpandingFab
                        onAddFolder={handleCreateFolderPress}
                        onAddDocument={handleAddDocumentPress}
                    />
                )}
                {currentFolderId && !selectionMode && (
                    <TagManagerSection
                        folderId={currentFolderId}
                        folderName={getCurrentFolderName()}
                        handleTagFilterPress={handleTagFilterPress}
                        selectedTagFilters={selectedTagFilters}
                    />
                )}
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
                <AddDocumentDetailsSheet
                    visible={showAddDocSheet}
                    document={pendingDocument}
                    onClose={() => {
                        setShowAddDocSheet(false)
                        setPendingDocument(null)
                        logger.debug("Add Document Details Sheet closed.")
                    }}
                    onSave={handleSaveDocument}
                    folders={folders}
                    setFolders={setFolders}
                />
                <BatchTagManager
                    isVisible={batchTagModalVisible}
                    onClose={() => setBatchTagModalVisible(false)}
                    itemIds={selectedFolderIds}
                    itemType="folder"
                    onTagsApplied={() => {
                        toggleSelectionMode()
                    }}
                />
                <FolderMoveModal
                    isVisible={moveFolderModalVisible}
                    onClose={() => setMoveFolderModalVisible(false)}
                    folders={folders}
                    selectedFolderIds={selectedFolderIds}
                    onMove={handleMoveSelectedFolders}
                />
                <FolderActionModal
                    isVisible={actionModalVisible}
                    onClose={handleCloseActionModal}
                    folder={folderForAction}
                    onShare={handleShareAction}
                    onEdit={handleEditAction}
                />
            </View>
            <LoadingOverlay visible={isLoading} />
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

export const FolderMainView = forwardRef<FolderMainViewRef, unknown>(
    (_props, ref) => (
        <TagProvider>
            <FolderMainViewContent ref={ref} />
        </TagProvider>
    ),
)

FolderMainView.displayName = "FolderMainView"

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        position: "relative",
    },
    scrollContent: {
        // Changed from flex: 1 to allow content to scroll naturally if it exceeds screen height
        flexGrow: 1,
        paddingBottom: 100, // Add padding at the bottom to ensure FAB doesn't overlap final items
    },
    buttonContainer: {
        position: "absolute",
        bottom: 60,
        left: 20,
        right: 20,
        zIndex: 1,
    },
    alertContainer: {
        position: "absolute",
        bottom: 90, // Adjust position based on FAB and TabBar
        left: 20,
        right: 20,
        zIndex: 100, // Ensure alert is above FAB
    },
    // Remove the old fab style if it exists
})
