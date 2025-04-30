import { create } from "zustand"
import { persist } from "zustand/middleware"
import { asyncStorageMiddleware } from "./middleware/persist"
import type { IDocState, IDocument } from "../types/document"
import { DocumentType } from "../types/document"
import { DocumentEncryptionService } from "../services/security/documentEncryption"
import { LoggingService } from "../services/monitoring/loggingService"
import { PerformanceMonitoringService } from "../services/monitoring/performanceMonitoringService"
import { documentStorage } from "../services/document/storage"
import { generateUniqueId } from "../utils"
import { generateUniqueTitle } from "../utils/uniqueTitle.ts"

const docEncryption = new DocumentEncryptionService()
const logger = LoggingService.getLogger("DocStore")

export const useDocStore = create<IDocState>()(
    persist(
        (set, get) => ({
            documents: [],
            selectedDocument: null,
            isLoading: false,
            error: null,

            // Selectors
            getDocumentById: (id) => {
                logger.debug(`Getting document by ID: ${id}`)
                const document = get().documents.find((doc) => doc.id === id)

                if (document && document.content) {
                    const isEncrypted =
                        document.content.startsWith("encrypted:")

                    if (isEncrypted) {
                        logger.debug(
                            `Document ${id} is encrypted, preparing for decryption`,
                        )

                        const encryptedId = document.content.split(":")[1]

                        return {
                            ...document,
                            _getDecryptedContent: async () => {
                                return await docEncryption.decryptDocument(
                                    encryptedId,
                                )
                            },
                        }
                    }
                }

                return document
            },
            fetchDocument: async (
                id: string,
            ): Promise<{ document: IDocument; previewUri: string } | null> => {
                try {
                    logger.debug(`Fetching document ${id} for viewing`)
                    const document = get().documents.find(
                        (doc) => doc.id === id,
                    )

                    if (!document) {
                        logger.warn(`Document ${id} not found`)
                        return null
                    }

                    // For encrypted documents, we need to create a temporary preview file
                    if (document.sourceUri.startsWith("encrypted:")) {
                        const storage = await documentStorage
                        const previewUri = await storage.getDocumentTempUri(
                            document,
                        )

                        logger.debug(
                            `Created preview for encrypted document ${id}: ${previewUri}`,
                        )
                        return {
                            document,
                            previewUri,
                        }
                    }

                    logger.debug(
                        `Using direct path for unencrypted document ${id}: ${document.sourceUri}`,
                    )
                    return {
                        document,
                        previewUri: document.sourceUri,
                    }
                } catch (error) {
                    logger.error(`Error fetching document ${id}:`, error)
                    return null
                }
            },

            addDocument: async (documentData) => {
                PerformanceMonitoringService.startMeasure("add_document")
                try {
                    logger.info("Adding new document")
                    set({ isLoading: true, error: null })

                    const id = generateUniqueId()

                    const existingTitles = get().documents.map(
                        (doc) => doc.title?.trim() || "",
                    )
                    const baseTitle = documentData.title?.trim() || "Untitled"
                    const uniqueTitle = generateUniqueTitle(
                        baseTitle,
                        existingTitles,
                    )

                    const storage = await documentStorage
                    const storedDocument = await storage.importAndStoreDocument(
                        {
                            ...documentData,
                            id,
                            title: uniqueTitle,
                        },
                        documentData.sourceUri,
                        true,
                    )

                    set((state) => ({
                        documents: [...state.documents, storedDocument],
                        isLoading: false,
                    }))
                    logger.info(
                        `Document with file added successfully with ID: ${id}`,
                    )
                    PerformanceMonitoringService.endMeasure("add_document")
                    return storedDocument
                } catch (error) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error)
                    logger.error("Failed to add document:", error)
                    set({
                        error: errorMessage,
                        isLoading: false,
                    })
                    PerformanceMonitoringService.endMeasure("add_document")
                    throw error
                }
            },

            updateDocument: async (id, updates) => {
                PerformanceMonitoringService.startMeasure(`update_doc_${id}`)
                try {
                    logger.info(`Updating document ${id}`)
                    set({ isLoading: true, error: null })

                    const existingDoc = get().documents.find(
                        (doc) => doc.id === id,
                    )
                    if (!existingDoc) {
                        throw new Error(`Document with ID ${id} not found`)
                    }

                    const processedUpdates: Partial<IDocument> = {
                        ...updates,
                        metadata: {
                            ...(existingDoc.metadata || {}),
                            ...(updates.metadata || {}),
                            updatedAt: new Date().toISOString(),
                        },
                    }

                    if (updates.sourceUri) {
                        const storage = await documentStorage
                        const shouldEncrypt = true
                        const filename =
                            updates.sourceUri.split("/").pop() ||
                            `document_${id}`

                        await storage.saveFile(
                            updates.sourceUri,
                            id,
                            shouldEncrypt,
                            filename,
                        )

                        processedUpdates.content = shouldEncrypt
                            ? `encrypted:${id}`
                            : updates.sourceUri

                        const extension = filename
                            .split(".")
                            .pop()
                            ?.toLowerCase()
                        if (extension === "pdf" && processedUpdates.metadata) {
                            processedUpdates.metadata.type = DocumentType.PDF
                        } else if (
                            ["jpg", "jpeg", "png"].includes(extension || "") &&
                            processedUpdates.metadata
                        ) {
                            processedUpdates.metadata.type =
                                extension === "png"
                                    ? DocumentType.IMAGE_PNG
                                    : DocumentType.IMAGE
                        }

                        // Instead of deleting, set to the existing value if it exists
                        processedUpdates.sourceUri = existingDoc.sourceUri

                        logger.debug(
                            `File for document ${id} updated successfully`,
                        )
                    }
                    // Handle text content updates
                    else if (updates.content) {
                        logger.debug(
                            `Encrypting updated content for document ${id}`,
                        )
                        const encryptionSuccess =
                            await docEncryption.encryptDocument(
                                id,
                                updates.content,
                            )

                        if (encryptionSuccess) {
                            // Replace it with reference to encrypted content
                            processedUpdates.content = `encrypted:${id}`
                            logger.debug(
                                `Updated content encrypted successfully for document ${id}`,
                            )
                        } else {
                            logger.error(
                                `Failed to encrypt updated content for document ${id}`,
                            )
                        }
                    }

                    logger.debug(
                        `Tags being updated for document ${id}:`,
                        updates.tags,
                    )

                    if (updates.tags) {
                        logger.debug(
                            `Tags being updated for document ${id}: ${updates.tags}`,
                        )
                        processedUpdates.tags = updates.tags
                    }

                    set((state) => ({
                        documents: state.documents.map((doc) =>
                            doc.id === id
                                ? {
                                      ...doc,
                                      ...processedUpdates,
                                      metadata: {
                                          ...doc.metadata,
                                          ...(processedUpdates.metadata || {}),
                                          updatedAt: new Date().toISOString(),
                                      },
                                  }
                                : doc,
                        ),
                        selectedDocument:
                            state.selectedDocument?.id === id
                                ? {
                                      ...state.selectedDocument,
                                      ...processedUpdates,
                                      metadata: {
                                          ...state.selectedDocument.metadata,
                                          ...(processedUpdates.metadata || {}),
                                          updatedAt: new Date().toISOString(),
                                      },
                                  }
                                : state.selectedDocument,
                        isLoading: false,
                    }))

                    logger.info(`Document ${id} updated successfully`)
                    PerformanceMonitoringService.endMeasure(`update_doc_${id}`)
                    return get().documents.find((doc) => doc.id === id)
                } catch (error) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error)
                    logger.error(`Failed to update document ${id}:`, error)
                    set({
                        error: errorMessage,
                        isLoading: false,
                    })
                    PerformanceMonitoringService.endMeasure(`update_doc_${id}`)
                    throw error
                }
            },

            deleteDocument: async (id) => {
                try {
                    logger.info(`Deleting document ${id}`)
                    set({ isLoading: true, error: null })

                    // First find the document to check if it has encrypted content
                    const document = get().documents.find(
                        (doc) => doc.id === id,
                    )

                    if (!document) {
                        logger.error(`Document ${id} not found`)
                        throw new Error(`Document with ID ${id} not found`)
                    }

                    // If the document has a file associated, delete it from storage
                    if (document.metadata.type !== DocumentType.TEXT) {
                        const storage = await documentStorage
                        const filename = document.title || `document_${id}`

                        const deleted = await storage.deleteFile(id, filename)
                        if (!deleted) {
                            logger.warn(
                                `Could not delete file for document ${id}`,
                            )
                        } else {
                            logger.debug(
                                `File for document ${id} deleted successfully`,
                            )
                        }
                    }
                    // If document had encrypted content, delete it from secure storage
                    else if (document.content?.startsWith("encrypted:")) {
                        logger.debug(
                            `Deleting encrypted content for document ${id}`,
                        )
                        await docEncryption.deleteEncryptedDocument(id)
                    }

                    // Delete the document from the store
                    set((state) => ({
                        documents: state.documents.filter(
                            (doc) => doc.id !== id,
                        ),
                        selectedDocument:
                            state.selectedDocument?.id === id
                                ? null
                                : state.selectedDocument,
                        isLoading: false,
                    }))

                    logger.info(`Document ${id} deleted successfully`)
                } catch (error) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error)
                    logger.error(`Failed to delete document ${id}:`, error)
                    set({
                        error: errorMessage,
                        isLoading: false,
                    })
                    throw error
                }
            },

            selectDocument: (id) => {
                if (id === null) {
                    logger.debug("Clearing document selection")
                    set({ selectedDocument: null })
                    return
                }

                logger.debug(`Selecting document ${id}`)
                const document =
                    get().documents.find((doc) => doc.id === id) || null
                set({ selectedDocument: document })
            },

            getDocumentPreview: async (
                id: string,
            ): Promise<IDocument | null> => {
                try {
                    logger.debug(`Getting preview for document ${id}`)
                    const document = get().documents.find(
                        (doc) => doc.id === id,
                    )

                    if (!document) {
                        logger.warn(`Document ${id} not found`)
                        return null
                    }

                    const storage = await documentStorage

                    try {
                        const previewUri = await storage.getDocumentTempUri(
                            document,
                        )

                        logger.debug(
                            `Preview URI generated for document ${id}: ${previewUri}`,
                        )

                        // Return a new document object with the preview URI as the sourceUri
                        return {
                            ...document,
                            sourceUri: previewUri,
                            metadata: document.metadata,
                        }
                    } catch (error) {
                        logger.error(
                            `Error getting preview for document ${id}:`,
                            error,
                        )
                        return null
                    }
                } catch (error) {
                    logger.error(
                        `Error getting preview for document ${id}:`,
                        error,
                    )
                    return null
                }
            },

            getDecryptedContent: async (id: string) => {
                PerformanceMonitoringService.startMeasure(
                    `get_decrypted_content_${id}`,
                )
                try {
                    logger.debug(`Getting decrypted content for document ${id}`)
                    const document = get().documents.find(
                        (doc) => doc.id === id,
                    )
                    if (!document) {
                        logger.warn(`Document ${id} not found`)
                        PerformanceMonitoringService.endMeasure(
                            `get_decrypted_content_${id}`,
                        )
                        return null
                    }

                    // Check if content is encrypted
                    if (document.content?.startsWith("encrypted:")) {
                        logger.debug(
                            `Document ${id} is encrypted, decrypting content`,
                        )
                        const content = await docEncryption.decryptDocument(id)
                        if (content) {
                            logger.debug(
                                `Document ${id} decrypted successfully`,
                            )
                        } else {
                            logger.warn(`Failed to decrypt document ${id}`)
                        }
                        PerformanceMonitoringService.endMeasure(
                            `get_decrypted_content_${id}`,
                        )
                        return content
                    }

                    // If not encrypted, return the content directly
                    logger.debug(`Document ${id} is not encrypted`)
                    PerformanceMonitoringService.endMeasure(
                        `get_decrypted_content_${id}`,
                    )
                    return document.content
                } catch (error) {
                    logger.error(
                        `Error getting decrypted content for document ${id}:`,
                        error,
                    )
                    PerformanceMonitoringService.endMeasure(
                        `get_decrypted_content_${id}`,
                    )
                    return null
                }
            },

            cleanupTempFiles: async () => {
                try {
                    logger.debug("Cleaning up temporary files")
                    const storage = await documentStorage
                    await storage.cleanupPreviewFiles()
                    logger.debug("Temporary files cleaned up successfully")
                } catch (error) {
                    logger.error("Failed to clean up temporary files:", error)
                }
            },

            clearError: () => {
                logger.debug("Clearing document store error")
                set({ error: null })
            },
        }),
        {
            name: "doc-wallet-documents",
            storage: asyncStorageMiddleware,
            partialize: (state) => ({
                documents: state.documents,
                // We only persist documents, not loading states or errors
            }),
        },
    ),
)
