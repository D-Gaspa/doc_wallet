import { useCallback, useState } from "react"
import { ListItem } from "./types"

export interface SelectedItem {
    id: string
    type: "folder" | "document"
}

export function useSelectionMode() {
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])

    const toggleSelectionMode = useCallback(() => {
        setSelectionMode((prevMode) => {
            if (prevMode) {
                setSelectedItems([])
                return false
            } else {
                return true
            }
        })
    }, [])

    const handleItemSelect = useCallback(
        (itemId: string, itemType: "folder" | "document") => {
            setSelectedItems((prev) => {
                const existingIndex = prev.findIndex(
                    (item) => item.id === itemId && item.type === itemType,
                )
                if (existingIndex > -1) {
                    return prev.filter((_, index) => index !== existingIndex)
                } else {
                    return [...prev, { id: itemId, type: itemType }]
                }
            })
        },
        [],
    )

    const handleSelectAll = useCallback(
        (displayItems: ListItem[]) => {
            const allCurrentlySelected =
                displayItems.length > 0 &&
                displayItems.every((displayItem) =>
                    selectedItems.some(
                        (selItem) =>
                            selItem.id === displayItem.data.id &&
                            selItem.type === displayItem.type,
                    ),
                )

            if (allCurrentlySelected) {
                setSelectedItems([])
            } else {
                setSelectedItems(
                    displayItems.map((item) => ({
                        id: item.data.id,
                        type: item.type,
                    })),
                )
            }
        },
        [selectedItems],
    )

    return {
        selectionMode,
        selectedItems,
        toggleSelectionMode,
        handleSelectAll,
        handleItemSelect,
        setSelectedItems,
    }
}
