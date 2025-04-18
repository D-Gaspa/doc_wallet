import { FolderType } from "./FolderModal"

// Define document data structure
export interface Document {
    id: string
    title: string
    folderId: string // The parent folder ID that contains this document
    type: string // Document type (PDF, image, etc.)
    fileUrl?: string // Path to the actual file
    size?: number // File size
    isShared?: boolean
    sharedWith?: string[]
    createdAt: Date
    updatedAt: Date
}

// Define folder data structure with document support
export interface Folder {
    id: string
    title: string
    parentId: string | null
    type?: FolderType
    customIconId?: string
    isShared?: boolean
    sharedWith?: string[]
    createdAt: Date
    updatedAt: Date
    childFolderIds?: string[] // Array of child folder IDs
    documentIds?: string[] // Array of document IDs contained in this folder
}
