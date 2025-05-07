import { FolderType } from "./FolderModal"
import { IDocument } from "../../../../types/document"
import { FA6IconName } from "../../../../types/icons.ts"

export interface Folder {
    id: string
    title: string
    parentId: string | null
    type?: FolderType
    customIconId?: FA6IconName
    customIconColor?: string
    isShared?: boolean
    sharedWith?: string[]
    createdAt: Date
    updatedAt: Date
    favorite: boolean
    childFolderIds?: string[]
    documentIds?: string[]
}

export type ListItemData = Folder | IDocument

export interface ListItem {
    type: "folder" | "document"
    data: ListItemData
}
