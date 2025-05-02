import React from "react"
import { Alert as RNAlert } from "react-native"
import { Folder } from "./types"
import { FolderType } from "./FolderModal"
import { AlertType } from "../../feedback/Alert"

// Using the existing Alert component's types
interface AlertState {
    visible: boolean
    message: string
    type: AlertType
}

// Define a more specific logger interface instead of using 'any'
interface Logger {
    debug: (message: string, data?: Record<string, unknown>) => void
}

interface UseFolderOperationsProps {
    folders: Folder[]
    setFolders: (folders: Folder[]) => void
    currentFolderId: string | null
    setAlert: React.Dispatch<React.SetStateAction<AlertState>>
    setFolderModalMode: React.Dispatch<React.SetStateAction<"create" | "edit">>
    setFolderToEdit: React.Dispatch<React.SetStateAction<Folder | null>>
    setFolderModalVisible: React.Dispatch<React.SetStateAction<boolean>>
    logger: Logger
}

export function useFolderOperations({
    folders,
    setFolders,
    currentFolderId,
    setAlert,
    setFolderModalMode,
    setFolderToEdit,
    setFolderModalVisible,
    logger,
}: UseFolderOperationsProps) {
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

    // Create a new folder
    const handleCreateFolder = (
        folderName: string,
        folderType: FolderType,
        customIconId?: string,
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
            childFolderIds: [],
            favorite: false,
            documentIds: [],
        }

        // Update parent folder's childFolderIds if there is a parent
        const updatedFolders = [...folders]
        if (currentFolderId) {
            const parentIndex = updatedFolders.findIndex(
                (f) => f.id === currentFolderId,
            )
            if (parentIndex >= 0) {
                updatedFolders[parentIndex] = {
                    ...updatedFolders[parentIndex],
                    childFolderIds: [
                        ...(updatedFolders[parentIndex].childFolderIds || []),
                        newFolder.id,
                    ],
                }
            }
        }

        setFolders([...updatedFolders, newFolder])
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

    const handleToggleFavorite = (folderId: string) => {
        setFolders(
            folders.map(folder =>
                folder.id === folderId
                    ? { ...folder, favorite: !folder.favorite, updatedAt: new Date() } // Toggle favorite and update date
                    : folder
            )
        );
        // Optional: Show a success alert
        setAlert({
            visible: true,
            message: "Favorite status updated",
            type: "success",
        });
        logger.debug("Toggled favorite status", { folderId });
    };

    // Update an existing folder
    const handleUpdateFolder = (
        folderId: string,
        folderName: string,
        folderType: FolderType,
        customIconId?: string,
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
                            (folder) => folder.parentId === folderId,
                        )

                        // Check if folder has documents
                        const folderToDelete = folders.find(
                            (f) => f.id === folderId,
                        )
                        const hasDocuments =
                            folderToDelete?.documentIds &&
                            folderToDelete.documentIds.length > 0

                        if (hasSubfolders) {
                            setAlert({
                                visible: true,
                                message: "Cannot delete folder with subfolders",
                                type: "error",
                            })
                            return
                        }

                        if (hasDocuments) {
                            setAlert({
                                visible: true,
                                message: "Cannot delete folder with documents",
                                type: "error",
                            })
                            return
                        }

                        // Remove the folder
                        const updatedFolders = folders.filter(
                            (folder) => folder.id !== folderId,
                        )

                        // Also update parent folder's childFolderIds if applicable
                        const folderToRemove = folders.find(
                            (f) => f.id === folderId,
                        )
                        if (folderToRemove && folderToRemove.parentId) {
                            const parentIndex = updatedFolders.findIndex(
                                (f) => f.id === folderToRemove.parentId,
                            )
                            if (parentIndex >= 0) {
                                updatedFolders[parentIndex] = {
                                    ...updatedFolders[parentIndex],
                                    childFolderIds:
                                        updatedFolders[
                                            parentIndex
                                        ].childFolderIds?.filter(
                                            (id) => id !== folderId,
                                        ) || [],
                                }
                            }
                        }

                        setFolders(updatedFolders)

                        setAlert({
                            visible: true,
                            message: "Folder deleted successfully",
                            type: "success",
                        })
                        logger.debug("Deleted folder", { folderId })
                    },
                },
            ],
        )
    }

    // Handle sharing a folder
    const handleShareFolder = async (folder: Folder) => {
        try {
            // Placeholder - In the future, replace with actual ZIP file sharing
            RNAlert.alert(
                "Sharing",
                `Folder "${folder.title}" will be shared soon!`,
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

    // Move folders to a new parent
    const handleMoveFolders = (
        folderIds: string[],
        targetParentId: string | null,
    ) => {
        if (folderIds.length === 0) return

        // Verify we're not creating circular references
        const wouldCreateCircularReference = (
            folderId: string,
            targetParentId: string | null,
        ): boolean => {
            if (targetParentId === null) return false
            if (folderId === targetParentId) return true

            const targetFolder = folders.find((f) => f.id === targetParentId)
            if (!targetFolder) return false

            // Check if the target is a descendant of the folder being moved
            return wouldCreateCircularReference(folderId, targetFolder.parentId)
        }

        // Check if any folder would create a circular reference
        const anyCircularReference = folderIds.some((id) =>
            wouldCreateCircularReference(id, targetParentId),
        )
        if (anyCircularReference) {
            setAlert({
                visible: true,
                message: "Cannot move folder into its own subfolder",
                type: "error",
            })
            return
        }

        // Store original parents to update childFolderIds
        const originalParents = new Map<string, string>()
        folderIds.forEach((id) => {
            const folder = folders.find((f) => f.id === id)
            if (folder && folder.parentId !== null) {
                originalParents.set(id, folder.parentId)
            }
        })

        // Update all folders
        const updatedFolders = folders.map((folder) => {
            // Update moved folders
            if (folderIds.includes(folder.id)) {
                return {
                    ...folder,
                    parentId: targetParentId,
                    updatedAt: new Date(),
                }
            }

            // Update original parent folders (remove from childFolderIds)
            if (Array.from(originalParents.values()).includes(folder.id)) {
                const updatedChildFolderIds = (
                    folder.childFolderIds || []
                ).filter((id) => !folderIds.includes(id))
                return {
                    ...folder,
                    childFolderIds: updatedChildFolderIds,
                    updatedAt: new Date(),
                }
            }

            // Update target parent folder (add to childFolderIds)
            if (folder.id === targetParentId) {
                const updatedChildFolderIds = [
                    ...(folder.childFolderIds || []),
                    ...folderIds,
                ]
                return {
                    ...folder,
                    childFolderIds: updatedChildFolderIds,
                    updatedAt: new Date(),
                }
            }

            return folder
        })

        setFolders(updatedFolders)
        setAlert({
            visible: true,
            message: `${folderIds.length} folder(s) moved successfully`,
            type: "success",
        })
        logger.debug("Moved folders", { folderIds, targetParentId })
    }

    // Show folder options menu
    const showFolderOptions = (
        folder: Folder,
        selectionMode: boolean,
        handleFolderSelect: (id: string) => void,
    ) => {
        if (selectionMode) {
            // In selection mode, long press also toggles selection
            handleFolderSelect(folder.id)
            return
        }

        logger.debug("Showing options for folder", { folderId: folder.id })
        RNAlert.alert(`${folder.title}`, "Choose an action", [
            {
                text: "Edit",
                onPress: () => {
                    setFolderModalMode("edit")
                    setFolderToEdit(folder)
                    setFolderModalVisible(true)
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

    // Return all operations
    return {
        getCurrentFolders,
        getCurrentFolderName,
        handleCreateFolder,
        handleUpdateFolder,
        handleDeleteFolder,
        handleShareFolder,
        handleToggleFavorite,
        handleMoveFolders,
        showFolderOptions: (
            folder: Folder,
            selectionMode: boolean,
            handleFolderSelect: (id: string) => void,
        ) => showFolderOptions(folder, selectionMode, handleFolderSelect),
    }
}
