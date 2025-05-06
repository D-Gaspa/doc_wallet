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
// Se eliminó la importación no utilizada de useTheme si 'colors' era lo único que se usaba
// import { useTheme } from "../../../../hooks/useTheme";
import { TabParamList } from "../../../../App"
import { FolderActionModal } from "./FolderActionModal.tsx"
import { AddDocumentDetailsSheet } from "../documents/AddDocumentDetailsSheet.tsx"
import { ExpandingFab } from "../../../ExpandingFab.tsx" // Ruta ajustada asumiendo que está en ui/button
import { documentImport } from "../../../../services/document/import.ts" // <-- Importación agregada
import { types } from "@react-native-documents/picker" // <-- Importación agregada

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

    const tagContext = useTagContext()
    const folders = useFolderStore((state) => state.folders)
    const setFolders = useFolderStore((state) => state.setFolders)
    const docStore = useDocStore() // <-- Obtener instancia de docStore
    const documents = useDocStore((state) => state.documents) // Mantener esto si necesitas acceso reactivo

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

    const handleAddDocumentPress = async () => {
        setLoading(true)
        try {
            // Ahora documentImport y types están definidos
            const importedDocs = await documentImport.importDocument({
                allowMultiple: false,
                fileTypes: [types.pdf, types.images, types.docx],
                allowVirtualFiles: true,
            })
            if (importedDocs.length > 0) {
                const doc = importedDocs[0]
                const tempDoc: IDocument = {
                    id: `temp_${Date.now()}`,
                    title: doc.name ?? `Document_${Date.now()}`,
                    sourceUri: doc.localUri ?? doc.uri,
                    metadata: {
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        type: doc.type ?? DocumentType.UNKNOWN,
                    },
                    tags: [],
                }
                logger.debug(
                    "Documento seleccionado, mostrando hoja de detalles",
                    {
                        tempId: tempDoc.id,
                    },
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
                        : "Error al seleccionar el documento.", // Traducido
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
            // Ahora docStore está definido
            const storedDocument = await docStore.addDocument({
                title: doc.title,
                sourceUri: doc.sourceUri,
                tags: selectedTagIds,
                metadata: doc.metadata,
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
                    // Traducido
                    docId: storedDocument.id,
                    folderId: selectedFolderId,
                },
            )
            setAlert({
                visible: true,
                message: "¡Documento agregado exitosamente!", // Traducido
                type: "success",
            })
        } catch (error) {
            logger.error("Error al guardar el documento:", error) // Traducido
            setAlert({
                visible: true,
                message:
                    error instanceof Error
                        ? error.message
                        : "Error al guardar el documento.", // Traducido
                type: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const internalNavigateToFolder = (folderId: string) => {
        logger.debug("Navegando internamente a la carpeta:", folderId) // Traducido
        setCurrentFolderId(folderId)
    }

    useEffect(() => {
        const targetFolderId = route.params?.folderId
        if (isFocused && targetFolderId && !navigatedFromParams.current) {
            logger.debug(
                `FolderMainView enfocado con parámetro folderId: ${targetFolderId}`, // Traducido
            )
            internalNavigateToFolder(targetFolderId)
            navigatedFromParams.current = true
        } else if (!isFocused) {
            navigatedFromParams.current = false
        }
    }, [isFocused, route.params?.folderId])

    useImperativeHandle(ref, () => ({
        resetToRootFolder: () => {
            logger.debug("Restableciendo a la vista de carpeta raíz") // Traducido
            setCurrentFolderId(null)
        },
        navigateToFolder: internalNavigateToFolder,
    }))

    const [alert, setAlert] = useState<{
        visible: boolean
        message: string
        type: AlertType
    }>({
        visible: false,
        message: "", // Mensaje inicial vacío, sin traducción necesaria
        type: "info",
    })

    const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([])
    const [batchTagModalVisible, setBatchTagModalVisible] = useState(false)

    const {
        handleCreateFolder,
        handleUpdateFolder,
        getCurrentFolders,
        handleShareFolder,
        handleDeleteFolder,
        getCurrentFolderName,
        handleToggleFavorite,
        handleMoveFolders,
    } = useFolderOperations({
        folders,
        setFolders,
        currentFolderId,
        setAlert, // El hook manejará los mensajes que establezca
        setFolderModalMode,
        setFolderToEdit,
        setFolderModalVisible,
        logger, // El logger se pasa, las traducciones están donde se llama a logger.debug/info etc.
    })

    const {
        selectionMode,
        selectedFolderIds,
        toggleSelectionMode,
        handleSelectAll,
        handleFolderSelect,
    } = useSelectionMode()

    const sortFolders = (foldersToSort: Folder[]) => {
        // Variable renombrada internamente, sin texto de usuario
        return [...foldersToSort].sort((a, b) => {
            if (sortOption === "name") {
                return a.title.localeCompare(b.title)
            } else if (sortOption === "date") {
                const timeA = a.updatedAt?.getTime() ?? 0
                const timeB = b.updatedAt?.getTime() ?? 0
                return timeB - timeA
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

    const handleShowActionModal = (folder: Folder) => {
        setFolderForAction(folder)
        setActionModalVisible(true)
        logger.debug("Mostrando modal de acción para la carpeta", {
            folderId: folder.id,
        }) // Traducido
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
            // Traducido
            folderId: folder.id,
        })
    }

    const handleShareAction = (folder: Folder) => {
        handleShareFolder(folder)
        logger.debug("Activando compartir desde modal de acción", {
            // Traducido
            folderId: folder.id,
        })
    }

    const handleMoveSelectedFolders = (targetFolderId: string | null) => {
        if (selectedFolderIds.length === 0) return
        try {
            handleMoveFolders(selectedFolderIds, targetFolderId)
            setAlert({
                visible: true,
                message: "Se ha movido exitosamente",
                type: "success",
            })
            setMoveFolderModalVisible(false)
            toggleSelectionMode()
        } catch (error) {
            logger.error("Error durante la operación:", error)
            setAlert({
                visible: true,
                message: "Ocurrió un error al mover las carpetas.",
                type: "error",
            })
        }
    }

    const handleDocumentPress = async (doc: IDocument) => {
        setLoading(true)
        try {
            const docStoreState = useDocStore.getState() // Obtener estado actual directamente si es necesario
            await new Promise((resolve) => setTimeout(resolve, 200))
            const previewResult = await docStoreState.getDocumentPreview(doc.id)

            if (!previewResult || !previewResult.sourceUri) {
                setAlert({
                    visible: true,
                    message: "No hay vista previa para este contenido.", // Ya estaba en español
                    type: "error",
                })
                setLoading(false) // Asegurar que la carga se detenga
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
                    message: "El archivo de vista previa falta o está vacío.", // Traducido
                    type: "error",
                })
                setLoading(false) // Asegurar que la carga se detenga
                return
            }
            await documentPreview.viewDocumentByUri(
                previewResult.sourceUri,
                mimeType,
                async () => {
                    const storage = await documentStorage
                    await storage.deletePreviewFile(previewResult.sourceUri)
                    logger.debug(
                        "Archivo de vista previa limpiado después de la visualización",
                    ) // Traducido
                },
            )
        } catch (err) {
            logger.debug("Error al abrir el documento", err) // Traducido
            setAlert({
                visible: true,
                message: documentPreview.getErrorMessage(err), // Asume que esta función podría devolver texto traducido o se maneja externamente
                type: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const getDocumentsForCurrentFolder = (): IDocument[] => {
        const current = folders.find((f) => f.id === currentFolderId)
        if (!current || !current.documentIds) return []
        // Usar los documentos reactivos del store directamente
        return documents.filter((doc) => current.documentIds!.includes(doc.id))
    }

    const handleFolderPress = (folderId: string) => {
        if (selectionMode) {
            handleFolderSelect(folderId)
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
                // Traducido
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
        folderType: FolderType, // No traducir 'FolderType'
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

    const handleAddTagToFolder = (tagId: string, folderId: string) => {
        tagContext.associateTag(tagId, folderId, "folder") // 'folder' probablemente es un identificador interno, no traducir
        setAlert({
            visible: true,
            message: "Etiqueta agregada a la carpeta", // Traducido
            type: "success",
        })
        logger.debug("Etiqueta agregada a la carpeta", { tagId, folderId }) // Traducido
    }

    const filteredFolders = (() => {
        if (!searchQuery && selectedTagFilters.length === 0) {
            return getCurrentFolders()
        }
        return folders.filter((folder) => {
            const matchesSearch =
                !searchQuery ||
                folder.title.toLowerCase().includes(searchQuery.toLowerCase())
            let matchesTags = true
            if (selectedTagFilters.length > 0) {
                const folderTags = tagContext.getTagsForItem(
                    folder.id,
                    "folder", // Probablemente identificador interno
                )
                const folderTagIds = folderTags.map((tag) => tag.id)
                matchesTags = selectedTagFilters.every((tagId) =>
                    folderTagIds.includes(tagId),
                )
            }
            const inCurrentDirectory = folder.parentId === currentFolderId
            return searchQuery
                ? matchesSearch && matchesTags
                : inCurrentDirectory && matchesTags
        })
    })()

    const sortedFolders = sortFolders(filteredFolders)

    const getFilteredDocuments = () => {
        if (!searchQuery) {
            return getDocumentsForCurrentFolder()
        }
        // Usar los documentos reactivos del store directamente
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
                                            "document", // Probablemente identificador interno
                                        )}
                                        onPress={() => {
                                            if (searchQuery && parent) {
                                                setSearchQuery("")
                                                setCurrentFolderId(parent.id)
                                            } else {
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
                    <FolderSelectionControls
                        selectionMode={selectionMode}
                        selectedFolderIds={selectedFolderIds}
                        filteredFolders={filteredFolders}
                        toggleSelectionMode={toggleSelectionMode}
                        handleSelectAll={() => handleSelectAll(filteredFolders)} // Pasar filteredFolders aquí
                        setBatchTagModalVisible={setBatchTagModalVisible}
                        onMovePress={() => setMoveFolderModalVisible(true)}
                    />
                    <Spacer size={8} />
                    <FoldersList
                        folders={sortedFolders}
                        selectedFolderIds={selectedFolderIds}
                        selectedTagFilters={selectedTagFilters}
                        handleToggleFavorite={handleToggleFavorite}
                        handleFolderPress={handleFolderPress}
                        handleDeleteFolder={handleDeleteFolder}
                        handleFolderSelect={handleFolderSelect}
                        showFolderOptions={handleShowActionModal}
                        selectionMode={selectionMode}
                        handleAddTagToFolder={handleAddTagToFolder}
                        isFiltering={
                            searchQuery !== "" || selectedTagFilters.length > 0
                        }
                        hasDocuments={documentsToShow.length > 0}
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
                <UnifiedFolderModal
                    isVisible={folderModalVisible}
                    onClose={() => {
                        setFolderModalVisible(false)
                        setFolderToEdit(null)
                    }}
                    onSave={handleSaveFolder}
                    mode={folderModalMode} // 'create' | 'edit' son identificadores
                    initialData={
                        folderToEdit
                            ? {
                                  id: folderToEdit.id,
                                  name: folderToEdit.title,
                                  type: folderToEdit.type || "custom", // 'custom' probablemente identificador interno
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
                            "Hoja de detalles 'Agregar Documento' cerrada.",
                        ) // Traducido
                    }}
                    //@ts-expect-error ignoring error
                    onSave={handleSaveDocument}
                    folders={folders}
                    setFolders={setFolders}
                />
                <BatchTagManager
                    isVisible={batchTagModalVisible}
                    onClose={() => setBatchTagModalVisible(false)}
                    itemIds={selectedFolderIds}
                    itemType="folder" // Probablemente identificador interno
                    onTagsApplied={() => {
                        toggleSelectionMode()
                    }}
                />
                <FolderMoveModal
                    isVisible={moveFolderModalVisible}
                    onClose={() => setMoveFolderModalVisible(false)}
                    folders={folders}
                    selectedFolderIds={selectedFolderIds}
                    onMove={handleMoveSelectedFolders}
                />
                <FolderActionModal
                    isVisible={actionModalVisible}
                    onClose={handleCloseActionModal}
                    folder={folderForAction}
                    onShare={handleShareAction}
                    onEdit={handleEditAction}
                />
            </View>
            <LoadingOverlay visible={isLoading} />
            {alert.visible && (
                <View style={styles.alertContainer}>
                    <AlertComponent
                        type={alert.type}
                        message={alert.message} // El mensaje ya se estableció traducido
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

FolderMainViewContent.displayName = "FolderMainViewContent" // No traducir displayName

export const FolderMainView = forwardRef<FolderMainViewRef, unknown>(
    (_props, ref) => (
        <TagProvider>
            <FolderMainViewContent ref={ref} />
        </TagProvider>
    ),
)

FolderMainView.displayName = "FolderMainView" // No traducir displayName

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        position: "relative",
    },
    scrollContent: {
        // Cambiado de flex: 1 para permitir que el contenido se desplace naturalmente si excede la altura de la pantalla
        flexGrow: 1,
        paddingBottom: 100, // Agregar relleno en la parte inferior para asegurar que el FAB no se superponga a los elementos finales
    },
    buttonContainer: {
        // Comentarios de estilos dejados en inglés
        position: "absolute",
        bottom: 60,
        left: 20,
        right: 20,
        zIndex: 1,
    },
    alertContainer: {
        position: "absolute",
        bottom: 90, // Adjust position based on FAB and TabBar
        left: 20,
        right: 20,
        zIndex: 100, // Ensure alert is above FAB
    },
    // Remove the old fab style if it exists
})
