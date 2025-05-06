import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react"
import { Alert, StyleSheet, View } from "react-native"
import { Container, Stack } from "../../layout"
import { Alert as AlertComponent, AlertType } from "../../feedback/Alert"
import { LoggingService } from "../../../../services/monitoring/loggingService"
import { FolderType, UnifiedFolderModal } from "./FolderModal"
import { TagProvider, useTagContext } from "../../tag_functionality/TagContext"
import { BatchTagManager } from "../../tag_functionality/BatchTagManager"
import { FolderHeader, FolderSortOption } from "./FolderHeader"
import { ItemsList } from "./ItemsList"
import { ItemSelectionControls } from "./ItemSelectionControls"
import { TagManagerSection } from "../../tag_functionality/TagManagerSection"
import { useFolderOperations } from "./useFolderOperations"
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
import { showDocumentOptions } from "../documents/useDocumentOperations.ts"
import { FolderMoveModal } from "./FolderMoveModal"
import { TabParamList } from "../../../../App"
import { FolderActionModal } from "./FolderActionModal.tsx"
import { AddDocumentDetailsSheet } from "../documents/AddDocumentDetailsSheet.tsx"
import { ExpandingFab } from "../../../ExpandingFab.tsx"
import { documentImport } from "../../../../services/document/import.ts"
import { types } from "@react-native-documents/picker"

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

    // --- State and Hooks ---
    const tagContext = useTagContext()
    const folders = useFolderStore((state) => state.folders)
    const setFolders = useFolderStore((state) => state.setFolders)
    const docStore = useDocStore()
    const documents = useDocStore((state) => state.documents)

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

    // --- Operations Hooks ---
    const {
        handleCreateFolder,
        handleUpdateFolder,
        getCurrentFolderName,
        handleShareFolder,
        handleDeleteFolder,
        handleToggleFavorite,
        handleMoveItems
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
        selectedItems,
        toggleSelectionMode,
        handleSelectAll,
        handleItemSelect,
    } = useSelectionMode()

    // --- Handlers ---
    const handleAddDocumentPress = async () => {
        setLoading(true)
        try {
            const importedDocs = await documentImport.importDocument({
                allowMultiple: false,
                fileTypes: [types.pdf, types.images, types.docx],
                allowVirtualFiles: true,
            })
            if (importedDocs.length > 0) {
                const doc = importedDocs[0]
                const tempDoc: IDocument = {
                    id: `temp_${Date.now()}`,
                    title: doc.name ?? `Documento_${Date.now()}`,
                    sourceUri: doc.localUri ?? doc.uri,
                    metadata: {
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        type:
                            (doc.type as DocumentType) ?? DocumentType.UNKNOWN,
                    },
                    tags: [],
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

    const handleSaveDocument = async (
        doc: IDocument,
        selectedFolderId: string,
        selectedTagIds: string[],
    ) => {
        setLoading(true)
        setShowAddDocSheet(false)
        setPendingDocument(null)
        try {
            const storedDocument = await docStore.addDocument({
                title: doc.title,
                sourceUri: doc.sourceUri,
                tags: selectedTagIds,
                metadata: doc.metadata,
                parameters: doc.parameters ?? [],
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
            logger.info(
                "Documento agregado exitosamente mediante FolderMainView",
                {
                    docId: storedDocument.id,
                    folderId: selectedFolderId,
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
    }

    const internalNavigateToFolder = (folderId: string) => {
        logger.debug("Navegando internamente a la carpeta:", folderId)
        setCurrentFolderId(folderId)
    }

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

    const handleEditAction = (folder: Folder) => {
        setFolderModalMode("edit")
        setFolderToEdit(folder)
        setFolderModalVisible(true)
        logger.debug("Activando edición desde modal de acción", {
            folderId: folder.id,
        })
    }

    const handleShareAction = (folder: Folder) => {
        handleShareFolder(folder).then((r) => r)
        logger.debug("Activando compartir desde modal de acción", {
            folderId: folder.id,
        })
    }

    const handleMoveSelectedFolders = (targetFolderId: string | null) => {
        // The `handleMoveFolders` hook now needs to work with `selectedItems`
        // It should filter for folders within the hook or expect only folder IDs.
        // For now, let's assume the hook `handleMoveFolders` is adapted
        // to take `selectedItems` or we filter here first.
        const folderIdsToMove = selectedItems
            .filter((item) => item.type === "folder")
            .map((item) => item.id)

        if (folderIdsToMove.length === 0) {
            // TODO: Handle moving documents if required in the future
            logger.warn("No folders selected to move.")
            setAlert({
                visible: true,
                message: "No folders selected to move.",
                type: "info",
            })
            setMoveFolderModalVisible(false)
            toggleSelectionMode()
            return
        }
        try {
            // handleMoveFolders(folderIdsToMove, targetFolderId)
            setAlert({
                visible: true,
                message: "Carpeta(s) movida(s) exitosamente.",
                type: "success",
            })
            setMoveFolderModalVisible(false)
            toggleSelectionMode()
        } catch (error) {
            logger.error("Error during folder move operation:", error)
            setAlert({
                visible: true,
                message: "Ocurrió un error al mover las carpetas.",
                type: "error",
            })
        }
    }

    const handleDocumentPress = async (doc: IDocument) => {
        if (selectionMode) {
            handleItemSelect(doc.id, "document")
        } else {
            setLoading(true)
            try {
                const docStoreState = useDocStore.getState()
                await new Promise((resolve) => setTimeout(resolve, 100))
                const previewResult = await docStoreState.getDocumentPreview(
                    doc.id,
                )

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
                const mimeType = documentPreview.getMimeTypeForDocumentType(
                    previewResult.metadata?.type ?? DocumentType.PDF,
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
                        await documentStorage.deletePreviewFile(
                            previewResult.sourceUri,
                        )
                        logger.debug(
                            "Archivo de vista previa limpiado después de la visualización.",
                        )
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
    }

    const handleFolderPress = (folderId: string) => {
        if (selectionMode) {
            handleItemSelect(folderId, "folder")
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
            logger.debug("Navegando a la carpeta padre", {
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

    const handleDeleteAction = (folder: Folder) => {
        if (folder) {
            // TODO: We might want to use the Alert confirmation here as well,
            // similar to batch delete, or let handleDeleteFolder handle it.
            // Assuming handleDeleteFolder already confirms.
            handleDeleteFolder(folder.id)
        }
    }

    const handleBatchDelete = () => {
        if (selectedItems.length === 0) return

        Alert.alert(
            "Confirm Delete",
            `Are you sure you want to delete ${selectedItems.length} selected item(s)? This cannot be undone. Folders must be empty to be deleted.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true)
                        let successCount = 0
                        let errorCount = 0
                        let skippedNonEmptyFolders = 0
                        const itemsToDelete = [...selectedItems]

                        toggleSelectionMode()

                        for (const item of itemsToDelete) {
                            try {
                                if (item.type === "folder") {
                                    const folderToDelete = folders.find(
                                        (f) => f.id === item.id,
                                    )
                                    const hasChildFolders = folders.some(
                                        (f) => f.parentId === item.id,
                                    )
                                    const isEmpty =
                                        (!folderToDelete?.documentIds ||
                                            folderToDelete.documentIds
                                                .length === 0) &&
                                        !hasChildFolders

                                    if (isEmpty) {
                                        handleDeleteFolder(item.id)
                                        successCount++
                                    } else {
                                        logger.warn(
                                            `Skipping non-empty folder delete in batch: ${item.id}`,
                                        )
                                        skippedNonEmptyFolders++
                                        errorCount++
                                    }
                                } else if (item.type === "document") {
                                    await docStore.deleteDocument(item.id)
                                    successCount++
                                }
                            } catch (e) {
                                logger.error(
                                    `Failed to delete item ${item.type} ${item.id}`,
                                    e,
                                )
                                errorCount++
                            }
                        }
                        setLoading(false)

                        let message = `${successCount} item(s) deleted.`
                        if (errorCount > 0) {
                            message += ` ${errorCount} failed`
                            if (skippedNonEmptyFolders > 0) {
                                message += ` (${skippedNonEmptyFolders} non-empty folder(s) skipped)`
                            }
                            message += `.`
                        } else if (skippedNonEmptyFolders > 0) {
                            message += ` ${skippedNonEmptyFolders} non-empty folder(s) skipped.`
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

    // --- Navigation Effects ---
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
    }, [isFocused, route.params?.folderId])

    useImperativeHandle(ref, () => ({
        resetToRootFolder: () => {
            logger.debug("Restableciendo a la vista de carpeta raíz")
            setCurrentFolderId(null)
            setSearchQuery("")
            setSelectedTagFilters([])
            if (selectionMode) toggleSelectionMode()
        },
        navigateToFolder: internalNavigateToFolder,
    }))

    // --- Memoized Calculations ---
    const displayItems = useMemo(() => {
        logger.debug("Recalculando elementos a mostrar", {
            currentFolderId,
            searchQuery,
            selectedTagFilters: selectedTagFilters.length,
            sortOption,
        })
        const currentLevelFolders = folders.filter(
            (f) => f.parentId === currentFolderId,
        )
        const currentFolderData = folders.find((f) => f.id === currentFolderId)
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
            (item): item is ListItem & { type: "folder"; data: Folder } =>
                item.type === "folder",
        )
        const documentItems = filteredItems.filter(
            (item): item is ListItem & { type: "document"; data: IDocument } =>
                item.type === "document",
        )

        folderItems.sort((a, b) => {
            if (sortOption === "name")
                return (a.data.title || "").localeCompare(b.data.title || "")
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

        const finalSortedList = [...folderItems, ...documentItems]
        logger.debug(
            `Calculados ${finalSortedList.length} elementos para mostrar.`,
        )
        return finalSortedList
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
        const isFiltering = searchQuery !== "" || selectedTagFilters.length > 0
        if (isFiltering) {
            return "No hay elementos que coincidan con tus criterios."
        } else if (currentFolderId) {
            return "Esta carpeta está vacía."
        } else {
            return "No hay carpetas o documentos en el nivel raíz."
        }
    }, [searchQuery, selectedTagFilters.length, currentFolderId])

    // --- JSX Rendering ---
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
                            selectionMode={selectionMode}
                            selectedItems={selectedItems}
                            displayItems={displayItems}
                            toggleSelectionMode={toggleSelectionMode}
                            handleSelectAll={() =>
                                handleSelectAll(displayItems)
                            }
                            setBatchTagModalVisible={setBatchTagModalVisible}
                            onMovePress={() => setMoveFolderModalVisible(true)}
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
                        onFolderOptionsPress={handleShowActionModal}
                        onDocumentOptionsPress={showDocumentOptions}
                        onFolderToggleFavorite={handleToggleFavorite}
                        emptyListMessage={emptyListMessage}
                        testID="folder-items-list"
                    />
                </Stack>

                {/* FAB */}
                {!selectionMode && (
                    <ExpandingFab
                        onAddFolder={handleCreateFolderPress}
                        onAddDocument={handleAddDocumentPress}
                    />
                )}

                {/* TAG MANAGER */}
                {currentFolderId && !selectionMode && (
                    <TagManagerSection
                        folderId={currentFolderId}
                        folderName={getCurrentFolderName()}
                        handleTagFilterPress={handleTagFilterPress}
                        selectedTagFilters={selectedTagFilters}
                    />
                )}

                {/* MODALS */}
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
                        toggleSelectionMode()
                    }}
                />
                <FolderMoveModal
                    isVisible={moveFolderModalVisible}
                    onClose={() => setMoveFolderModalVisible(false)}
                    folders={folders}
                    selectedItemsToMove={selectedItems}
                    onMove={handleMoveSelectedFolders}
                />
                <FolderActionModal
                    isVisible={actionModalVisible}
                    onClose={handleCloseActionModal}
                    folder={folderForAction}
                    onShare={handleShareAction}
                    onEdit={handleEditAction}
                    onDelete={handleDeleteAction}
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
                        duration={
                            alert.type === "error" || alert.type === "warning"
                                ? 5000
                                : 3000
                        }
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
        flexGrow: 1,
        paddingBottom: 80,
    },
    alertContainer: {
        position: "absolute",
        bottom: 90,
        left: 20,
        right: 20,
        zIndex: 100,
    },
})
