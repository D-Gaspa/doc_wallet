import React from "react"
import { Alert as RNAlert } from "react-native"
import { Folder } from "./types"
import { SelectedItem } from "./useSelectionMode"
import { FolderType } from "./FolderModal"
import { AlertType } from "../../feedback/Alert"
import { FA6IconName } from "../../../../types/icons"
import { useFolderStore } from "../../../../store/useFolderStore"

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
    currentFolderId: string | null
    setAlert: React.Dispatch<React.SetStateAction<AlertState>>
    setFolderModalMode: React.Dispatch<React.SetStateAction<"create" | "edit">>
    setFolderToEdit: React.Dispatch<React.SetStateAction<Folder | null>>
    setFolderModalVisible: React.Dispatch<React.SetStateAction<boolean>>
    logger: TaggedLogger
}

export function useItemOperations({
    currentFolderId,
    setAlert,
    setFolderModalMode,
    setFolderToEdit,
    setFolderModalVisible,
    logger,
}: UseItemOperationsProps) {
    const folders = useFolderStore((state) => state.folders)
    const addFolderToStore = useFolderStore((state) => state.addFolder)
    const updateFolderInStore = useFolderStore((state) => state.updateFolder)
    const setFoldersInStore = useFolderStore((state) => state.setFolders)

    const getCurrentFolderName = () => {
        if (!currentFolderId) return "Carpetas"
        const folder = folders.find((f) => f.id === currentFolderId)
        return folder ? folder.title : "Carpeta Desconocida"
    }

    const handleCreateFolder = (
        folderName: string,
        folderType: FolderType,
        customIconId?: FA6IconName,
        customIconColor?: string,
    ) => {
        const newFolder: Folder = {
            id: `folder-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 7)}`,
            title: folderName,
            parentId: currentFolderId,
            type: folderType,
            customIconId: folderType === "custom" ? customIconId : undefined,
            customIconColor:
                folderType === "custom" ? customIconColor : undefined,
            isShared: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            childFolderIds: [],
            documentIds: [],
            favorite: false,
        }

        addFolderToStore(newFolder)

        if (currentFolderId) {
            const parentFolder = folders.find((f) => f.id === currentFolderId)
            if (parentFolder) {
                updateFolderInStore(currentFolderId, {
                    childFolderIds: [
                        ...(parentFolder.childFolderIds || []),
                        newFolder.id,
                    ],
                })
            } else {
                logger.warn(
                    "Carpeta padre no encontrada durante la creación para actualizar hijos",
                    { parentId: currentFolderId },
                )
            }
        }

        setAlert({
            visible: true,
            message: "Carpeta creada exitosamente.",
            type: "success",
        })
        logger.debug("Nueva carpeta creada", {
            folderId: newFolder.id,
            name: folderName,
            type: folderType,
            customIconId,
            customIconColor,
            parentId: currentFolderId,
        })
    }

    const handleUpdateFolder = (
        folderId: string,
        folderName: string,
        folderType: FolderType,
        customIconId?: FA6IconName,
        customIconColor?: string,
    ) => {
        const updates: Partial<Omit<Folder, "id" | "createdAt" | "updatedAt">> =
            {
                title: folderName,
                type: folderType,
                customIconId:
                    folderType === "custom" ? customIconId : undefined,
                customIconColor:
                    folderType === "custom" ? customIconColor : undefined,
            }
        if (folderType !== "custom") {
            updates.customIconId = undefined
            updates.customIconColor = undefined
        }

        updateFolderInStore(folderId, updates)

        setAlert({
            visible: true,
            message: "Carpeta actualizada exitosamente.",
            type: "success",
        })
        logger.debug("Carpeta actualizada", {
            folderId,
            name: folderName,
            type: folderType,
            customIconId,
            customIconColor,
        })
    }

    const handleToggleFolderFavorite = (folderId: string) => {
        const folder = folders.find((f) => f.id === folderId)
        if (folder) {
            updateFolderInStore(folderId, { favorite: !folder.favorite })
            setAlert({
                visible: true,
                message: "Estado de favorito actualizado.",
                type: "success",
            })
            logger.debug("Estado de favorito cambiado", { folderId })
        }
    }

    const deleteSingleFolderInternal = (folderIdToDelete: string): boolean => {
        logger.debug(`Verificación interna para eliminar carpeta`, {
            folderIdToDelete,
        })
        const folderToDelete = folders.find((f) => f.id === folderIdToDelete)

        if (!folderToDelete) {
            logger.error(`Carpeta no encontrada para eliminación interna`, {
                folderIdToDelete,
            })
            setAlert({
                visible: true,
                message: "Carpeta no encontrada.",
                type: "error",
            })
            return false
        }

        const hasSubfolders = folders.some(
            (f) => f.parentId === folderIdToDelete,
        )
        if (hasSubfolders) {
            logger.warn(
                `Intento de eliminación interna en carpeta con subcarpetas`,
                { folderIdToDelete },
            )
            setAlert({
                visible: true,
                message:
                    "No se puede eliminar: la carpeta contiene subcarpetas.",
                type: "error",
            })
            return false
        }

        const hasDocuments =
            folderToDelete.documentIds && folderToDelete.documentIds.length > 0
        if (hasDocuments) {
            logger.warn(
                `Intento de eliminación interna en carpeta con documentos`,
                { folderIdToDelete },
            )
            setAlert({
                visible: true,
                message:
                    "No se puede eliminar: la carpeta contiene documentos.",
                type: "error",
            })
            return false
        }

        // Filter out the folder to delete
        let updatedFolders = folders.filter((f) => f.id !== folderIdToDelete)

        // Remove from parent's childFolderIds list
        if (folderToDelete.parentId) {
            updatedFolders = updatedFolders.map((parent) => {
                if (parent.id === folderToDelete.parentId) {
                    return {
                        ...parent,
                        childFolderIds:
                            parent.childFolderIds?.filter(
                                (id) => id !== folderIdToDelete,
                            ) || [],
                        updatedAt: new Date(),
                    }
                }
                return parent
            })
        }
        setFoldersInStore(updatedFolders)
        logger.debug(`Eliminación interna exitosa para la carpeta`, {
            folderIdToDelete,
        })
        return true
    }

    const handleDeleteFolder = (folderId: string) => {
        const folderTitle =
            folders.find((f) => f.id === folderId)?.title ?? "esta carpeta"
        RNAlert.alert(
            `Eliminar "${folderTitle}"`,
            "¿Estás seguro de que quieres eliminar esta carpeta? Las subcarpetas y documentos deben eliminarse primero. Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => {
                        logger.info(`Usuario inició eliminación para carpeta`, {
                            folderId,
                        })
                        const success = deleteSingleFolderInternal(folderId)
                        if (success) {
                            setAlert({
                                visible: true,
                                message: "Carpeta eliminada exitosamente.",
                                type: "success",
                            })
                            logger.info(
                                `Eliminación de carpeta confirmada y exitosa por el usuario`,
                                { folderId },
                            )
                        } else {
                            logger.warn(
                                `Eliminación de carpeta confirmada por el usuario pero falló las verificaciones internas`,
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
                "Compartir", // Spanish
                `¡La carpeta "${folder.title}" se compartirá pronto!`, // Spanish
            )
            logger.debug("Compartiendo carpeta", {
                folderId: folder.id,
                title: folder.title,
            })
        } catch (error) {
            logger.error("Error al compartir carpeta", {
                folderId: folder.id,
                error: error instanceof Error ? error.message : error,
            })
            RNAlert.alert("Error", "Falló al compartir la carpeta.") // Spanish
        }
    }

    const handleMoveItems = (
        itemsToMove: SelectedItem[],
        targetParentId: string | null,
    ) => {
        if (itemsToMove.length === 0) {
            logger.warn("Operación de mover llamada sin elementos para mover.")
            setAlert({
                visible: true,
                message: "No hay elementos seleccionados para mover.",
                type: "info",
            })
            return
        }
        if (targetParentId === null) {
            // Moving to root is disallowed by ItemMoveModal UI
            logger.error(
                "El destino de la operación de mover no puede ser la raíz.",
            )
            setAlert({
                visible: true,
                message:
                    "Los elementos no se pueden mover al directorio raíz. Por favor selecciona una carpeta válida.",
                type: "error",
            })
            return
        }

        const tempFolders = JSON.parse(JSON.stringify(folders)) as Folder[]

        // Validations
        const targetFolderExists = tempFolders.some(
            (f) => f.id === targetParentId,
        )
        if (!targetFolderExists) {
            logger.error("Carpeta de destino para mover no encontrada", {
                targetParentId,
            })
            setAlert({
                visible: true,
                message: "Carpeta de destino no encontrada.",
                type: "error",
            })
            return
        }

        const wouldCreateCircularReference = (
            folderId: string,
            newParentId: string,
        ): boolean => {
            if (folderId === newParentId) return true
            let currentAncestorId: string | null = newParentId
            while (currentAncestorId !== null) {
                if (currentAncestorId === folderId) return true
                const ancestorFolder = tempFolders.find(
                    (f) => f.id === currentAncestorId,
                )
                currentAncestorId = ancestorFolder
                    ? ancestorFolder.parentId
                    : null
            }
            return false
        }

        for (const item of itemsToMove) {
            if (
                item.type === "folder" &&
                wouldCreateCircularReference(item.id, targetParentId)
            ) {
                logger.warn(
                    "Movimiento cancelado debido a intento de referencia circular",
                    {
                        folderId: item.id,
                        targetParentId,
                    },
                )
                setAlert({
                    visible: true,
                    message:
                        "No se puede mover una carpeta a sí misma o a una de sus subcarpetas.",
                    type: "error",
                })
                return
            }
        }

        const now = new Date()
        let changesMade = false

        itemsToMove.forEach((item) => {
            // 1. Remove from old parent
            const oldParent = tempFolders.find(
                (f) =>
                    (item.type === "folder" &&
                        f.childFolderIds?.includes(item.id)) ||
                    (item.type === "document" &&
                        f.documentIds?.includes(item.id)),
            )
            if (oldParent) {
                if (item.type === "folder") {
                    oldParent.childFolderIds = oldParent.childFolderIds?.filter(
                        (id) => id !== item.id,
                    )
                } else {
                    oldParent.documentIds = oldParent.documentIds?.filter(
                        (id) => id !== item.id,
                    )
                }
                oldParent.updatedAt = now
                changesMade = true
            }

            // 2. Update item's own parentId (if folder) and add to new parent
            const newParentIndex = tempFolders.findIndex(
                (f) => f.id === targetParentId,
            )
            if (newParentIndex === -1) {
                logger.error(
                    "Error crítico: Carpeta padre de destino desapareció durante la operación de mover",
                    { targetParentId },
                )
                throw new Error("La carpeta de destino no está disponible.")
            }

            if (item.type === "folder") {
                const folderIndex = tempFolders.findIndex(
                    (f) => f.id === item.id,
                )
                if (folderIndex !== -1) {
                    if (tempFolders[folderIndex].parentId !== targetParentId) {
                        tempFolders[folderIndex].parentId = targetParentId
                        tempFolders[folderIndex].updatedAt = now
                        changesMade = true
                    }
                    if (
                        !tempFolders[newParentIndex].childFolderIds?.includes(
                            item.id,
                        )
                    ) {
                        tempFolders[newParentIndex].childFolderIds = [
                            ...(tempFolders[newParentIndex].childFolderIds ||
                                []),
                            item.id,
                        ]
                        tempFolders[newParentIndex].updatedAt = now
                        changesMade = true
                    }
                }
            } else {
                if (
                    !tempFolders[newParentIndex].documentIds?.includes(item.id)
                ) {
                    tempFolders[newParentIndex].documentIds = [
                        ...(tempFolders[newParentIndex].documentIds || []),
                        item.id,
                    ]
                    tempFolders[newParentIndex].updatedAt = now
                    changesMade = true
                }
            }
        })

        if (changesMade) {
            setFoldersInStore(tempFolders)
            setAlert({
                visible: true,
                message: `${itemsToMove.length} elemento(s) movido(s) exitosamente.`,
                type: "success",
            })
            logger.info("Operación de mover completada exitosamente", {
                count: itemsToMove.length,
                targetParentId,
            })
        } else {
            setAlert({
                visible: true,
                message:
                    "No se realizaron cambios. Los elementos ya podrían estar en la ubicación de destino.",
                type: "info",
            })
            logger.info(
                "La operación de mover no resultó en cambios en el estado de las carpetas.",
            )
        }
    }

    const showFolderOptions = (folder: Folder) => {
        logger.debug("Mostrando opciones para la carpeta", {
            folderId: folder.id,
        })
        RNAlert.alert(
            `${folder.title}`,
            "Elige una acción para esta carpeta:",
            [
                {
                    text: "Editar",
                    onPress: () => {
                        setFolderModalMode("edit")
                        setFolderToEdit(folder)
                        setFolderModalVisible(true)
                    },
                },
                { text: "Compartir", onPress: () => handleShareFolder(folder) }, // Spanish
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => handleDeleteFolder(folder.id),
                },
                { text: "Cancelar", style: "cancel" },
            ],
        )
    }

    return {
        getCurrentFolderName,
        handleCreateFolder,
        handleUpdateFolder,
        handleDeleteFolder,
        handleShareFolder,
        handleToggleFolderFavorite,
        handleMoveItems,
        showFolderOptions,
    }
}
