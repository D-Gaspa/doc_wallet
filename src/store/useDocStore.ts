import { create } from "zustand"
import { persist } from "zustand/middleware"
import { asyncStorageMiddleware } from "./middleware/persist"
import type { IDocState, IDocument } from "../types/document"
import { DocumentEncryptionService } from "../services/security/documentEncryption"

const docEncryption = new DocumentEncryptionService()

export const useDocStore = create<IDocState>()(
    persist(
        (set, get) => ({
            documents: [],
            selectedDocument: null,
            isLoading: false,
            error: null,

            // Selectors
            getDocumentById: (id) => {
                const document = get().documents.find((doc) => doc.id === id)

                // If a document has encrypted content, we'll handle that
                if (document && document.content?.startsWith("encrypted:")) {
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
                return get().documents.filter(filterFn)
            },

            // Actions
            fetchDocuments: async () => {
                try {
                    set({ isLoading: true, error: null })
                    // Fetch implementation will go here
                    // For now, this is just a placeholder
                    set({ isLoading: false })
                } catch (error) {
                    set({
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        isLoading: false,
                    })
                    console.error("Failed to fetch documents:", error)
                }
            },

            addDocument: async (documentData) => {
                try {
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
                        const encryptionSuccess =
                            await docEncryption.encryptDocument(
                                id,
                                documentData.content
                            )

                        if (encryptionSuccess) {
                            // Store a reference to the encrypted content, not the actual content
                            newDocument.content = `encrypted:${id}`
                        } else {
                            throw new Error(
                                "Failed to encrypt document content"
                            )
                        }
                    }

                    set((state) => ({
                        documents: [...state.documents, newDocument],
                    }))

                    return newDocument
                } catch (error) {
                    set({
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        isLoading: false,
                    })
                    console.error("Failed to add document:", error)
                    throw error
                } finally {
                    set({ isLoading: false })
                }
            },

            updateDocument: async (id, updates) => {
                try {
                    set({ isLoading: true, error: null })

                    const processedUpdates = { ...updates }
                    if (updates.content) {
                        const encryptionSuccess =
                            await docEncryption.encryptDocument(
                                id,
                                updates.content
                            )

                        if (encryptionSuccess) {
                            // Replace it with reference to encrypted content
                            processedUpdates.content = `encrypted:${id}`
                        } else {
                            throw new Error("Failed to encrypt updated content")
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

                    return get().documents.find((doc) => doc.id === id)
                } catch (error) {
                    set({
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        isLoading: false,
                    })
                    console.error("Failed to update document:", error)
                    throw error
                } finally {
                    set({ isLoading: false })
                }
            },

            deleteDocument: async (id) => {
                try {
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
                        await docEncryption.deleteEncryptedDocument(id)
                    }
                } catch (error) {
                    set({
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        isLoading: false,
                    })
                    console.error("Failed to delete document:", error)
                    throw error
                } finally {
                    set({ isLoading: false })
                }
            },

            selectDocument: (id) => {
                if (id === null) {
                    set({ selectedDocument: null })
                    return
                }

                const document =
                    get().documents.find((doc) => doc.id === id) || null
                set({ selectedDocument: document })
            },

            getDecryptedContent: async (id: string) => {
                const document = get().documents.find((doc) => doc.id === id)
                if (!document) return null

                // Check if content is encrypted
                if (document.content?.startsWith("encrypted:")) {
                    return await docEncryption.decryptDocument(id)
                }

                // If not encrypted, return the content directly
                return document.content
            },

            clearError: () => set({ error: null }),
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
