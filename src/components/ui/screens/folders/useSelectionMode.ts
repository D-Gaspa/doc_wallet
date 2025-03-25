import { useState } from "react"
import { Folder } from "./types"

export function useSelectionMode() {
    // Selection mode states
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([])

    // Toggle selection mode
    const toggleSelectionMode = () => {
        if (selectionMode) {
            // Exit selection mode
            setSelectionMode(false)
            setSelectedFolderIds([])
        } else {
            // Enter selection mode
            setSelectionMode(true)
        }
    }

    // Select all folders in the current view
    const handleSelectAll = (folders: Folder[]) => {
        if (selectedFolderIds.length === folders.length && folders.length > 0) {
            // If all are selected, deselect all
            setSelectedFolderIds([])
        } else {
            // Otherwise select all
            setSelectedFolderIds(folders.map(folder => folder.id))
        }
    }

    // Handle folder selection/deselection
    const handleFolderSelect = (folderId: string) => {
        setSelectedFolderIds(prev => {
            if (prev.includes(folderId)) {
                return prev.filter(id => id !== folderId)
            } else {
                return [...prev, folderId]
            }
        })
    }

    return {
        selectionMode,
        selectedFolderIds,
        toggleSelectionMode,
        handleSelectAll,
        handleFolderSelect
    }
}
