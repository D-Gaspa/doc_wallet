import React from "react"
import { Alert as RNAlert } from "react-native"
import { Folder } from "./types"
import { SelectedItem } from "./useSelectionMode"
import { FolderType } from "./FolderModal"
import { AlertType } from "../../feedback/Alert"

interface AlertState {
    visible: boolean
    message: string
    type: AlertType
}

interface TaggedLogger {
    debug: (message: string, ...optionalParams: unknown[]) => void
    info: (message: string, ...optionalParams: unknown[]) => void
    warn: (message: string, ...optionalParams: unknown[]) => void
    error: (message: string, ...optionalParams: unknown[]) => void
}

interface UseItemOperationsProps {
    folders: Folder[]
    setFolders: (folders: Folder[]) => void
    currentFolderId: string | null
    setAlert: React.Dispatch<React.SetStateAction<AlertState>>
    setFolderModalMode: React.Dispatch<React.SetStateAction<"create" | "edit">>
    setFolderToEdit: React.Dispatch<React.SetStateAction<Folder | null>>
    setFolderModalVisible: React.Dispatch<React.SetStateAction<boolean>>
    logger: TaggedLogger
}

export function useItemOperations({
    folders,
    setFolders,
    currentFolderId,
    setAlert,
    setFolderModalMode,
    setFolderToEdit,
    setFolderModalVisible,
    logger,
}: UseItemOperationsProps) {
    const getCurrentFolders = () => {
        return folders.filter((folder) => folder.parentId === currentFolderId)
    }

    const getCurrentFolderName = () => {
        if (!currentFolderId) return "Folders" // Root name
        const folder = folders.find((f) => f.id === currentFolderId)
        return folder ? folder.title : "Unknown Folder"
    }

    const handleCreateFolder = (
        folderName: string,
        folderType: FolderType,
        customIconId?: string,
    ) => {
        const newFolder: Folder = {
            id: `folder-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 7)}`, // More unique ID
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
                    updatedAt: new Date(),
                }
            } else {
                logger.warn("Parent folder not found during create", {
                    parentId: currentFolderId,
                })
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

    const handleToggleFolderFavorite = (folderId: string) => {
        setFolders(
            folders.map((folder) =>
                folder.id === folderId
                    ? {
                          ...folder,
                          favorite: !folder.favorite,
                          updatedAt: new Date(),
                      }
                    : folder,
            ),
        )
        setAlert({
            visible: true,
            message: "Favorite status updated",
            type: "success",
        })
        logger.debug("Toggled favorite status", { folderId })
    }

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

    const deleteSingleFolderInternal = (folderId: string): boolean => {
        logger.debug(`Internal delete check for folder`, { folderId })
        const folderToDelete = folders.find((f) => f.id === folderId)

        if (!folderToDelete) {
            logger.error(`Folder not found for internal delete`, { folderId })
            setAlert({
                visible: true,
                message: "Folder not found.",
                type: "error",
            })
            return false
        }

        const hasSubfolders = folders.some(
            (folder) => folder.parentId === folderId,
        )
        if (hasSubfolders) {
            logger.warn(`Attempted internal delete on folder with subfolders`, {
                folderId,
            })
            setAlert({
                visible: true,
                message: "Cannot delete folder: contains subfolders.",
                type: "error",
            })
            return false
        }

        const hasDocuments =
            folderToDelete?.documentIds && folderToDelete.documentIds.length > 0
        if (hasDocuments) {
            logger.warn(`Attempted internal delete on folder with documents`, {
                folderId,
            })
            setAlert({
                visible: true,
                message: "Cannot delete folder: contains documents.",
                type: "error",
            })
            return false
        }

        let updatedFolders = folders.filter((folder) => folder.id !== folderId)

        if (folderToDelete.parentId) {
            updatedFolders = updatedFolders.map((parentFolder) => {
                if (parentFolder.id === folderToDelete.parentId) {
                    return {
                        ...parentFolder,
                        childFolderIds:
                            parentFolder.childFolderIds?.filter(
                                (id) => id !== folderId,
                            ) || [],
                        updatedAt: new Date(),
                    }
                }
                return parentFolder
            })
        }

        setFolders(updatedFolders)
        logger.debug(`Internal delete successful for folder`, { folderId })
        return true
    }

    const handleDeleteFolder = (folderId: string) => {
        const folderTitle =
            folders.find((f) => f.id === folderId)?.title ?? "this folder"
        RNAlert.alert(
            `Delete "${folderTitle}"`,
            "Are you sure you want to delete this folder? Documents and subfolders must be removed first. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        logger.info(`User initiated delete via RNAlert`, {
                            folderId,
                        })
                        const success = deleteSingleFolderInternal(folderId)
                        if (success) {
                            setAlert({
                                visible: true,
                                message: "Folder deleted successfully",
                                type: "success",
                            })
                            logger.info(
                                `User delete confirmed and successful`,
                                { folderId },
                            )
                        } else {
                            logger.warn(
                                `User delete confirmed but failed internal checks`,
                                { folderId },
                            )
                        }
                    },
                },
            ],
        )
    }

    const handleShareFolder = async (folder: Folder) => {
        try {
            // Placeholder for actual share functionality
            RNAlert.alert(
                "Sharing",
                `Folder "${folder.title}" will be shared soon!`,
            )
            logger.debug("Sharing folder", {
                folderId: folder.id,
                title: folder.title,
            })
        } catch (error) {
            logger.error("Error sharing folder", {
                folderId: folder.id,
                error: error instanceof Error ? error.message : error,
            })
            RNAlert.alert("Error", "Failed to share the folder.")
        }
    }

    const handleMoveItems = (
        itemsToMove: SelectedItem[],
        targetParentId: string | null,
    ) => {
        if (itemsToMove.length === 0) {
            logger.warn("Move operation called with no items to move.")
            return
        }
        if (targetParentId === null) {
            logger.error("Move operation target cannot be root.")
            setAlert({
                visible: true,
                message:
                    "Items cannot be moved to the root directory. Please select a valid folder.",
                type: "error",
            })
            return
        }

        const folderIdsToMove = itemsToMove
            .filter((i) => i.type === "folder")
            .map((i) => i.id)
        const documentIdsToMove = itemsToMove
            .filter((i) => i.type === "document")
            .map((i) => i.id)

        logger.debug("Initiating move operation", {
            folderCount: folderIdsToMove.length,
            documentCount: documentIdsToMove.length,
            targetParentId,
        })

        // --- Validations ---
        // 1. Check if target folder exists (it should, as it's not null)
        if (!folders.some((f) => f.id === targetParentId)) {
            logger.error("Target folder for move not found", { targetParentId })
            setAlert({
                visible: true,
                message: "Target folder not found.",
                type: "error",
            })
            return
        }

        // 2. Check for circular folder moves
        const wouldCreateCircularReference = (
            folderId: string,
            targetId: string | null,
        ): boolean => {
            if (targetId === null) return false
            if (folderId === targetId) return true
            let currentAncestorId: string | null = targetId
            while (currentAncestorId !== null) {
                const ancestorFolder = folders.find(
                    (f) => f.id === currentAncestorId,
                )
                if (!ancestorFolder) return false // Should not happen if target exists
                if (ancestorFolder.id === folderId) return true
                currentAncestorId = ancestorFolder.parentId
            }
            return false
        }

        if (
            folderIdsToMove.some((id) =>
                wouldCreateCircularReference(id, targetParentId),
            )
        ) {
            logger.warn("Move cancelled due to circular reference attempt", {
                folderIdsToMove,
                targetParentId,
            })
            setAlert({
                visible: true,
                message:
                    "Cannot move a folder into itself or one of its subfolders.",
                type: "error",
            })
            return
        }

        const now = new Date()
        let foldersStateChanged = false

        // Create a mutable copy of folders to work with
        const tempFolders = folders.map((f) => ({
            ...f,
            childFolderIds: [...(f.childFolderIds || [])],
            documentIds: [...(f.documentIds || [])],
        }))

        // Step 1: Remove items from their original parents
        itemsToMove.forEach((item) => {
            const originalParentFolder = tempFolders.find(
                (f) =>
                    (item.type === "folder" &&
                        f.childFolderIds?.includes(item.id)) ||
                    (item.type === "document" &&
                        f.documentIds?.includes(item.id)),
            )

            if (originalParentFolder) {
                const parentIndex = tempFolders.findIndex(
                    (f) => f.id === originalParentFolder.id,
                )
                if (parentIndex !== -1) {
                    if (item.type === "folder") {
                        tempFolders[parentIndex].childFolderIds = tempFolders[
                            parentIndex
                        ].childFolderIds.filter((id) => id !== item.id)
                    } else {
                        // document
                        tempFolders[parentIndex].documentIds = tempFolders[
                            parentIndex
                        ].documentIds.filter((id) => id !== item.id)
                    }
                    tempFolders[parentIndex].updatedAt = now
                    foldersStateChanged = true
                    logger.debug(
                        `Removed item ${item.id} (${item.type}) from original parent ${originalParentFolder.id}`,
                    )
                }
            }
        })

        // Step 2: Update parentId for moved folders & add items to new parent
        const targetParentIndex = tempFolders.findIndex(
            (f) => f.id === targetParentId,
        )
        if (targetParentIndex === -1) {
            logger.error(
                "Critical: Target parent folder disappeared during move operation",
                { targetParentId },
            )
            setAlert({
                visible: true,
                message: "Error during move: Target folder became unavailable.",
                type: "error",
            })
            return
        }

        folderIdsToMove.forEach((folderId) => {
            const folderIndex = tempFolders.findIndex((f) => f.id === folderId)
            if (folderIndex !== -1) {
                if (tempFolders[folderIndex].parentId !== targetParentId) {
                    tempFolders[folderIndex].parentId = targetParentId
                    tempFolders[folderIndex].updatedAt = now
                    foldersStateChanged = true
                }
                if (targetParentId && targetParentIndex !== -1) {
                    if (
                        !tempFolders[targetParentIndex].childFolderIds.includes(
                            folderId,
                        )
                    ) {
                        tempFolders[targetParentIndex].childFolderIds.push(
                            folderId,
                        )
                        tempFolders[targetParentIndex].updatedAt = now
                        foldersStateChanged = true
                    }
                }
            }
        })

        documentIdsToMove.forEach((docId) => {
            if (targetParentId && targetParentIndex !== -1) {
                if (
                    !tempFolders[targetParentIndex].documentIds.includes(docId)
                ) {
                    tempFolders[targetParentIndex].documentIds.push(docId)
                    tempFolders[targetParentIndex].updatedAt = now
                    foldersStateChanged = true
                }
            }
        })

        if (foldersStateChanged) {
            setFolders(tempFolders.map((f) => ({ ...f, updatedAt: now })))
            setAlert({
                visible: true,
                message: `${itemsToMove.length} item(s) moved successfully.`,
                type: "success",
            })
            logger.info("Move operation completed successfully", {
                count: itemsToMove.length,
                targetParentId,
            })
        } else {
            logger.info(
                "Move operation resulted in no changes to folder state.",
            )
            setAlert({
                visible: true,
                message:
                    "Items are already in the target location or no valid moves.",
                type: "info",
            })
        }
    }

    const showFolderOptions = (folder: Folder) => {
        logger.debug("Showing options for folder (from useItemOperations)", {
            folderId: folder.id,
        })
        RNAlert.alert(`${folder.title}`, "Choose an action for this folder:", [
            {
                text: "Edit",
                onPress: () => {
                    setFolderModalMode("edit")
                    setFolderToEdit(folder)
                    setFolderModalVisible(true)
                },
            },
            { text: "Share", onPress: () => handleShareFolder(folder) },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => handleDeleteFolder(folder.id),
            },
            { text: "Cancel", style: "cancel" },
        ])
    }

    return {
        getCurrentFolders,
        getCurrentFolderName,
        handleCreateFolder,
        handleUpdateFolder,
        handleDeleteFolder,
        deleteSingleFolderInternal,
        handleShareFolder,
        handleToggleFolderFavorite,
        handleMoveItems,
        showFolderOptions,
    }
}
