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
    fetchDocuments: () => Promise<void>
    addDocument: (
        document: Omit<IDocument, "id" | "createdAt" | "updatedAt">
    ) => Promise<void>
    updateDocument: (id: string, updates: Partial<IDocument>) => Promise<void>
    deleteDocument: (id: string) => Promise<void>
    selectDocument: (id: string | null) => void
}
