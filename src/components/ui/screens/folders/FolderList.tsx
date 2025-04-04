import React from "react"
import { FlatList, StyleSheet } from "react-native"
import { FolderCard } from "../../cards"
import { useTheme } from "../../../../hooks/useTheme"
import { Folder } from "./types"
import { getIconById, ThemeColors } from "./CustomIconSelector"
import { useTagContext } from "../../tag_functionality/TagContext" // Import only exported types

// Define the type using ReturnType utility to extract it from the hook
type TagContextType = ReturnType<typeof useTagContext>

interface FoldersListProps {
    folders: Folder[]
    selectedFolderIds: string[]
    selectedTagFilters: string[]
    tagContext: TagContextType
    handleFolderPress: (folderId: string) => void
    handleFolderSelect: (folderId: string) => void
    showFolderOptions: (folder: Folder) => void
    selectionMode: boolean
    handleAddTagToFolder: (tagId: string, folderId: string) => void
}

export function FoldersList({
    folders,
    selectedFolderIds,
    selectedTagFilters,
    // tagContext,
    handleFolderPress,
    //handleFolderSelect,
    showFolderOptions,
    //selectionMode,
    handleAddTagToFolder,
}: FoldersListProps) {
    const { colors } = useTheme()

    // Get custom icon for folder if needed
    const getFolderIcon = (folder: Folder) => {
        if (folder.type === "custom" && folder.customIconId) {
            return getIconById(folder.customIconId, colors as ThemeColors)
        }
        return undefined
    }

    // Render folder item with tags and selection state
    const renderFolderItem = ({ item }: { item: Folder }) => {
        return (
            <FolderCard
                title={item.title}
                type={item.type}
                customIcon={
                    item.type === "custom" ? getFolderIcon(item) : undefined
                }
                onPress={() => handleFolderPress(item.id)}
                onLongPress={() => showFolderOptions(item)}
                testID={`folder-${item.id}`}
                selected={selectedFolderIds.includes(item.id)}
                folderId={item.id}
                onTagPress={(tagId: string) =>
                    handleAddTagToFolder(tagId, item.id)
                }
                selectedTagIds={selectedTagFilters}
            />
        )
    }

    return (
        <FlatList
            data={folders}
            keyExtractor={(item) => item.id}
            renderItem={renderFolderItem}
            contentContainerStyle={styles.content}
            testID="folder-list"
        />
    )
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: 100, // Leave space for the button and TabBar
    },
})
