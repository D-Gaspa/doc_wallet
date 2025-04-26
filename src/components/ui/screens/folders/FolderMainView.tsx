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
import { TouchableOpacity } from "react-native" // Make sure this is imported
import AddDocumentIcon from "../../assets/svg/add_folder.svg"
import { useTheme } from "../../../../hooks/useTheme"
import { TabParamList } from "../../../../App"

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
              error: console.error, // Added fallback for error
          }

    // Access tag context
    const tagContext = useTagContext()
    const { colors } = useTheme()
    // State for folders
    const folders = useFolderStore((state) => state.folders)
    const setFolders = useFolderStore((state) => state.setFolders)
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setLoading] = useState(false)
    const route = useRoute<FolderMainViewRouteProp>() // <-- Get route object
    const isFocused = useIsFocused() // <-- Check if the screen is focused

    // Add sorting state
    const [sortOption, setSortOption] = useState<FolderSortOption>("name")
    // Add move modal state
    const [moveFolderModalVisible, setMoveFolderModalVisible] = useState(false)
    const documents = useDocStore((state) => state.documents)
    const navigatedFromParams = useRef(false)
    // State for the unified modal
    const [folderModalVisible, setFolderModalVisible] = useState(false)
    const [folderModalMode, setFolderModalMode] = useState<"create" | "edit">(
        "create",
    )
    const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null)
    const internalNavigateToFolder = (folderId: string) => {
        logger.debug("Navigating internally to folder:", folderId)
        setCurrentFolderId(folderId) // <-- This is the core navigation logic in FolderMainView
    }
    useEffect(() => {
        const targetFolderId = route.params?.folderId

        // Check if the screen is focused, there's a target folderId,
        // and we haven't already navigated based on this parameter set
        if (isFocused && targetFolderId && !navigatedFromParams.current) {
            logger.debug(
                `FolderMainView focused with folderId param: ${targetFolderId}`,
            )
            internalNavigateToFolder(targetFolderId)
            // Mark that we've handled this navigation intent
            navigatedFromParams.current = true

            // It's often good practice to clear the params after handling them
            // to prevent re-navigation if the screen refocuses without params changing.
            // However, direct modification isn't standard. Resetting the ref flag is usually sufficient.
            // If re-navigation becomes an issue, more complex state management might be needed.
        } else if (!isFocused) {
            // Reset the flag when the screen loses focus, allowing navigation again
            // if the user leaves and comes back with the same params (though unlikely here)
            // or more importantly, if they come back with *new* params.
            navigatedFromParams.current = false
        }
    }, [isFocused, route.params?.folderId]) // Re-run when focus or folderId param changes

    // ... rest of useFolderOperations, useSelectionMode, handlers, etc.

    // Use the internalNavigateToFolder function where needed inside this component
    useImperativeHandle(ref, () => ({
        resetToRootFolder: () => {
            logger.debug("Resetting to root folder view")
            setCurrentFolderId(null)
        },
        navigateToFolder: internalNavigateToFolder, // Expose the internal navigation function
    }))
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
        navigateToFolder: (folderId: string) => {
            logger.debug("Navigating to folder from external ref:", folderId)
            setCurrentFolderId(folderId)
        },
    }))

    const {
        handleCreateFolder,
        handleUpdateFolder,
        getCurrentFolders,
        getCurrentFolderName,
        showFolderOptions,
        handleMoveFolders, // Add this to get the move folders function
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

    // Function to sort folders based on the sort option
    const sortFolders = (folders: Folder[]) => {
        return [...folders].sort((a, b) => {
            if (sortOption === "name") {
                return a.title.localeCompare(b.title)
            } else if (sortOption === "date") {
                // Safely get timestamps or use 0 as fallback
                const timeA = a.updatedAt?.getTime() ?? 0
                const timeB = b.updatedAt?.getTime() ?? 0
                return timeB - timeA // newest first
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

    // Add handler for moving folders
    const handleMoveSelectedFolders = (targetFolderId: string | null) => {
        if (selectedFolderIds.length === 0) return

        try {
            // Call the move function - assume it throws on error
            handleMoveFolders(selectedFolderIds, targetFolderId)

            // If it doesn't throw, assume success:
            setAlert({
                visible: true,
                message: "Se ha movido exitosamente",
                type: "success",
            })
            setMoveFolderModalVisible(false)
            toggleSelectionMode()
        } catch (error) {
            // Log the error using the now guaranteed logger.error
            logger.error("Error during folder move operation:", error)
            setAlert({
                visible: true,
                message: "An error occurred while moving folders.", // Provide user feedback
                type: "error",
            })
            // Optionally close modal on error too, or leave it open
            // setMoveFolderModalVisible(false);
        }
    }

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

    // in FolderMainViewContent:
    const handleFolderPress = (folderId: string) => {
        if (selectionMode) {
            handleFolderSelect(folderId)
        } else {
            internalNavigateToFolder(folderId) // Use the consistent internal function
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

    const filteredFolders = (() => {
        // If not searching or filtering by tags, just show current directory
        if (!searchQuery && selectedTagFilters.length === 0) {
            return getCurrentFolders()
        }

        // Otherwise filter based on search and tags
        return folders.filter((folder) => {
            // Check if folder matches search
            const matchesSearch =
                !searchQuery ||
                folder.title.toLowerCase().includes(searchQuery.toLowerCase())

            // Check if folder matches tag filters
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

            // If searching, show all matches regardless of location
            // If not searching, only show matches in current directory
            const inCurrentDirectory = folder.parentId === currentFolderId
            return searchQuery
                ? matchesSearch && matchesTags
                : inCurrentDirectory && matchesTags
        })
    })()
    useImperativeHandle(ref, () => ({
        resetToRootFolder: () => {
            logger.debug("Resetting to root folder view")
            setCurrentFolderId(null)
        },
        navigateToFolder: internalNavigateToFolder, // Expose the internal navigation function
    }))

    // Apply sorting to filtered folders
    const sortedFolders = sortFolders(filteredFolders)

    const getFilteredDocuments = () => {
        if (!searchQuery) {
            return getDocumentsForCurrentFolder()
        }

        // When searching, find documents across all folders
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
                        sortOption={sortOption}
                        setSortOption={setSortOption}
                    />
                    {/* documents in current folder or search results */}
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
                                        // figure out onPress below
                                        onPress={() => {
                                            if (searchQuery && parent) {
                                                setSearchQuery("")
                                                setCurrentFolderId(parent.id)
                                            } else {
                                                // normal preview flow
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

                    {/* Selection Controls */}
                    <FolderSelectionControls
                        selectionMode={selectionMode}
                        selectedFolderIds={selectedFolderIds}
                        filteredFolders={filteredFolders}
                        toggleSelectionMode={toggleSelectionMode}
                        handleSelectAll={handleSelectAll}
                        setBatchTagModalVisible={setBatchTagModalVisible}
                        onMovePress={() => setMoveFolderModalVisible(true)}
                    />

                    <Spacer size={8} />

                    {/* Folder List */}
                    <FoldersList
                        folders={sortedFolders}
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
                        isFiltering={
                            searchQuery !== "" || selectedTagFilters.length > 0
                        }
                        hasDocuments={documentsToShow.length > 0}
                    />
                </Stack>

                {/* Create Folder Button */}
                {!selectionMode && ( // Optionally hide FAB during selection mode
                    <TouchableOpacity
                        style={[
                            styles.fab,
                            { backgroundColor: colors.primary },
                        ]}
                        onPress={handleCreateFolderPress}
                        activeOpacity={0.8} // Visual feedback on press
                        testID="create-folder-fab"
                    >
                        {/* Adjust icon size and color as needed */}
                        <AddDocumentIcon
                            width={24}
                            height={24}
                            color={colors.background}
                        />
                    </TouchableOpacity>
                )}

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

                {/* Folder Move Modal */}
                <FolderMoveModal
                    isVisible={moveFolderModalVisible}
                    onClose={() => setMoveFolderModalVisible(false)}
                    folders={folders}
                    selectedFolderIds={selectedFolderIds}
                    onMove={handleMoveSelectedFolders}
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
        bottom: 90,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    fab: {
        position: "absolute",
        bottom: 10, // Adjust position to be above the main TabBar (e.g., 60 height + 20 margin)
        right: 20,
        width: 56, // Standard FAB size
        height: 56,
        borderRadius: 28, // Half of width/height for circle
        alignItems: "center",
        justifyContent: "center",
        elevation: 8, // Android shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 5, // Ensure FAB is above other content except modals/alerts
    },
})
