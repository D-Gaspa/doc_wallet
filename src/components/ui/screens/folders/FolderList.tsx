import React from "react"
import { FlatList, StyleSheet, View } from "react-native"
import { FolderCard } from "../../cards" // Import FolderCardProps
import { useTheme } from "../../../../hooks/useTheme"
import { Folder } from "./types"
import { getIconById, ThemeColors } from "./CustomIconSelector" // Ensure path is correct
import { Text } from "../../typography"

interface FoldersListProps {
    folders: Folder[]
    selectedFolderIds: string[]
    selectedTagFilters: string[]
    handleFolderPress: (folderId: string) => void // For navigating into folder
    handleFolderSelect: (folderId: string) => void // For toggling selection
    showFolderOptions: (folder: Folder) => void // For showing the options menu
    selectionMode: boolean
    handleDeleteFolder: (folderId: string) => void
    handleAddTagToFolder: (tagId: string, folderId: string) => void
    handleToggleFavorite: (folderId: string) => void
    isFiltering?: boolean
    hasDocuments?: boolean
}

export function FoldersList({
    folders,
    selectedFolderIds,
    selectedTagFilters,
    handleFolderPress,
    handleFolderSelect,
    showFolderOptions, // This function should show the Edit/Share/Delete alert/menu
    selectionMode,
    handleToggleFavorite,
    handleAddTagToFolder,
    isFiltering = false,
    hasDocuments = false,
}: FoldersListProps) {
    const { colors } = useTheme()
    const getFolderIcon = (folder: Folder) => {
        if (folder.type === "custom" && folder.customIconId) {
            return getIconById(folder.customIconId, colors as ThemeColors)
        }
        return undefined
    }

    const renderFolderItem = ({ item }: { item: Folder }) => {
        // Determine onPress action based on selection mode
        const onPressAction = selectionMode
            ? () => handleFolderSelect(item.id) // Toggle selection in selection mode
            : () => handleFolderPress(item.id) // Navigate into folder otherwise

        // Determine onLongPress action
        const onLongPressAction = selectionMode
            ? () => handleFolderSelect(item.id) // Also toggle selection on long press in selection mode
            : () => showFolderOptions(item) // Show options on long press if not selecting

        return (
            <FolderCard
                key={item.id} // Add key here for FlatList efficiency
                title={item.title}
                type={item.type} // Pass type, default handled in FolderCard
                customIcon={
                    item.type === "custom" ? getFolderIcon(item) : undefined
                }
                onPress={onPressAction}
                onLongPress={onLongPressAction} // Use defined long press action
                onShowOptions={() => showFolderOptions(item)} // Wire settings button to show options
                isFavorite={item.favorite} // Pass favorite status
                // onToggleFavorite is removed
                onToggleFavorite={() => handleToggleFavorite(item.id)}
                testID={`folder-${item.id}`}
                selected={selectedFolderIds.includes(item.id)}
                folderId={item.id}
                onTagPress={(tagId: string) =>
                    handleAddTagToFolder(tagId, item.id)
                } // Example: Add tag via context/store?
                selectedTagIds={selectedTagFilters}
                // showAddTagButton is removed
            />
        )
    }

    const renderEmptyState = () => {
        // ... (empty state logic remains the same) ...
        return (
            <View style={styles.emptyContainer}>
                {isFiltering ? (
                    <>
                        <Text
                            variant="md"
                            weight="medium"
                            style={styles.emptyTitle}
                        >
                            No matching folders
                        </Text>
                        <Text variant="sm" style={styles.emptyText}>
                            Try adjusting your search or filter criteria
                        </Text>
                    </>
                ) : (
                    <>
                        <Text
                            variant="md"
                            weight="medium"
                            style={styles.emptyTitle}
                        >
                            No folders yet
                        </Text>
                        <Text variant="sm" style={styles.emptyText}>
                            Create a new folder to get started
                        </Text>
                    </>
                )}
            </View>
        )
    }

    const showEmpty = folders.length === 0 && !hasDocuments

    return (
        <FlatList
            data={folders}
            keyExtractor={(item) => item.id}
            renderItem={renderFolderItem}
            contentContainerStyle={[
                styles.content,
                folders.length === 0 && styles.emptyContent,
            ]}
            testID="folder-list"
            ListEmptyComponent={showEmpty ? renderEmptyState : null}
        />
    )
}

// --- Stylesheet --- (Keep styles the same)
const styles = StyleSheet.create({
    content: {
        paddingBottom: 100,
    },
    emptyContent: {
        flex: 1,
        justifyContent: "center",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    emptyTitle: {
        marginBottom: 8,
        textAlign: "center",
    },
    emptyText: {
        textAlign: "center",
        opacity: 0.7,
    },
})
