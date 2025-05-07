export enum DocumentType {
    PDF = "application/pdf",
    IMAGE = "image/jpeg",
    IMAGE_PNG = "image/png",
    TEXT = "text/pdf",
    UNKNOWN = "unknown",
}

export interface IDocument {
    id: string
    sourceUri: string
    metadata: IDocumentMetadata
    title?: string
    content?: string
    tags?: string[]
    parameters?: IDocumentParameters[]
    storedFilename?: string
}

export interface IDocumentMetadata {
    createdAt: string
    updatedAt: string
    type?: DocumentType
    mimeType?: string
}

export interface IDocumentParameters {
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
    getDecryptedContent: (id: string) => Promise<string | null | undefined>

    // Actions
    fetchDocument: (
        id: string,
    ) => Promise<{ document: IDocument; previewUri: string } | null>
    addDocument: (document: Omit<IDocument, "id">) => Promise<IDocument>
    updateDocument: (
        id: string,
        updates: IDocument,
    ) => Promise<IDocument | undefined>
    deleteDocument: (id: string) => Promise<void>
    selectDocument: (id: string | null) => void
    clearError: () => void
    getDocumentPreview: (id: string) => Promise<IDocument | null>
    cleanupTempFiles: () => Promise<void>
    reset: () => void
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
