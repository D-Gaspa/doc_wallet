import React, { useState, useEffect } from "react"
import { StyleSheet, View } from "react-native"
import { Container, Stack, Spacer } from "../../layout"
import { Button } from "../../button"
import { Alert as AlertComponent, AlertType } from "../../feedback/Alert"
import { LoggingService } from "../../../../services/monitoring/loggingService"
import { UnifiedFolderModal, FolderType } from "./FolderModal"
import { TagProvider, useTagContext } from "../../tag_functionality/TagContext"
import { BatchTagManager } from "../../tag_functionality/BatchTagManager"
import { FolderHeader } from "./FolderHeader"
import { FoldersList } from "./FolderList.tsx"
import { FolderSelectionControls } from "./FolderSelectionControls.tsx"
import { TagManagerSection } from "../../tag_functionality/TagManagerSection"
import { useFolderOperations } from "./useFolderOperations"
import { useSelectionMode } from "./useSelectionMode"
import { Folder, Document } from "./types"

export interface FolderMainViewProps {
    initialFolders?: Folder[]
    initialDocuments?: Document[]
}

function FolderMainViewContent({ initialFolders = [] }: FolderMainViewProps) {
    const logger = LoggingService.getLogger
        ? LoggingService.getLogger("FolderMainView")
        : { debug: console.debug }

    // Access tag context
    const tagContext = useTagContext()

    // State for folders
    const [folders, setFolders] = useState<Folder[]>(initialFolders)
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

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

    // Initialize mock data
    useEffect(() => {
        if (folders.length === 0) {
            const mockFolders: Folder[] = [
                {
                    id: "1",
                    title: "Travel Documents",
                    parentId: null,
                    type: "travel",
                    isShared: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    childFolderIds: ["5", "6"],
                    documentIds: [],
                },
                {
                    id: "2",
                    title: "Medical Records",
                    parentId: null,
                    type: "medical",
                    isShared: true,
                    sharedWith: ["user123", "user456"],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    childFolderIds: [],
                    documentIds: [],
                },
                {
                    id: "3",
                    title: "Vehicle Documents",
                    parentId: null,
                    type: "car",
                    isShared: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    childFolderIds: [],
                    documentIds: [],
                },
                {
                    id: "4",
                    title: "Education Certificates",
                    parentId: null,
                    type: "education",
                    isShared: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    childFolderIds: [],
                    documentIds: [],
                },
                {
                    id: "5",
                    title: "Passport",
                    parentId: "1",
                    type: "custom",
                    customIconId: "file",
                    isShared: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    childFolderIds: [],
                    documentIds: [],
                },
                {
                    id: "6",
                    title: "Visas",
                    parentId: "1",
                    type: "custom",
                    customIconId: "check",
                    isShared: true,
                    sharedWith: ["user789"],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    childFolderIds: [],
                    documentIds: [],
                },
                {
                    id: "7",
                    title: "Important Notes",
                    parentId: null,
                    type: "custom",
                    customIconId: "warning",
                    isShared: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    childFolderIds: [],
                    documentIds: [],
                },
            ]
            setFolders(mockFolders)
            logger.debug("Initialized mock folders", {
                count: mockFolders.length,
            })
        }
    }, [])

    // Navigate to a folder
    const handleFolderPress = (folderId: string) => {
        if (selectionMode) {
            // In selection mode, pressing toggles selection instead of navigating
            handleFolderSelect(folderId)
        } else {
            logger.debug("Navigating to folder", { folderId })
            setCurrentFolderId(folderId)
        }
    }

    // Navigate back to parent folder
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

    // Open create folder modal
    const handleCreateFolderPress = () => {
        setFolderModalMode("create")
        setFolderToEdit(null)
        setFolderModalVisible(true)
    }

    // Handle saving a folder (create or update)
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
            // Create new folder
            handleCreateFolder(folderName, folderType, customIconId)
        }
    }

    // Handle tag filtering
    const handleTagFilterPress = (tagId: string | null) => {
        if (tagId === null) {
            // Clear filter when null is passed
            setSelectedTagFilters([])
        } else {
            // Toggle the tag in the filter list
            setSelectedTagFilters((prev) => {
                if (prev.includes(tagId)) {
                    return prev.filter((id) => id !== tagId)
                } else {
                    return [...prev, tagId]
                }
            })
        }
    }

    // Handle adding a tag to a folder
    const handleAddTagToFolder = (tagId: string, folderId: string) => {
        // Call the associate tag function from your tag context
        tagContext.associateTag(tagId, folderId, "folder")

        setAlert({
            visible: true,
            message: "Tag added to folder",
            type: "success",
        })

        logger.debug("Added tag to folder", { tagId, folderId })
    }

    // Filter folders based on search query and tags
    const filteredFolders =
        searchQuery || selectedTagFilters.length > 0
            ? folders.filter((folder) => {
                  // Check if folder is in the current directory
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
}

// Wrapper component with TagProvider
export function FolderMainView(props: FolderMainViewProps) {
    return (
        <TagProvider>
            <FolderMainViewContent {...props} />
        </TagProvider>
    )
}

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
        bottom: 120, // Position above the create button
        left: 0,
        right: 0,
        zIndex: 10,
    },
})
