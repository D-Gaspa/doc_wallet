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

interface UseFolderOperationsProps {
    folders: Folder[]
    setFolders: (folders: Folder[]) => void
    currentFolderId: string | null
    setAlert: React.Dispatch<React.SetStateAction<AlertState>>
    setFolderModalMode: React.Dispatch<React.SetStateAction<"create" | "edit">>
    setFolderToEdit: React.Dispatch<React.SetStateAction<Folder | null>>
    setFolderModalVisible: React.Dispatch<React.SetStateAction<boolean>>
    logger: TaggedLogger
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

        logger.debug("Moving items", {
            folderCount: folderIdsToMove.length,
            documentCount: documentIdsToMove.length,
            folderIdsToMove,
            documentIdsToMove,
            targetParentId,
        })

        // 1. Cannot move documents to root
        if (targetParentId === null && documentIdsToMove.length > 0) {
            logger.warn("Attempted to move documents to root", {
                count: documentIdsToMove.length,
            })
            setAlert({
                visible: true,
                message: "Cannot move documents to the root level.",
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
            const targetFolder = folders.find((f) => f.id === targetId)
            if (!targetFolder || !targetFolder.parentId) return false
            return wouldCreateCircularReference(folderId, targetFolder.parentId)
        }

        const anyCircularReference = folderIdsToMove.some((id) =>
            wouldCreateCircularReference(id, targetParentId),
        )
        if (anyCircularReference) {
            logger.warn("Move cancelled due to circular reference", {
                folderIdsToMove,
                targetParentId,
            })
            setAlert({
                visible: true,
                message: "Cannot move a folder into its own subfolder.",
                type: "error",
            })
            return
        }

        // 3. Check if target exists (if not null)
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

        const originalFolderParents = new Map<string, string | null>()
        folders.forEach((f) => {
            if (folderIdsToMove.includes(f.id))
                originalFolderParents.set(f.id, f.parentId)
        })

        const originalDocumentParents = new Map<string, string | null>()
        folders.forEach((f) => {
            f.documentIds?.forEach((docId) => {
                if (documentIdsToMove.includes(docId))
                    originalDocumentParents.set(docId, f.id)
            })
        })

        const updatedFolders = folders.map((folder) => {
            const updatedFolder = { ...folder }

            // A. Update moved FOLDERS: change parentId
            if (
                folderIdsToMove.includes(updatedFolder.id) &&
                updatedFolder.parentId !== targetParentId
            ) {
                updatedFolder.parentId = targetParentId
                updatedFolder.updatedAt = new Date()
            }

            // B. Update ORIGINAL PARENTS of moved FOLDERS: remove from childFolderIds
            const originalParentIdForThisFolder = originalFolderParents.get(
                updatedFolder.id,
            )
            if (
                originalParentIdForThisFolder === updatedFolder.id &&
                updatedFolder.childFolderIds
            ) {
                updatedFolder.childFolderIds =
                    updatedFolder.childFolderIds.filter(
                        (id) => !folderIdsToMove.includes(id),
                    )
            }

            // C. Update ORIGINAL PARENTS of moved DOCUMENTS: remove from documentIds
            const originalDocParentFolderIds = Array.from(
                originalDocumentParents.values(),
            )
            if (
                originalDocParentFolderIds.includes(updatedFolder.id) &&
                updatedFolder.documentIds
            ) {
                updatedFolder.documentIds = updatedFolder.documentIds.filter(
                    (id) => !documentIdsToMove.includes(id),
                )
            }

            // D. Update TARGET PARENT: add folders/docs
            if (updatedFolder.id === targetParentId) {
                const initialChildCount =
                    updatedFolder.childFolderIds?.length ?? 0
                const initialDocCount = updatedFolder.documentIds?.length ?? 0

                const currentChildFolders = new Set(
                    updatedFolder.childFolderIds || [],
                )
                folderIdsToMove.forEach((id) => currentChildFolders.add(id))
                updatedFolder.childFolderIds = Array.from(currentChildFolders)

                const currentDocIds = new Set(updatedFolder.documentIds || [])
                documentIdsToMove.forEach((id) => currentDocIds.add(id))
                updatedFolder.documentIds = Array.from(currentDocIds)

                if (
                    updatedFolder.childFolderIds.length !== initialChildCount ||
                    updatedFolder.documentIds.length !== initialDocCount
                ) {
                    updatedFolder.updatedAt = new Date()
                }
            }

            return updatedFolder
        })

        setFolders(updatedFolders)
        setAlert({
            visible: true,
            message: `${itemsToMove.length} item(s) moved successfully`,
            type: "success",
        })
        logger.info("Moved items successfully", {
            count: itemsToMove.length,
            targetParentId,
        })
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
        handleToggleFavorite,
        handleMoveItems,
        showFolderOptions: (
            folder: Folder,
            selectionMode: boolean,
            handleItemSelect: (id: string, type: "folder" | "document") => void,
        ) => showFolderOptions(folder, selectionMode, handleItemSelect),
    }
}
