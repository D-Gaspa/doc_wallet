import React, { useCallback } from "react"
import { FlatList, StyleSheet, Text, View } from "react-native"
import { DocumentCard, FolderCard } from "../../cards"
import { useTheme } from "../../../../hooks/useTheme"
import { Folder, ListItem } from "./types"
import { IDocument } from "../../../../types/document"
import { useTagContext } from "../../tag_functionality/TagContext"
import { SelectedItem } from "./useSelectionMode"

interface ItemsListProps {
    items: ListItem[]
    selectionMode: boolean
    selectedItems: SelectedItem[]
    selectedItemId?: string | null
    isSelectionList?: boolean
    emptyListMessage?: string

    onFolderPress?: (folderId: string) => void
    onDocumentPress?: (document: IDocument) => void
    onFolderOptionsPress?: (folder: Folder) => void
    onDocumentOptionsPress?: (document: IDocument) => void
    onFolderToggleFavorite?: (folderId: string) => void
    onDocumentToggleFavorite?: (documentId: string) => void
    onDocumentDelete?: (document: IDocument) => void
    onDocumentShare?: (documentId: IDocument) => void
    getIsDocumentFavorite?: (documentId: string) => boolean
    onItemSelect?: (id: string, type: "folder" | "document") => void
    onSelectItem?: (id: string, type: "folder" | "document") => void
    onFolderLongPress?: (folderId: string) => void
    onDocumentLongPress?: (documentId: string) => void

    testID?: string
}

export function ItemsList({
    items,
    selectionMode,
    selectedItems,
    selectedItemId,
    isSelectionList = false,
    emptyListMessage = "No items found",
    onFolderPress,
    onDocumentPress,
    onFolderOptionsPress,
    onDocumentOptionsPress,
    onFolderToggleFavorite,
    onDocumentToggleFavorite,
    onDocumentDelete,
    getIsDocumentFavorite,
    onDocumentShare,
    onItemSelect,
    onSelectItem,
    onFolderLongPress,
    onDocumentLongPress,
    testID,
}: ItemsListProps) {
    const { colors } = useTheme()
    const tagContext = useTagContext()

    const renderItem = useCallback(
        ({ item }: { item: ListItem }) => {
            const isSelected = isSelectionList
                ? item.data.id === selectedItemId
                : selectionMode &&
                  selectedItems.some(
                      (sel) =>
                          sel.id === item.data.id && sel.type === item.type,
                  )

            if (item.type === "folder") {
                const folder = item.data as Folder

                const handlePress = () => {
                    if (isSelectionList && onSelectItem) {
                        onSelectItem(folder.id, "folder")
                    } else if (
                        !isSelectionList &&
                        selectionMode &&
                        onItemSelect
                    ) {
                        onItemSelect(folder.id, "folder")
                    } else if (!isSelectionList && onFolderPress) {
                        onFolderPress(folder.id)
                    }
                }

                const handleLongPress = () => {
                    if (onFolderLongPress) {
                        onFolderLongPress(folder.id)
                    } else if (
                        !isSelectionList &&
                        !selectionMode &&
                        onFolderOptionsPress
                    ) {
                        onFolderOptionsPress(folder)
                    }
                }

                return (
                    <FolderCard
                        key={`folder-${folder.id}`}
                        folderId={folder.id}
                        title={folder.title}
                        type={folder.type}
                        customIconId={folder.customIconId}
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
                            !isSelectionList &&
                            onFolderOptionsPress &&
                            !selectionMode
                                ? () => onFolderOptionsPress(folder)
                                : undefined
                        }
                        testID={`folder-${folder.id}`}
                    />
                )
            } else if (item.type === "document") {
                const document = item.data as IDocument

                const handlePress = () => {
                    if (!isSelectionList && selectionMode && onItemSelect) {
                        onItemSelect(document.id, "document")
                    } else if (!isSelectionList && onDocumentPress) {
                        onDocumentPress(document)
                    }
                }

                const handleLongPress = () => {
                    if (onDocumentLongPress) {
                        onDocumentLongPress(document.id)
                    } else if (
                        !isSelectionList &&
                        !selectionMode &&
                        onDocumentOptionsPress
                    ) {
                        onDocumentOptionsPress(document)
                    }
                }

                if (isSelectionList) return null

                const isDocFavorite = getIsDocumentFavorite
                    ? getIsDocumentFavorite(document.id)
                    : false
                return (
                    <DocumentCard
                        key={`document-${document.id}`}
                        document={document}
                        tags={tagContext.getTagsForItem(
                            document.id,
                            "document",
                        )}
                        onPress={handlePress}
                        onLongPress={handleLongPress}
                        isFavorite={isDocFavorite}
                        onToggleFavorite={() =>
                            onDocumentToggleFavorite?.(document.id)
                        }
                        onShare={() => onDocumentShare?.(document)}
                        onDelete={() => onDocumentDelete?.(document)}
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
            selectedItems,
            onItemSelect,
            onSelectItem,
            onFolderPress,
            onDocumentPress,
            onFolderOptionsPress,
            onDocumentOptionsPress,
            onFolderToggleFavorite,
            onFolderLongPress,
            onDocumentLongPress,
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
            extraData={{ selectionMode, selectedItems, selectedItemId }}
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
