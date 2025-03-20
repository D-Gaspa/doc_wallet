export enum DocumentType {
    PDF = "application/pdf",
    IMAGE = "image/jpeg",
    IMAGE_PNG = "image/png",
    UNKNOWN = "unknown",
}

export interface IDocument {
    id: string
    title: string
    content: string
    createdAt: string
    updatedAt: string
    type: DocumentType
    tags?: string[]
}

export interface IDocumentMetadata {
    id: string
    documentId: string
    key: string
    value: string | undefined
    type: string | number | Date | boolean | null
    isSearchable: boolean
    isSystem: boolean
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

export interface ImportOptions {
    allowMultiple?: boolean
    fileTypes?: string[]
    allowVirtualFiles?: boolean
}

export interface ImportFileResult {
    uri: string
    name: string | null
    size: number | null
    type: DocumentType
    mimeType: string | null
    localUri?: string // Only present when we needed to make a local copy
}
