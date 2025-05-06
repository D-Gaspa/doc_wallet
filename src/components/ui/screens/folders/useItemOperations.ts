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
        if (!currentFolderId) return "Folders"
        const folder = folders.find((f) => f.id === currentFolderId)
        return folder ? folder.title : "Unknown Folder"
    }

    const handleCreateFolder = (
        folderName: string,
        folderType: FolderType,
        customIconId?: string,
    ) => {
        const newFolder: Folder = {
            id: `folder-${Date.now()}`,
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

    const handleToggleFavorite = (folderId: string) => {
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

        const updatedFolders = folders.filter(
            (folder) => folder.id !== folderId,
        )

        if (folderToDelete.parentId) {
            const parentIndex = updatedFolders.findIndex(
                (f) => f.id === folderToDelete.parentId,
            )
            if (parentIndex >= 0) {
                const parentFolder = updatedFolders[parentIndex]
                updatedFolders[parentIndex] = {
                    ...parentFolder,
                    childFolderIds:
                        parentFolder.childFolderIds?.filter(
                            (id) => id !== folderId,
                        ) || [],
                    updatedAt: new Date(),
                }
            } else {
                logger.warn(
                    `Parent folder not found after filtering during delete`,
                    {
                        parentId: folderToDelete.parentId,
                        deletedFolderId: folderId,
                    },
                )
            }
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
        if (itemsToMove.length === 0) return

        const folderItemsToMove = itemsToMove.filter((i) => i.type === "folder")
        const documentItemsToMove = itemsToMove.filter(
            (i) => i.type === "document",
        )
        const folderIdsToMove = folderItemsToMove.map((i) => i.id)
        const documentIdsToMove = documentItemsToMove.map((i) => i.id)

        logger.debug("Initiating move operation", {
            folderCount: folderIdsToMove.length,
            documentCount: documentIdsToMove.length,
            targetParentId,
        })

        // Validations

        // 1. Cannot move documents to root
        if (targetParentId === null && documentIdsToMove.length > 0) {
            logger.warn("Attempted to move documents to root", {
                count: documentIdsToMove.length,
            })
            setAlert({
                visible: true,
                message:
                    "Documents cannot be moved to the root level. Please select a folder.",
                type: "error",
            })
            return
        }

        // 2. Check if target folder exists (if not moving to root)
        if (
            targetParentId !== null &&
            !folders.some((f) => f.id === targetParentId)
        ) {
            logger.error("Target folder for move not found", { targetParentId })
            setAlert({
                visible: true,
                message: "Target folder not found.",
                type: "error",
            })
            return
        }

        // 3. Check for circular folder moves (moving a folder into itself or a descendant)
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
                if (!ancestorFolder) return false
                if (ancestorFolder.id === folderId) return true
                currentAncestorId = ancestorFolder.parentId
            }
            return false
        }

        const anyCircularReference = folderIdsToMove.some((id) =>
            wouldCreateCircularReference(id, targetParentId),
        )

        if (anyCircularReference) {
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

        const originalFolderParents = new Map<string, string | null>()
        folderIdsToMove.forEach((id) => {
            const folder = folders.find((f) => f.id === id)
            if (folder) originalFolderParents.set(id, folder.parentId)
        })

        const originalDocumentParents = new Map<string, string>()
        folders.forEach((folder) => {
            folder.documentIds?.forEach((docId) => {
                if (documentIdsToMove.includes(docId)) {
                    originalDocumentParents.set(docId, folder.id)
                }
            })
        })

        const updatedFolders = folders.map((folder) => {
            const updatedFolder = { ...folder }
            let thisFolderUpdated = false

            // A. Update parentId for moved FOLDERS
            if (folderIdsToMove.includes(folder.id)) {
                if (updatedFolder.parentId !== targetParentId) {
                    updatedFolder.parentId = targetParentId
                    thisFolderUpdated = true
                    logger.debug(
                        `Updated parentId for folder ${folder.id} to ${targetParentId}`,
                    )
                }
            }

            // B. Remove moved FOLDERS from their ORIGINAL parent's childFolderIds
            const originalParentId = originalFolderParents.get(folder.id)
            if (
                folder.id === originalParentId &&
                updatedFolder.childFolderIds
            ) {
                const initialChildCount = updatedFolder.childFolderIds.length
                updatedFolder.childFolderIds =
                    updatedFolder.childFolderIds.filter(
                        (childId) => !folderIdsToMove.includes(childId),
                    )
                if (updatedFolder.childFolderIds.length !== initialChildCount) {
                    thisFolderUpdated = true
                    logger.debug(
                        `Removed moved folders from original parent ${folder.id}`,
                    )
                }
            }

            // C. Remove moved DOCUMENTS from their ORIGINAL parent's documentIds
            if (
                originalDocumentParents.get(folder.id) &&
                updatedFolder.documentIds
            ) {
                const initialDocCount = updatedFolder.documentIds.length
                updatedFolder.documentIds = updatedFolder.documentIds.filter(
                    (docId) => !documentIdsToMove.includes(docId),
                )
                if (updatedFolder.documentIds.length !== initialDocCount) {
                    thisFolderUpdated = true
                    logger.debug(
                        `Removed moved documents from original parent ${folder.id}`,
                    )
                }
            }

            // D. Add moved FOLDERS and DOCUMENTS to the TARGET parent's lists
            if (folder.id === targetParentId) {
                const currentChildIds = new Set(
                    updatedFolder.childFolderIds || [],
                )
                const initialChildCount = currentChildIds.size
                folderIdsToMove.forEach((id) => currentChildIds.add(id))
                if (currentChildIds.size !== initialChildCount) {
                    updatedFolder.childFolderIds = Array.from(currentChildIds)
                    thisFolderUpdated = true
                    logger.debug(
                        `Added moved folders to target parent ${folder.id}`,
                    )
                }

                const currentDocIds = new Set(updatedFolder.documentIds || [])
                const initialDocCount = currentDocIds.size
                documentIdsToMove.forEach((id) => currentDocIds.add(id))
                if (currentDocIds.size !== initialDocCount) {
                    updatedFolder.documentIds = Array.from(currentDocIds)
                    thisFolderUpdated = true
                    logger.debug(
                        `Added moved documents to target parent ${folder.id}`,
                    )
                }
            }

            if (thisFolderUpdated) {
                updatedFolder.updatedAt = now
                foldersStateChanged = true
            }

            return updatedFolder
        })

        if (foldersStateChanged) {
            setFolders(updatedFolders)
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

    const showFolderOptions = (
        folder: Folder,
        selectionMode: boolean,
        handleItemSelect: (id: string, type: "folder" | "document") => void,
    ) => {
        if (selectionMode) {
            handleItemSelect(folder.id, "folder")
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
        handleToggleFolderFavorite: handleToggleFavorite,
        handleMoveItems,
        showFolderOptions: (
            folder: Folder,
            selectionMode: boolean,
            handleItemSelect: (id: string, type: "folder" | "document") => void,
        ) => showFolderOptions(folder, selectionMode, handleItemSelect),
    }
}
