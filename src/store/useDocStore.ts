import { create } from "zustand"
import { persist } from "zustand/middleware"
import { asyncStorageMiddleware } from "./middleware/persist"
import type { IDocState, IDocument } from "../types/document"
import { DocumentEncryptionService } from "../services/security/documentEncryption"
import { LoggingService } from "../services/monitoring/loggingService"
import { PerformanceMonitoringService } from "../services/monitoring/performanceMonitoringService"

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

                // If a document has encrypted content, we'll handle that
                if (document && document.content?.startsWith("encrypted:")) {
                    logger.debug(
                        `Document ${id} is encrypted, preparing for decryption`
                    )
                    // Return a promise that resolves to the document with decrypted content
                    return {
                        ...document,
                        // This is a placeholder for the actual decryption
                        // We need to check if content is encrypted and decrypt if needed
                        _getDecryptedContent: async () => {
                            const encryptedId = document.content.split(":")[1]
                            return await docEncryption.decryptDocument(
                                encryptedId
                            )
                        },
                    }
                }

                return document
            },

            getFilteredDocuments: (filterFn) => {
                logger.debug("Getting filtered documents")
                return get().documents.filter(filterFn)
            },

            // Actions
            fetchDocuments: async () => {
                PerformanceMonitoringService.startMeasure("fetch_documents")
                try {
                    logger.info("Fetching documents")
                    set({ isLoading: true, error: null })
                    // Fetch implementation will go here
                    // For now, this is just a placeholder
                    set({ isLoading: false })
                    logger.debug("Documents fetched successfully")
                    PerformanceMonitoringService.endMeasure("fetch_documents")
                } catch (error) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error)
                    logger.error("Failed to fetch documents:", error)
                    set({
                        error: errorMessage,
                        isLoading: false,
                    })
                    PerformanceMonitoringService.endMeasure("fetch_documents")
                }
            },

            addDocument: async (documentData) => {
                PerformanceMonitoringService.startMeasure("add_document")
                try {
                    logger.info("Adding new document")
                    set({ isLoading: true, error: null })

                    const id = Date.now().toString()
                    const newDocument: IDocument = {
                        ...documentData,
                        id,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    }

                    // Encrypt the document content if it exists
                    if (documentData.content) {
                        logger.debug(`Encrypting content for document ${id}`)
                        const encryptionSuccess =
                            await docEncryption.encryptDocument(
                                id,
                                documentData.content
                            )

                        if (encryptionSuccess) {
                            // Store a reference to the encrypted content, not the actual content
                            newDocument.content = `encrypted:${id}`
                            logger.debug(
                                `Document ${id} encrypted successfully`
                            )
                        } else {
                            logger.error(`Failed to encrypt document ${id}`)
                        }
                    }

                    set((state) => ({
                        documents: [...state.documents, newDocument],
                    }))

                    logger.info(`Document added successfully with ID: ${id}`)
                    PerformanceMonitoringService.endMeasure("add_document")
                    return newDocument
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
                } finally {
                    set({ isLoading: false })
                }
            },

            updateDocument: async (id, updates) => {
                PerformanceMonitoringService.startMeasure(`update_doc_${id}`)
                try {
                    logger.info(`Updating document ${id}`)
                    set({ isLoading: true, error: null })

                    const processedUpdates = { ...updates }
                    if (updates.content) {
                        logger.debug(
                            `Encrypting updated content for document ${id}`
                        )
                        const encryptionSuccess =
                            await docEncryption.encryptDocument(
                                id,
                                updates.content
                            )

                        if (encryptionSuccess) {
                            // Replace it with reference to encrypted content
                            processedUpdates.content = `encrypted:${id}`
                            logger.debug(
                                `Updated content encrypted successfully for document ${id}`
                            )
                        } else {
                            logger.error(
                                `Failed to encrypt updated content for document ${id}`
                            )
                        }
                    }

                    set((state) => ({
                        documents: state.documents.map((doc) =>
                            doc.id === id
                                ? {
                                      ...doc,
                                      ...processedUpdates,
                                      updatedAt: new Date().toISOString(),
                                  }
                                : doc
                        ),
                        selectedDocument:
                            state.selectedDocument?.id === id
                                ? {
                                      ...state.selectedDocument,
                                      ...processedUpdates,
                                      updatedAt: new Date().toISOString(),
                                  }
                                : state.selectedDocument,
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
                } finally {
                    set({ isLoading: false })
                }
            },

            deleteDocument: async (id) => {
                try {
                    logger.info(`Deleting document ${id}`)
                    set({ isLoading: true, error: null })

                    // First find the document to check if it has encrypted content
                    const document = get().documents.find(
                        (doc) => doc.id === id
                    )

                    // Delete the document from the store
                    set((state) => ({
                        documents: state.documents.filter(
                            (doc) => doc.id !== id
                        ),
                        selectedDocument:
                            state.selectedDocument?.id === id
                                ? null
                                : state.selectedDocument,
                    }))

                    // If document had encrypted content, delete it from secure storage
                    if (
                        document &&
                        document.content?.startsWith("encrypted:")
                    ) {
                        logger.debug(
                            `Deleting encrypted content for document ${id}`
                        )
                        await docEncryption.deleteEncryptedDocument(id)
                    }

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
                } finally {
                    set({ isLoading: false })
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

            getDecryptedContent: async (id: string) => {
                PerformanceMonitoringService.startMeasure(
                    `get_decrypted_content_${id}`
                )
                try {
                    logger.debug(`Getting decrypted content for document ${id}`)
                    const document = get().documents.find(
                        (doc) => doc.id === id
                    )
                    if (!document) {
                        logger.warn(`Document ${id} not found`)
                        PerformanceMonitoringService.endMeasure(
                            `get_decrypted_content_${id}`
                        )
                        return null
                    }

                    // Check if content is encrypted
                    if (document.content?.startsWith("encrypted:")) {
                        logger.debug(
                            `Document ${id} is encrypted, decrypting content`
                        )
                        const content = await docEncryption.decryptDocument(id)
                        if (content) {
                            logger.debug(
                                `Document ${id} decrypted successfully`
                            )
                        } else {
                            logger.warn(`Failed to decrypt document ${id}`)
                        }
                        PerformanceMonitoringService.endMeasure(
                            `get_decrypted_content_${id}`
                        )
                        return content
                    }

                    // If not encrypted, return the content directly
                    logger.debug(`Document ${id} is not encrypted`)
                    PerformanceMonitoringService.endMeasure(
                        `get_decrypted_content_${id}`
                    )
                    return document.content
                } catch (error) {
                    logger.error(
                        `Error getting decrypted content for document ${id}:`,
                        error
                    )
                    PerformanceMonitoringService.endMeasure(
                        `get_decrypted_content_${id}`
                    )
                    return null
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
        }
    )
)
