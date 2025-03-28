// src/components/ui/tag_functionality/ItemTagsManager.tsx
import React, { useState, useRef, useEffect } from "react"
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    TouchableWithoutFeedback,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { TagList } from "./TagList"
import { TagEditModal } from "./TagEditModal"
import { useTagContext, Tag } from "./TagContext"

export interface ItemTagsManagerProps {
    itemId: string
    itemType: "folder" | "document"
    tags: Tag[] // Current tags on this item
    allTags: Tag[] // All available tags for dropdown
    onTagPress?: (tagId: string) => void // Click to add tag to filter
    selectedTagIds?: string[]
    maxTags?: number
    horizontal?: boolean
    testID?: string
    showAddTagButton?: boolean
}

export function ItemTagsManager({
    itemId,
    itemType,
    tags = [],
    allTags = [],
    onTagPress,
    selectedTagIds = [],
    maxTags = 3,
    horizontal = true,
    testID,
    showAddTagButton = true,
}: ItemTagsManagerProps) {
    const { colors } = useTheme()
    const { associateTag, disassociateTag, createTag } = useTagContext()
    const [currentTags, setCurrentTags] = useState<Tag[]>(tags)

    // Update tags when they change externally
    useEffect(() => {
        setCurrentTags(tags)
    }, [tags])

    // State for modals/menus
    const [tagMenuVisible, setTagMenuVisible] = useState(false)
    const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false)
    const [tagToDelete, setTagToDelete] = useState<string | null>(null)
    const [createTagModalVisible, setCreateTagModalVisible] = useState(false)

    // Refs for positioning
    const tagListRef = useRef<View>(null)
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

    // Handle showing the tag menu
    const handleShowTagMenu = () => {
        if (tagListRef.current) {
            tagListRef.current.measureInWindow((x, y, width, height) => {
                setMenuPosition({
                    top: y + height + 5,
                    left: x + width / 2 - 100, // Center the menu
                })
                setTagMenuVisible(true)
            })
        }
    }

    // Handle adding a tag to the item
    const handleAddTag = (tagId: string) => {
        const success = associateTag(tagId, itemId, itemType)
        if (success) {
            // Find the tag details to add it to our local state
            const tagToAdd = allTags.find((tag) => tag.id === tagId)
            if (tagToAdd && !currentTags.some((tag) => tag.id === tagId)) {
                setCurrentTags((prev) => [...prev, tagToAdd])
            }
        }
        setTagMenuVisible(false)
    }

    // Handle tag long press (for deletion)
    const handleTagLongPress = (tagId: string) => {
        // Prevent default press behavior that might interfere
        setTagToDelete(tagId)
        setConfirmDeleteVisible(true)
    }

    // Handle tag click to add to filter
    const handleTagClick = (tagId: string) => {
        if (onTagPress) {
            onTagPress(tagId)
        }
    }

    // Handle tag deletion confirmation
    const handleConfirmDelete = () => {
        if (tagToDelete) {
            const success = disassociateTag(tagToDelete, itemId, itemType)
            if (success) {
                // Update local state to remove the tag
                setCurrentTags((prev) =>
                    prev.filter((tag) => tag.id !== tagToDelete),
                )
            }
            setConfirmDeleteVisible(false)
            setTagToDelete(null)
        }
    }

    // Handle creating a new tag
    const handleSaveNewTag = (name: string, color: string) => {
        const newTag = createTag(name, color)
        if (newTag) {
            // First update our local state
            setCurrentTags((prev) => [...prev, newTag])

            // Associate the tag with the item, passing the newly created tag
            // to bypass the tag existence check in associateTag
            associateTag(newTag.id, itemId, itemType, newTag)
        }
        setCreateTagModalVisible(false)
    }

    // Filter out tags that are already applied to this item
    const availableTags = allTags.filter(
        (tag) => !currentTags.some((itemTag) => itemTag.id === tag.id),
    )

    return (
        <View
            style={styles.container}
            ref={tagListRef}
            testID={testID ?? "item-tags-manager"}
        >
            <TagList
                tags={currentTags}
                onTagPress={handleTagClick} // Click on tag to add to filter
                onTagLongPress={handleTagLongPress} // Long press to delete tag
                selectedTags={selectedTagIds}
                horizontal={horizontal}
                maxTags={maxTags}
                showAddButton={showAddTagButton !== false}
                onAddTagPress={handleShowTagMenu}
            />

            {/* Tag dropdown menu for adding tags */}
            <Modal
                visible={tagMenuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setTagMenuVisible(false)}
            >
                <TouchableWithoutFeedback
                    onPress={() => setTagMenuVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View
                            style={[
                                styles.tagMenu,
                                {
                                    top: menuPosition.top,
                                    left: menuPosition.left,
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.menuTitle,
                                    { color: colors.text },
                                ]}
                            >
                                Add Tag
                            </Text>

                            {availableTags.length > 0 ? (
                                <FlatList
                                    data={availableTags}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.tagMenuItem}
                                            onPress={() =>
                                                handleAddTag(item.id)
                                            }
                                        >
                                            <View
                                                style={[
                                                    styles.tagDot,
                                                    {
                                                        backgroundColor:
                                                            item.color,
                                                    },
                                                ]}
                                            />
                                            <Text
                                                style={{ color: colors.text }}
                                            >
                                                {item.name}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <Text
                                            style={[
                                                styles.emptyText,
                                                { color: colors.secondaryText },
                                            ]}
                                        >
                                            No more tags available
                                        </Text>
                                    }
                                />
                            ) : (
                                <Text
                                    style={[
                                        styles.emptyText,
                                        { color: colors.secondaryText },
                                    ]}
                                >
                                    All tags already applied
                                </Text>
                            )}

                            {/* Create new tag option */}
                            <TouchableOpacity
                                style={styles.createTagOption}
                                onPress={() => {
                                    setTagMenuVisible(false)
                                    setCreateTagModalVisible(true)
                                }}
                            >
                                <View
                                    style={[
                                        styles.createTagIcon,
                                        { backgroundColor: colors.primary },
                                    ]}
                                >
                                    <Text style={{ color: colors.background }}>
                                        +
                                    </Text>
                                </View>
                                <Text style={{ color: colors.primary }}>
                                    Create New Tag
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Confirmation dialog for tag deletion */}
            <Modal
                visible={confirmDeleteVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmDeleteVisible(false)}
            >
                <View style={styles.confirmModalOverlay}>
                    <View
                        style={[
                            styles.confirmDialog,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <Text
                            style={[
                                styles.confirmTitle,
                                { color: colors.text },
                            ]}
                        >
                            Remove Tag
                        </Text>
                        <Text
                            style={[
                                styles.confirmMessage,
                                { color: colors.secondaryText },
                            ]}
                        >
                            Are you sure you want to remove this tag from the{" "}
                            {itemType}?
                        </Text>

                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.confirmButton,
                                    { borderColor: colors.border },
                                ]}
                                onPress={() => setConfirmDeleteVisible(false)}
                            >
                                <Text style={{ color: colors.text }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.confirmButton,
                                    { backgroundColor: colors.error },
                                ]}
                                onPress={handleConfirmDelete}
                            >
                                <Text style={{ color: colors.background }}>
                                    Remove
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Create Tag Modal */}
            <TagEditModal
                isVisible={createTagModalVisible}
                onClose={() => setCreateTagModalVisible(false)}
                onSave={handleSaveNewTag}
                title="Create New Tag"
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    modalOverlay: {
        flex: 1,
    },
    tagMenu: {
        position: "absolute",
        width: 200,
        maxHeight: 300,
        borderRadius: 8,
        borderWidth: 1,
        padding: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
        textAlign: "center",
    },
    tagMenuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    createTagOption: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        marginTop: 8,
    },
    createTagIcon: {
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    tagDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    emptyText: {
        padding: 12,
        textAlign: "center",
        fontStyle: "italic",
    },
    // Confirm dialog styles with fixed background
    confirmModalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    confirmDialog: {
        width: "80%",
        borderRadius: 8,
        padding: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
        textAlign: "center",
    },
    confirmMessage: {
        textAlign: "center",
        marginBottom: 16,
    },
    confirmButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    confirmButton: {
        flex: 0.48,
        paddingVertical: 8,
        borderRadius: 4,
        borderWidth: 1,
        alignItems: "center",
    },
})
