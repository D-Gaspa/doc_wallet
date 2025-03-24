import React, { useState, useEffect } from "react"
import { FlatList, StyleSheet, Alert as RNAlert, View } from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { Container } from "../../layout"
import { Stack } from "../../layout"
import { Row } from "../../layout"
import { Spacer } from "../../layout"
import { Text } from "../../typography"
import { SearchBar } from "../../search_bar"
import { FolderCard } from "../../cards"
import { Button } from "../../button"
import { Alert as AlertComponent } from "../../feedback/Alert"
import { LoggingService } from "../../../../services/monitoring/loggingService"
import { FolderCreateModal, FolderType } from "./FolderCreateModal"
import { FolderEditModal } from "./FolderEditModal"
import { getIconById, ThemeColors } from "./CustomIconSelector"
import { documentImport } from "../../../../services/document/import.ts"
import { types } from "@react-native-documents/picker"
import { documentPreview } from "../../../../services/document/preview.ts"
import { useDocStore } from "../../../../store"
import { documentStorage } from "../../../../services/document/storage.ts"
import { DocumentType } from "../../../../types/document.ts"

// Define folder data structure
interface Folder {
    id: string
    title: string
    parentId: string | null
    type?: FolderType
    customIconId?: string
    isShared?: boolean
    sharedWith?: string[]
    createdAt: Date
    updatedAt: Date
}

export interface FolderMainViewProps {
    initialFolders?: Folder[]
}

export function FolderMainView({ initialFolders = [] }: FolderMainViewProps) {
    const { colors } = useTheme()
    const logger = LoggingService.getLogger
        ? LoggingService.getLogger("FolderMainView")
        : { debug: console.debug }

    // State for folders
    const [folders, setFolders] = useState<Folder[]>(initialFolders)
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [createModalVisible, setCreateModalVisible] = useState(false)
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null)
    const [alert, setAlert] = useState<{
        visible: boolean
        message: string
        type: "success" | "error" | "info" | "warning"
    }>({
        visible: false,
        message: "",
        type: "info",
    })

    // Mock data for initial testing
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
                },
                {
                    id: "3",
                    title: "Vehicle Documents",
                    parentId: null,
                    type: "car",
                    isShared: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: "4",
                    title: "Education Certificates",
                    parentId: null,
                    type: "education",
                    isShared: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
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
                },
            ]
            setFolders(mockFolders)
            logger.debug("Initialized mock folders", {
                count: mockFolders.length,
            })
        }
    }, [])

    // Get folders for current view (root or nested)
    const getCurrentFolders = () => {
        return folders.filter((folder) => folder.parentId === currentFolderId)
    }

    // Get current folder name (for breadcrumb)
    const getCurrentFolderName = () => {
        if (!currentFolderId) return "Folders"
        const folder = folders.find((f) => f.id === currentFolderId)
        return folder ? folder.title : "Unknown Folder"
    }

    // Navigate to a folder
    const handleFolderPress = (folderId: string) => {
        logger.debug("Navigating to folder", { folderId })
        setCurrentFolderId(folderId)
    }

    // Navigate back to parent folder
    const handleBackPress = () => {
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
        setCreateModalVisible(true)
    }

    const handleAddSingleDocument = async () => {
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

                const docStore = useDocStore.getState()

                // Add logging to debug the URI values
                console.log(`Adding document with URI: ${uri}`)

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
                    storedDocument.id
                )

                if (!previewResult) {
                    console.error("Failed to get document preview")
                    throw new Error("Document preview could not be generated")
                }

                console.log(`Preview URI: ${previewResult.sourceUri}`)
                console.log(`Document type: ${previewResult.metadata.type}`)

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
                    }
                )
            }
        } catch (error) {
            console.error("Error handling document:", error)
            // Show an error message to the user
            // You might want to add a Toast or Alert here
        }
    }

    // Create a new folder
    const handleCreateFolder = (
        folderName: string,
        folderType: FolderType,
        customIconId?: string
    ) => {
        const newFolder: Folder = {
            id: `folder-${Date.now()}`, // Simple ID generation for UI prototype
            title: folderName,
            parentId: currentFolderId,
            type: folderType,
            customIconId: folderType === "custom" ? customIconId : undefined,
            isShared: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        setFolders([...folders, newFolder])
        setAlert({
            visible: true,
            message: "Folder created successfully",
            type: "success",
        })
        logger.debug("Created new folder", {
            folderId: newFolder.id,
            name: folderName,
            type: folderType,
            customIconId: customIconId,
            parentId: currentFolderId,
        })
    }

    // Update an existing folder
    const handleUpdateFolder = (
        folderId: string,
        folderName: string,
        folderType: FolderType,
        customIconId?: string
    ) => {
        const updatedFolders = folders.map((folder) => {
            if (folder.id === folderId) {
                return {
                    ...folder,
                    title: folderName,
                    type: folderType,
                    customIconId:
                        folderType === "custom" ? customIconId : undefined,
                    updatedAt: new Date(),
                }
            }
            return folder
        })

        setFolders(updatedFolders)
        setAlert({
            visible: true,
            message: "Folder updated successfully",
            type: "success",
        })
        logger.debug("Updated folder", {
            folderId,
            name: folderName,
            type: folderType,
            customIconId,
        })
    }

    // Delete a folder
    const handleDeleteFolder = (folderId: string) => {
        RNAlert.alert(
            "Delete Folder",
            "Are you sure you want to delete this folder? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        // Check if folder has subfolders
                        const hasSubfolders = folders.some(
                            (folder) => folder.parentId === folderId
                        )

                        if (hasSubfolders) {
                            setAlert({
                                visible: true,
                                message: "Cannot delete folder with subfolders",
                                type: "error",
                            })
                            return
                        }

                        // Remove the folder
                        const updatedFolders = folders.filter(
                            (folder) => folder.id !== folderId
                        )
                        setFolders(updatedFolders)

                        setAlert({
                            visible: true,
                            message: "Folder deleted successfully",
                            type: "success",
                        })
                        logger.debug("Deleted folder", { folderId })
                    },
                },
            ]
        )
    }

    // Handle search
    const handleSearch = (query: string) => {
        setSearchQuery(query)
        logger.debug("Searching folders", { query })
    }

    // Show folder options menu
    const showFolderOptions = (folder: Folder) => {
        logger.debug("Showing options for folder", { folderId: folder.id })
        RNAlert.alert(`${folder.title}`, "Choose an action", [
            {
                text: "Edit",
                onPress: () => {
                    setFolderToEdit(folder)
                    setEditModalVisible(true)
                },
            },
            {
                text: "Share",
                onPress: () => handleShareFolder(folder),
            },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => handleDeleteFolder(folder.id),
            },
            {
                text: "Cancel",
                style: "cancel",
            },
        ])
    }

    const handleShareFolder = async (folder: Folder) => {
        try {
            // Placeholder - In the future, replace with actual ZIP file sharing
            RNAlert.alert(
                "Sharing",
                `Folder "${folder.title}" will be shared soon!`
            )
            logger.debug("Sharing folder", {
                folderId: folder.id,
                title: folder.title,
            })
        } catch (error) {
            logger.debug("Error sharing folder", { error })
            RNAlert.alert("Error", "Failed to share the folder.")
        }
    }

    // Filter folders based on search query
    const filteredFolders = searchQuery
        ? folders.filter(
              (folder) =>
                  folder.parentId === currentFolderId &&
                  folder.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : getCurrentFolders()

    // Get custom icon for folder if needed
    const getFolderIcon = (folder: Folder) => {
        if (folder.type === "custom" && folder.customIconId) {
            return getIconById(folder.customIconId, colors as ThemeColors)
        }
        return undefined
    }

    // Render folder item with long press handling
    const renderFolderItem = ({ item }: { item: Folder }) => (
        <FolderCard
            title={item.title}
            type={item.type}
            customIcon={
                item.type === "custom" ? getFolderIcon(item) : undefined
            }
            onPress={() => handleFolderPress(item.id)}
            onLongPress={() => showFolderOptions(item)} // Use the onLongPress prop
            testID={`folder-${item.id}`}
        />
    )

    return (
        <Container testID="folder-main-view">
            <View style={styles.contentContainer}>
                <Stack spacing={16} style={styles.scrollContent}>
                    {/* Header and Search */}
                    <Stack spacing={8}>
                        {/* Breadcrumb navigation */}
                        {currentFolderId && (
                            <Row
                                align="center"
                                justify="flex-start"
                                spacing={4}
                                style={styles.breadcrumb}
                            >
                                <Text
                                    variant="sm"
                                    weight="medium"
                                    style={{ color: colors.primary }}
                                    onPress={handleBackPress}
                                >
                                    {"< Back to " +
                                        (folders.find(
                                            (f) =>
                                                f.id ===
                                                folders.find(
                                                    (folder) =>
                                                        folder.id ===
                                                        currentFolderId
                                                )?.parentId
                                        )?.title || "Folders")}
                                </Text>
                            </Row>
                        )}

                        {/* Current folder title */}
                        <Text variant="xl" weight="bold" style={styles.title}>
                            {getCurrentFolderName()}
                        </Text>

                        {/* Search bar */}
                        <SearchBar
                            placeholder="Search folders..."
                            onSearch={handleSearch}
                        />
                    </Stack>

                    <Spacer size={8} />

                    {/* Folder list */}
                    <FlatList
                        data={filteredFolders}
                        keyExtractor={(item) => item.id}
                        renderItem={renderFolderItem}
                        contentContainerStyle={styles.listContent}
                        testID="folder-list"
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={{ color: colors.secondaryText }}>
                                    No folders found. Create a new folder to get
                                    started.
                                </Text>
                            </View>
                        }
                    />
                </Stack>

                {/* Fixed position button container */}
                <View style={styles.secondButtonContainer}>
                    <Button
                        title="Add Solo Document"
                        onPress={handleAddSingleDocument}
                        testID="add-document"
                    />
                </View>

                {/* Fixed position button container */}

                <View style={styles.buttonContainer}>
                    <Button
                        title="Create New Folder"
                        onPress={handleCreateFolderPress}
                        testID="create-folder-button"
                    />
                </View>

                {/* Create Folder Modal */}
                <FolderCreateModal
                    isVisible={createModalVisible}
                    onClose={() => setCreateModalVisible(false)}
                    onCreateFolder={handleCreateFolder}
                    parentFolderId={currentFolderId}
                />

                {/* Edit Folder Modal */}
                {folderToEdit && (
                    <FolderEditModal
                        isVisible={editModalVisible}
                        onClose={() => {
                            setEditModalVisible(false)
                            setFolderToEdit(null)
                        }}
                        onUpdateFolder={handleUpdateFolder}
                        folderId={folderToEdit.id}
                        initialName={folderToEdit.title}
                        initialType={folderToEdit.type || "custom"}
                        initialCustomIconId={folderToEdit.customIconId}
                    />
                )}
            </View>

            {/* Alert notification positioned at the bottom */}
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

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        position: "relative",
    },
    scrollContent: {
        flex: 1,
    },
    breadcrumb: {
        paddingVertical: 8,
    },
    title: {
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 100, // Leave space for the button and TabBar
    },
    emptyContainer: {
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    secondButtonContainer: {
        position: "absolute",
        bottom: 120,
        left: 20,
        right: 20,
        zIndex: 1,
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
