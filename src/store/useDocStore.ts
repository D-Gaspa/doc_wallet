import { create } from "zustand"
import { persist } from "zustand/middleware"
import { asyncStorageMiddleware } from "./middleware/persist"
import type { IDocState, IDocument } from "../types/document"

export const useDocStore = create<IDocState>()(
    persist(
        (set, get) => ({
            documents: [],
            selectedDocument: null,
            isLoading: false,
            error: null,

            // Selectors
            getDocumentById: (id) => {
                return get().documents.find((doc) => doc.id === id)
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

                    const newDocument: IDocument = {
                        ...documentData,
                        id: Date.now().toString(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
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

                    set((state) => ({
                        documents: state.documents.map((doc) =>
                            doc.id === id
                                ? {
                                      ...doc,
                                      ...updates,
                                      updatedAt: new Date().toISOString(),
                                  }
                                : doc
                        ),
                        selectedDocument:
                            state.selectedDocument?.id === id
                                ? {
                                      ...state.selectedDocument,
                                      ...updates,
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

                    set((state) => ({
                        documents: state.documents.filter(
                            (doc) => doc.id !== id
                        ),
                        selectedDocument:
                            state.selectedDocument?.id === id
                                ? null
                                : state.selectedDocument,
                    }))
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
