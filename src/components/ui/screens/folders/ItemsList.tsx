import React, { useCallback } from "react"
import { FlatList, StyleSheet, Text, View } from "react-native"
import { DocumentCard, FolderCard } from "../../cards"
import { useTheme } from "../../../../hooks/useTheme"
import { Folder, ListItem } from "./types"
import { IDocument } from "../../../../types/document"
import { useTagContext } from "../../tag_functionality/TagContext"
import { getIconById, ThemeColors } from "./CustomIconSelector"

interface ItemsListProps {
    items: ListItem[]
    selectionMode: boolean
    selectedFolderIds: string[]
    selectedItemId?: string | null
    isSelectionList?: boolean
    emptyListMessage?: string

    onFolderPress?: (folderId: string) => void
    onDocumentPress?: (document: IDocument) => void
    onFolderOptionsPress?: (folder: Folder) => void
    onDocumentOptionsPress?: (document: IDocument) => void
    onFolderToggleFavorite?: (folderId: string) => void
    onFolderSelect?: (folderId: string) => void

    onSelectItem?: (id: string, type: "folder" | "document") => void

    testID?: string
}

export function ItemsList({
    items,
    selectionMode,
    selectedFolderIds,
    selectedItemId,
    isSelectionList = false,
    emptyListMessage = "No items found",
    onFolderPress,
    onDocumentPress,
    onFolderOptionsPress,
    onDocumentOptionsPress,
    onFolderToggleFavorite,
    onFolderSelect,
    onSelectItem,
    testID,
}: ItemsListProps) {
    const { colors } = useTheme()
    const tagContext = useTagContext()

    const getFolderIcon = (folder: Folder) => {
        if (folder.type === "custom" && folder.customIconId) {
            return getIconById(folder.customIconId, colors as ThemeColors)
        }
        return undefined
    }

    const renderItem = useCallback(
        ({ item }: { item: ListItem }) => {
            if (item.type === "folder") {
                const folder = item.data as Folder
                const handlePress = () => {
                    if (isSelectionList && onSelectItem) {
                        onSelectItem(folder.id, "folder")
                    } else if (
                        !isSelectionList &&
                        selectionMode &&
                        onFolderSelect
                    ) {
                        onFolderSelect(folder.id)
                    } else if (!isSelectionList && onFolderPress) {
                        onFolderPress(folder.id)
                    }
                }

                const handleLongPress = () => {
                    if (
                        !isSelectionList &&
                        !selectionMode &&
                        onFolderOptionsPress
                    ) {
                        onFolderOptionsPress(folder)
                    } else if (
                        !isSelectionList &&
                        selectionMode &&
                        onFolderSelect
                    ) {
                        onFolderSelect(folder.id)
                    }
                }

                const isSelected = isSelectionList
                    ? folder.id === selectedItemId
                    : selectionMode && selectedFolderIds.includes(folder.id)

                return (
                    <FolderCard
                        key={`folder-${folder.id}`}
                        title={folder.title}
                        type={folder.type}
                        customIcon={getFolderIcon(folder)}
                        folderId={folder.id}
                        isFavorite={folder.favorite}
                        selected={isSelected}
                        onPress={handlePress}
                        onLongPress={handleLongPress}
                        onToggleFavorite={
                            !isSelectionList && onFolderToggleFavorite
                                ? () => onFolderToggleFavorite(folder.id)
                                : () => {}
                        }
                        onShowOptions={
                            !isSelectionList && onFolderOptionsPress
                                ? () => onFolderOptionsPress(folder)
                                : undefined
                        }
                        // If tags needed to be passed explicitly:
                        // tags={tagContext.getTagsForItem(folder.id, "folder")}
                        testID={`folder-${folder.id}`}
                    />
                )
            } else if (item.type === "document") {
                const document = item.data as IDocument

                // Documents are generally not selectable in the 'selectionList' mode
                if (isSelectionList) return null // Don't render documents in folder selection modals

                const handlePress = () => {
                    if (onDocumentPress) {
                        onDocumentPress(document)
                    }
                }

                const handleLongPress = () => {
                    if (onDocumentOptionsPress) {
                        onDocumentOptionsPress(document)
                    }
                }

                return (
                    <DocumentCard
                        key={`document-${document.id}`}
                        document={document}
                        onPress={handlePress}
                        onLongPress={handleLongPress}
                        tags={tagContext.getTagsForItem(
                            document.id,
                            "document",
                        )}
                        showAddTagButton={true}
                        testID={`document-${document.id}`}
                    />
                )
            }

            return null
        },
        [
            isSelectionList,
            selectionMode,
            selectedItemId,
            selectedFolderIds,
            onSelectItem,
            onFolderPress,
            onDocumentPress,
            onFolderOptionsPress,
            onDocumentOptionsPress,
            onFolderToggleFavorite,
            onFolderSelect,
            colors,
            tagContext,
        ],
    )

    const keyExtractor = useCallback(
        (item: ListItem) => `${item.type}-${item.data.id}`,
        [],
    )

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                {emptyListMessage}
            </Text>
        </View>
    )

    return (
        <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={[
                styles.content,
                items.length === 0 && styles.emptyContent,
            ]}
            // Performance optimization for lists that don't change size often
            // removeClippedSubviews={true} // Consider if performance issues arise
            // maxToRenderPerBatch={10} // Adjust based on testing
            // windowSize={21} // Adjust based on testing
            testID={testID ?? "items-list"}
        />
    )
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: 100,
    },
    emptyContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        minHeight: 150,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        marginTop: 30,
    },
    emptyText: {
        fontSize: 16,
        textAlign: "center",
        opacity: 0.7,
    },
})
