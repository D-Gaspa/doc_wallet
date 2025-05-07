import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react"
import { Alert as RNAlert, StyleSheet, View } from "react-native"
import { Container, Stack } from "../../layout"
import { Alert as AlertComponent, AlertType } from "../../feedback/Alert"
import { LoggingService } from "../../../../services/monitoring/loggingService"
import { FolderModal, FolderType } from "./FolderModal"
import { TagProvider, useTagContext } from "../../tag_functionality/TagContext"
import { BatchTagManager } from "../../tag_functionality/BatchTagManager"
import { FolderHeader, FolderSortOption } from "./FolderHeader"
import { ItemsList } from "./ItemsList"
import { ItemSelectionControls } from "./ItemSelectionControls"
import { TagManagerSection } from "../../tag_functionality/TagManagerSection"
import { useItemOperations } from "./useItemOperations.ts"
import { useSelectionMode } from "./useSelectionMode"
import { RouteProp, useIsFocused, useRoute } from "@react-navigation/native"
import { Folder, ListItem } from "./types"
import { useFolderStore } from "../../../../store/useFolderStore.ts"
import { useDocStore } from "../../../../store"
import { DocumentType, IDocument } from "../../../../types/document.ts"
import { documentPreview } from "../../../../services/document/preview.ts"
import { documentStorage } from "../../../../services/document/storage.ts"
import * as FileSystem from "expo-file-system"
import { LoadingOverlay } from "../../feedback/LoadingOverlay.tsx"
import { ItemMoveModal } from "./ItemMoveModal.tsx"
import { TabParamList } from "../../../../App"
import { FolderActionModal } from "./FolderActionModal.tsx"
import { AddDocumentDetailsSheet } from "../documents/AddDocumentDetailsSheet.tsx"
import { ExpandingFab } from "../../../ExpandingFab.tsx"
import { documentImport } from "../../../../services/document/import.ts"
import { types } from "@react-native-documents/picker"
import { useDocumentOperations } from "../documents/useDocumentOperations"
import { FA6IconName } from "../../../../types/icons"

export interface FolderMainViewRef {
    resetToRootFolder(): void

    navigateToFolder(folderId: string): void
}

type FolderMainViewRouteProp = RouteProp<TabParamList, "Home">

const FolderMainViewContent = forwardRef<FolderMainViewRef, unknown>(
    (_props, ref) => {
        const logger = useMemo(
            () => LoggingService.getLogger("FolderMainView"),
            [],
        )

        // State and Hooks
        const tagContext = useTagContext()
        const folders = useFolderStore((state) => state.folders)
        const documents = useDocStore((state) => state.documents)
        const docStoreActions = useDocStore()

        const [currentFolderId, setCurrentFolderId] = useState<string | null>(
            null,
        )
        const [searchQuery, setSearchQuery] = useState("")
        const [isLoading, setLoading] = useState(false)
        const route = useRoute<FolderMainViewRouteProp>()
        const isFocused = useIsFocused()
        const [actionModalVisible, setActionModalVisible] = useState(false)
        const [folderForAction, setFolderForAction] = useState<Folder | null>(
            null,
        )
        const [showAddDocSheet, setShowAddDocSheet] = useState(false)
        const [pendingDocument, setPendingDocument] =
            useState<IDocument | null>(null)
        const [sortOption, setSortOption] = useState<FolderSortOption>("name")
        const [moveFolderModalVisible, setMoveFolderModalVisible] =
            useState(false)
        const navigatedFromParams = useRef(false)
        const [folderModalVisible, setFolderModalVisible] = useState(false)
        const [folderModalMode, setFolderModalMode] = useState<
            "create" | "edit"
        >("create")
        const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null)
        const [alert, setAlert] = useState<{
            visible: boolean
            message: string
            type: AlertType
        }>({
            visible: false,
            message: "",
            type: "info",
        })
        const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>(
            [],
        )
        const [batchTagModalVisible, setBatchTagModalVisible] = useState(false)

        const {
            getCurrentFolderName,
            handleCreateFolder,
            handleUpdateFolder,
            handleShareFolder,
            handleDeleteFolder,
            handleToggleFolderFavorite,
            handleMoveItems,
        } = useItemOperations({
            currentFolderId,
            setAlert,
            setFolderModalMode,
            setFolderToEdit,
            setFolderModalVisible,
            logger,
        })

        const {
            selectionMode,
            selectedItems,
            toggleSelectionMode,
            handleSelectAll,
            handleItemSelect,
            setSelectedItems,
        } = useSelectionMode()

        const {
            handleToggleFavorite: handleToggleDocumentFavorite,
            handleDeleteDocument,
            handleShareDocument,
            isFavorite: isDocumentFavorite,
        } = useDocumentOperations()

        // Handlers
        const handleAddDocumentPress = async () => {
            setLoading(true)
            try {
                const importedDocsResult = await documentImport.importDocument({
                    allowMultiple: false,
                    fileTypes: [types.pdf, types.images, types.docx],
                    allowVirtualFiles: true,
                })
                if (importedDocsResult.length > 0) {
                    const docFile = importedDocsResult[0]
                    const tempDoc: IDocument = {
                        id: `temp_${Date.now()}`,
                        title: docFile.name ?? `Documento_${Date.now()}`,
                        sourceUri: docFile.localUri || docFile.uri,
                        metadata: {
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            type:
                                (docFile.type as DocumentType) ??
                                DocumentType.UNKNOWN,
                            mimeType: docFile.mimeType || undefined,
                        },
                        tags: [],
                        parameters: [],
                    }
                    logger.debug(
                        "Documento seleccionado, mostrando hoja de detalles",
                        { tempId: tempDoc.id },
                    )
                    setPendingDocument(tempDoc)
                    setShowAddDocSheet(true)
                } else {
                    logger.debug(
                        "Importación de documento cancelada por el usuario.",
                    )
                }
            } catch (error) {
                logger.error("Error al seleccionar documento:", error)
                setAlert({
                    visible: true,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Error al seleccionar el documento.",
                    type: "error",
                })
            } finally {
                setLoading(false)
            }
        }

        const handleSaveDocument = useCallback(
            async (
                doc: IDocument,
                targetFolderId: string,
                selectedTagIds: string[],
            ) => {
                setLoading(true)
                setShowAddDocSheet(false)
                setPendingDocument(null)
                try {
                    const storedDocument = await docStoreActions.addDocument({
                        title: doc.title,
                        sourceUri: doc.sourceUri,
                        tags: selectedTagIds,
                        metadata: doc.metadata,
                        parameters: doc.parameters,
                        content: doc.content,
                    })

                    if (targetFolderId !== "root") {
                        const currentFolders = useFolderStore.getState().folders
                        const updatedFolders = currentFolders.map((folder) =>
                            folder.id === targetFolderId
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
                        useFolderStore.getState().setFolders(updatedFolders) // Update store
                        logger.info(
                            `Carpeta ${targetFolderId} actualizada con documento.`,
                        )
                    }

                    tagContext.syncTagsForItem(
                        storedDocument.id,
                        "document",
                        selectedTagIds,
                    )
                    logger.info(
                        "Documento agregado exitosamente mediante FolderMainView",
                        {
                            docId: storedDocument.id,
                            folderId: targetFolderId,
                        },
                    )
                    setAlert({
                        visible: true,
                        message: "¡Documento agregado exitosamente!",
                        type: "success",
                    })
                } catch (error) {
                    logger.error("Error al guardar el documento:", error)
                    setAlert({
                        visible: true,
                        message:
                            error instanceof Error
                                ? error.message
                                : "Error al guardar el documento.",
                        type: "error",
                    })
                } finally {
                    setLoading(false)
                }
            },
            [docStoreActions, logger, setAlert, tagContext],
        )

        const internalNavigateToFolder = useCallback(
            (folderId: string | null) => {
                logger.debug("Navegando internamente a la carpeta:", folderId)
                setCurrentFolderId(folderId)
                setSearchQuery("")
                setSelectedTagFilters([])
            },
            [logger],
        )

        const handleShowActionModal = (folder: Folder) => {
            setFolderForAction(folder)
            setActionModalVisible(true)
            logger.debug("Mostrando modal de acción para la carpeta", {
                folderId: folder.id,
            })
        }

        const handleCloseActionModal = () => {
            setActionModalVisible(false)
            setFolderForAction(null)
        }

        const handleEditActionFromModal = (folder: Folder) => {
            setFolderModalMode("edit")
            setFolderToEdit(folder)
            setFolderModalVisible(true)
            setActionModalVisible(false)
            logger.debug("Activando edición desde modal de acción", {
                folderId: folder.id,
            })
        }

        const handleShareActionFromModal = (folder: Folder) => {
            handleShareFolder(folder).then((r) => r)
            setActionModalVisible(false)
        }

        const handleDeleteActionFromModal = (folder: Folder) => {
            handleDeleteFolder(folder.id)
            setActionModalVisible(false)
        }

        const handleConfirmMoveInModal = (targetFolderId: string | null) => {
            if (selectedItems.length > 0) {
                if (targetFolderId === null) {
                    setAlert({
                        visible: true,
                        message: "No se puede mover elementos a la raíz.",
                        type: "error",
                    })
                    setMoveFolderModalVisible(false)
                    toggleSelectionMode()
                    return
                }
                handleMoveItems(selectedItems, targetFolderId)
            } else {
                logger.warn("Intento de mover sin elementos seleccionados.")
            }
            setMoveFolderModalVisible(false)
            if (selectionMode) toggleSelectionMode()
        }

        const handleDocumentPress = useCallback(
            async (doc: IDocument) => {
                if (selectionMode) {
                    handleItemSelect(doc.id, "document")
                } else {
                    setLoading(true)
                    try {
                        const previewResult =
                            await docStoreActions.getDocumentPreview(doc.id)
                        if (!previewResult || !previewResult.sourceUri) {
                            setAlert({
                                visible: true,
                                message:
                                    "No se encontró vista previa para este documento.",
                                type: "error",
                            })
                            setLoading(false)
                            return
                        }
                        const mimeType =
                            documentPreview.getMimeTypeForDocumentType(
                                previewResult.metadata?.type ??
                                    DocumentType.UNKNOWN,
                            )
                        const fileInfo = await FileSystem.getInfoAsync(
                            previewResult.sourceUri,
                        )
                        if (!fileInfo.exists || fileInfo.size === 0) {
                            setAlert({
                                visible: true,
                                message:
                                    "El archivo de vista previa falta o está vacío.",
                                type: "error",
                            })
                            setLoading(false)
                            return
                        }
                        await documentPreview.viewDocumentByUri(
                            previewResult.sourceUri,
                            mimeType,
                            async () => {
                                if (
                                    previewResult.sourceUri.includes(
                                        FileSystem.cacheDirectory || "",
                                    )
                                ) {
                                    // Only delete if it's a cache file
                                    await documentStorage.deletePreviewFile(
                                        previewResult.sourceUri,
                                    )
                                    logger.debug(
                                        "Archivo de vista previa limpiado después de la visualización.",
                                    )
                                }
                            },
                        )
                    } catch (err) {
                        logger.error(
                            "Error al abrir la vista previa del documento",
                            err,
                        )
                        setAlert({
                            visible: true,
                            message: documentPreview.getErrorMessage(err),
                            type: "error",
                        })
                    } finally {
                        setLoading(false)
                    }
                }
            },
            [
                selectionMode,
                handleItemSelect,
                docStoreActions,
                logger,
                setAlert,
            ],
        )

        const handleFolderPress = useCallback(
            (folderId: string) => {
                if (selectionMode) {
                    handleItemSelect(folderId, "folder")
                } else {
                    internalNavigateToFolder(folderId)
                }
            },
            [selectionMode, handleItemSelect, internalNavigateToFolder],
        )

        const handleFolderLongPress = useCallback(
            (folderId: string) => {
                if (!selectionMode) {
                    toggleSelectionMode()
                }
                handleItemSelect(folderId, "folder")
            },
            [selectionMode, toggleSelectionMode, handleItemSelect],
        )

        const handleDocumentLongPress = useCallback(
            (documentId: string) => {
                if (!selectionMode) {
                    toggleSelectionMode()
                }
                handleItemSelect(documentId, "document")
            },
            [selectionMode, toggleSelectionMode, handleItemSelect],
        )

        const handleBackPress = () => {
            if (selectionMode) {
                toggleSelectionMode()
                return
            }
            if (currentFolderId === null) return
            const currentFolder = folders.find((f) => f.id === currentFolderId)
            if (currentFolder) {
                logger.debug("Navegando a la carpeta padre", {
                    from: currentFolderId,
                    to: currentFolder.parentId,
                })
                internalNavigateToFolder(currentFolder.parentId)
            }
        }

        const handleCreateFolderPress = () => {
            setFolderModalMode("create")
            setFolderToEdit(null)
            setFolderModalVisible(true)
        }

        const handleSaveFolderModal = (
            folderName: string,
            folderType: FolderType,
            customIconId?: FA6IconName,
            customIconColor?: string,
            folderId?: string,
        ) => {
            if (folderId) {
                // Edit mode
                handleUpdateFolder(
                    folderId,
                    folderName,
                    folderType,
                    customIconId,
                    customIconColor,
                )
            } else {
                // Create mode
                handleCreateFolder(
                    folderName,
                    folderType,
                    customIconId,
                    customIconColor,
                )
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

        const handleBatchDelete = () => {
            if (selectedItems.length === 0) return
            RNAlert.alert(
                "Confirmar Eliminación",
                `¿Estás seguro de que quieres eliminar ${selectedItems.length} elemento(s) seleccionado(s)? Esta acción no se puede deshacer. Las carpetas deben estar vacías para ser eliminadas.`,
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Eliminar",
                        style: "destructive",
                        onPress: async () => {
                            setLoading(true)
                            let successCount = 0
                            let errorCount = 0
                            let skippedNonEmptyFolders = 0
                            const itemsToDelete = [...selectedItems]

                            if (selectionMode) toggleSelectionMode()
                            setSelectedItems([])

                            for (const item of itemsToDelete) {
                                try {
                                    if (item.type === "folder") {
                                        const folderToDelete = folders.find(
                                            (f) => f.id === item.id,
                                        )
                                        if (folderToDelete) {
                                            const hasSubfolders = folders.some(
                                                (f) => f.parentId === item.id,
                                            )
                                            const hasDocs =
                                                folderToDelete.documentIds &&
                                                folderToDelete.documentIds
                                                    .length > 0
                                            if (!hasSubfolders && !hasDocs) {
                                                handleDeleteFolder(item.id)
                                                successCount++
                                            } else {
                                                skippedNonEmptyFolders++
                                                errorCount++
                                                logger.warn(
                                                    `Omitting carpeta no vacía en lote: ${item.id}`,
                                                )
                                            }
                                        } else {
                                            errorCount++
                                        }
                                    } else if (item.type === "document") {
                                        await docStoreActions.deleteDocument(
                                            item.id,
                                        )
                                        successCount++
                                    }
                                } catch (e) {
                                    logger.error(
                                        `Falló al eliminar elemento ${item.type} ${item.id}`,
                                        e,
                                    )
                                    errorCount++
                                }
                            }
                            setLoading(false)
                            let message = `${successCount} elemento(s) eliminado(s).`
                            if (errorCount > 0) {
                                message += ` ${errorCount} fallaron`
                                if (skippedNonEmptyFolders > 0)
                                    message += ` (${skippedNonEmptyFolders} carpeta(s) no vacía(s) omitida(s))`
                                message += `.`
                            } else if (skippedNonEmptyFolders > 0) {
                                message += ` ${skippedNonEmptyFolders} carpeta(s) no vacía(s) omitida(s).`
                            }
                            setAlert({
                                visible: true,
                                message: message,
                                type: errorCount > 0 ? "warning" : "success",
                            })
                        },
                    },
                ],
            )
        }

        useEffect(() => {
            const targetFolderId = route.params?.folderId
            if (isFocused && targetFolderId && !navigatedFromParams.current) {
                logger.debug(
                    `FolderMainView enfocado con parámetro folderId: ${targetFolderId}`,
                )
                internalNavigateToFolder(targetFolderId)
                navigatedFromParams.current = true
            } else if (!isFocused) {
                navigatedFromParams.current = false
            }
        }, [
            isFocused,
            route.params?.folderId,
            internalNavigateToFolder,
            logger,
        ])

        useImperativeHandle(ref, () => ({
            resetToRootFolder: () => {
                logger.debug("Restableciendo a la vista de carpeta raíz")
                internalNavigateToFolder(null)
                if (selectionMode) toggleSelectionMode()
            },
            navigateToFolder: internalNavigateToFolder,
        }))

        const displayItems = useMemo(() => {
            const currentLevelFolders = folders.filter(
                (f) => f.parentId === currentFolderId,
            )
            const currentFolderData = folders.find(
                (f) => f.id === currentFolderId,
            )
            const currentLevelDocumentIds = currentFolderData?.documentIds || []
            const currentLevelDocuments = documents.filter((doc) =>
                currentLevelDocumentIds.includes(doc.id),
            )

            const allPotentialItems: ListItem[] = [
                ...currentLevelFolders.map(
                    (folder): ListItem => ({ type: "folder", data: folder }),
                ),
                ...currentLevelDocuments.map(
                    (doc): ListItem => ({ type: "document", data: doc }),
                ),
            ]

            const filteredItems = allPotentialItems.filter((item) => {
                const title = item.data.title || ""
                const matchesSearch =
                    !searchQuery ||
                    title.toLowerCase().includes(searchQuery.toLowerCase())
                let matchesTags = true
                if (selectedTagFilters.length > 0) {
                    const itemTags = tagContext.getTagsForItem(
                        item.data.id,
                        item.type,
                    )
                    const itemTagIds = itemTags.map((tag) => tag.id)
                    matchesTags = selectedTagFilters.every((tagId) =>
                        itemTagIds.includes(tagId),
                    )
                }
                return matchesSearch && matchesTags
            })

            const folderItems = filteredItems.filter(
                (
                    item,
                ): item is ListItem & {
                    type: "folder"
                    data: Folder
                } => item.type === "folder",
            )
            const documentItems = filteredItems.filter(
                (
                    item,
                ): item is ListItem & {
                    type: "document"
                    data: IDocument
                } => item.type === "document",
            )

            folderItems.sort((a, b) => {
                if (sortOption === "name")
                    return (a.data.title || "").localeCompare(
                        b.data.title || "",
                    )
                if (sortOption === "date")
                    return (
                        (b.data.updatedAt?.getTime() ?? 0) -
                        (a.data.updatedAt?.getTime() ?? 0)
                    )
                if (sortOption === "type")
                    return (a.data.type || "custom").localeCompare(
                        b.data.type || "custom",
                    )
                return 0
            })
            documentItems.sort((a, b) =>
                (a.data.title || "").localeCompare(b.data.title || ""),
            )

            return [...folderItems, ...documentItems]
        }, [
            folders,
            documents,
            currentFolderId,
            searchQuery,
            selectedTagFilters,
            sortOption,
            tagContext.associations,
            tagContext.tags,
        ])

        const emptyListMessage = useMemo(() => {
            const isFiltering =
                searchQuery !== "" || selectedTagFilters.length > 0
            if (isFiltering)
                return "No hay elementos que coincidan con tus criterios."
            else if (currentFolderId !== null) return "Esta carpeta está vacía."
            else return "No hay carpetas o documentos en el nivel raíz."
        }, [searchQuery, selectedTagFilters.length, currentFolderId])

        const createInitialModalData = useMemo(
            () => ({
                name: "",
                type: "custom" as FolderType,
                customIconId: undefined,
                customIconColor: undefined,
            }),
            [],
        )

        return (
            <Container testID="folder-main-view">
                <View style={styles.contentContainer}>
                    <Stack spacing={0} style={styles.scrollContent}>
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

                        {selectionMode && (
                            <ItemSelectionControls
                                selectedItems={selectedItems}
                                displayItems={displayItems}
                                toggleSelectionMode={toggleSelectionMode}
                                handleSelectAll={() =>
                                    handleSelectAll(displayItems)
                                }
                                setBatchTagModalVisible={
                                    setBatchTagModalVisible
                                }
                                onMovePress={() => {
                                    if (selectedItems.length > 0)
                                        setMoveFolderModalVisible(true)
                                    else
                                        setAlert({
                                            visible: true,
                                            message:
                                                "Selecciona elementos para mover.",
                                            type: "info",
                                        })
                                }}
                                onDeletePress={handleBatchDelete}
                            />
                        )}

                        <ItemsList
                            items={displayItems}
                            selectionMode={selectionMode}
                            selectedItems={selectedItems}
                            onItemSelect={handleItemSelect}
                            isSelectionList={false}
                            onFolderPress={handleFolderPress}
                            onDocumentPress={handleDocumentPress}
                            onFolderLongPress={handleFolderLongPress}
                            onDocumentLongPress={handleDocumentLongPress}
                            onDocumentToggleFavorite={
                                handleToggleDocumentFavorite
                            }
                            onDocumentDelete={handleDeleteDocument}
                            onDocumentShare={handleShareDocument}
                            getIsDocumentFavorite={isDocumentFavorite}
                            onFolderOptionsPress={handleShowActionModal}
                            onFolderToggleFavorite={handleToggleFolderFavorite}
                            emptyListMessage={emptyListMessage}
                            testID="folder-items-list"
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

                    <FolderModal
                        isVisible={folderModalVisible}
                        onClose={() => {
                            setFolderModalVisible(false)
                            setFolderToEdit(null)
                        }}
                        onSave={handleSaveFolderModal}
                        mode={folderModalMode}
                        initialData={
                            folderModalMode === "create"
                                ? createInitialModalData
                                : folderToEdit
                                ? {
                                      id: folderToEdit.id,
                                      name: folderToEdit.title,
                                      type: folderToEdit.type || "custom",
                                      customIconId: folderToEdit.customIconId,
                                      customIconColor:
                                          folderToEdit.customIconColor,
                                      favorite: folderToEdit.favorite,
                                  }
                                : createInitialModalData
                        }
                    />
                    <AddDocumentDetailsSheet
                        visible={showAddDocSheet}
                        document={pendingDocument}
                        onClose={() => {
                            setShowAddDocSheet(false)
                            setPendingDocument(null)
                            logger.debug(
                                "Hoja 'Agregar Detalles de Documento' cerrada.",
                            )
                        }}
                        onSave={handleSaveDocument}
                    />
                    <BatchTagManager
                        isVisible={batchTagModalVisible}
                        onClose={() => setBatchTagModalVisible(false)}
                        items={selectedItems}
                        onTagsApplied={() => {
                            if (selectionMode) toggleSelectionMode()
                        }}
                    />
                    <ItemMoveModal
                        isVisible={moveFolderModalVisible}
                        onClose={() => setMoveFolderModalVisible(false)}
                        folders={folders}
                        selectedItemsToMove={selectedItems}
                        onMove={handleConfirmMoveInModal}
                    />
                    <FolderActionModal
                        isVisible={actionModalVisible}
                        onClose={handleCloseActionModal}
                        folder={folderForAction}
                        onShare={handleShareActionFromModal}
                        onEdit={handleEditActionFromModal}
                        onDelete={handleDeleteActionFromModal}
                    />
                </View>
                <LoadingOverlay visible={isLoading} />
                {alert.visible && (
                    <View style={styles.alertContainer}>
                        <AlertComponent
                            type={alert.type}
                            message={alert.message}
                            visible={alert.visible}
                            onClose={() =>
                                setAlert({ ...alert, visible: false })
                            }
                            autoDismiss={true}
                            duration={
                                alert.type === "error" ||
                                alert.type === "warning"
                                    ? 5000
                                    : 3000
                            }
                        />
                    </View>
                )}
            </Container>
        )
    },
)

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
        flexGrow: 1,
        paddingBottom: 80,
    },
    alertContainer: {
        position: "absolute",
        bottom: 90,
        left: 20,
        right: 20,
        zIndex: 1000,
    },
})
