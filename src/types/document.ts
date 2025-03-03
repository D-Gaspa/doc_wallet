export interface IDocument {
    id: string
    title: string
    content: string
    createdAt: string
    updatedAt: string
    tags?: string[]
}

export interface IDocState {
    documents: IDocument[]
    selectedDocument: IDocument | null
    isLoading: boolean
    error: string | null

    // Selectors
    getDocumentById: (id: string) => IDocument | undefined
    getFilteredDocuments: (filterFn: (doc: IDocument) => boolean) => IDocument[]
    getDecryptedContent: (id: string) => Promise<string | null>

    // Actions
    fetchDocuments: () => Promise<void>
    addDocument: (
        document: Omit<IDocument, "id" | "createdAt" | "updatedAt">
    ) => Promise<IDocument>
    updateDocument: (
        id: string,
        updates: Partial<IDocument>
    ) => Promise<IDocument | undefined>
    deleteDocument: (id: string) => Promise<void>
    selectDocument: (id: string | null) => void
    clearError: () => void
}
