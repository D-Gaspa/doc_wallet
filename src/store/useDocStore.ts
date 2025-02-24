import { create } from "zustand"
import type { IDocState, IDocument } from "../types/document"

export const useDocStore = create<IDocState>((set, get) => ({
    documents: [],
    selectedDocument: null,
    isLoading: false,

    // TODO: Implement document fetching
    fetchDocuments: async () => {
        try {
            set({ isLoading: true })
            // Fetch implementation will go here
        } catch (error) {
            console.error("Failed to fetch documents:", error)
        } finally {
            set({ isLoading: false })
        }
    },

    addDocument: async (documentData) => {
        try {
            set({ isLoading: true })
            // TODO: Implement actual creation logic
            const newDocument: IDocument = {
                ...documentData,
                id: Date.now().toString(), // Use a proper ID generation in production
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }

            set((state) => ({
                documents: [...state.documents, newDocument],
            }))
        } catch (error) {
            console.error("Failed to add document:", error)
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    // TODO: Implement document updating
    updateDocument: async () => {
        try {
            set({ isLoading: true })
            // Update implementation will go here
        } catch (error) {
            console.error("Failed to update document:", error)
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    // TODO: Implement delete document logic
    deleteDocument: async (id) => {
        try {
            set({ isLoading: true })

            set((state) => ({
                documents: state.documents.filter((doc) => doc.id !== id),
                selectedDocument:
                    state.selectedDocument?.id === id
                        ? null
                        : state.selectedDocument,
            }))
        } catch (error) {
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

        const { documents } = get()
        const document = documents.find((doc) => doc.id === id) || null
        set({ selectedDocument: document })
    },
}))
