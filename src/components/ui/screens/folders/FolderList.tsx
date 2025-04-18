import React from "react"
import { FlatList, StyleSheet, View } from "react-native"
import { FolderCard } from "../../cards"
import { useTheme } from "../../../../hooks/useTheme"
import { Folder } from "./types"
import { getIconById, ThemeColors } from "./CustomIconSelector"
import { useTagContext } from "../../tag_functionality/TagContext"
import { Text } from "../../typography"

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
    isFiltering?: boolean
    hasDocuments?: boolean
}

export function FoldersList({
    folders,
    selectedFolderIds,
    selectedTagFilters,
    handleFolderPress,
    handleFolderSelect,
    showFolderOptions,
    selectionMode,
    handleAddTagToFolder,
    isFiltering = false,
    hasDocuments = false,
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
                onPress={() =>
                    selectionMode
                        ? handleFolderSelect(item.id)
                        : handleFolderPress(item.id)
                }
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

    // Render empty state
    const renderEmptyState = () => {
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

const styles = StyleSheet.create({
    content: {
        paddingBottom: 100, // Leave space for the button and TabBar
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
