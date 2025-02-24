// TODO: Update User and AuthState with the authentication method
export interface IUser {
    id: string
    name: string
    email: string
}

export interface IDocument {
    id: string
    title: string
    content: string
    createdAt: string
    updatedAt: string
    tags?: string[]
}

export interface IAuthState {
    user: IUser | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    checkAuthStatus: () => Promise<void>
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
