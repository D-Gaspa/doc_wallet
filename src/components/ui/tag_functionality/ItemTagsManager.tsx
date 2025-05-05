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
    tags: Tag[]
    allTags: Tag[]
    onTagPress?: (tagId: string) => void
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
    horizontal = true,
    testID,
    showAddTagButton = true,
}: ItemTagsManagerProps) {
    const { colors } = useTheme()
    const { associateTag, disassociateTag, createTag } = useTagContext()
    const [currentTags, setCurrentTags] = useState<Tag[]>(tags)

    useEffect(() => {
        setCurrentTags(tags)
    }, [tags])

    const [tagMenuVisible, setTagMenuVisible] = useState(false)
    const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false)
    const [tagToDelete, setTagToDelete] = useState<string | null>(null)
    const [createTagModalVisible, setCreateTagModalVisible] = useState(false)

    const tagListRef = useRef<View>(null)
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

    const handleShowTagMenu = () => {
        if (tagListRef.current) {
            tagListRef.current.measureInWindow((x, y, width, height) => {
                setMenuPosition({
                    top: y + height + 5,
                    left: x + width / 2 - 100,
                })
                setTagMenuVisible(true)
            })
        }
    }

    const handleAddTag = (tagId: string) => {
        const success = associateTag(tagId, itemId, itemType)
        if (success) {
            const tagToAdd = allTags.find((tag) => tag.id === tagId)
            if (tagToAdd && !currentTags.some((tag) => tag.id === tagId)) {
                setCurrentTags((prev) => [...prev, tagToAdd])
            }
        }
        setTagMenuVisible(false)
    }

    const handleTagLongPress = (tagId: string) => {
        setTagToDelete(tagId)
        setConfirmDeleteVisible(true)
    }

    const handleTagClick = (tagId: string) => {
        if (onTagPress) {
            onTagPress(tagId)
        }
    }

    const handleConfirmDelete = () => {
        if (tagToDelete) {
            const success = disassociateTag(tagToDelete, itemId, itemType)
            if (success) {
                setCurrentTags((prev) =>
                    prev.filter((tag) => tag.id !== tagToDelete),
                )
            }
            setConfirmDeleteVisible(false)
            setTagToDelete(null)
        }
    }

    const handleSaveNewTag = (name: string, color: string) => {
        const newTag = createTag(name, color)
        if (newTag) {
            setCurrentTags((prev) => [...prev, newTag])
            associateTag(newTag.id, itemId, itemType, newTag)
        }
        setCreateTagModalVisible(false)
    }

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
                onTagPress={handleTagClick}
                onTagLongPress={handleTagLongPress}
                selectedTags={selectedTagIds}
                horizontal={horizontal}
                showAddTagButton={showAddTagButton}
                onAddTagPress={showAddTagButton ? handleShowTagMenu : undefined}
                size="small"
                initiallyExpanded={false} // Keep tags collapsed initially
            />

            {/* Tag dropdown menu */}
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
                                Añadir Etiqueta {/* Translated */}
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
                                                {" "}
                                                {item.name}{" "}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            ) : (
                                <Text
                                    style={[
                                        styles.emptyText,
                                        { color: colors.secondaryText },
                                    ]}
                                >
                                    Todas las etiquetas ya aplicadas{" "}
                                    {/* Translated */}
                                </Text>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.createTagOption,
                                    { borderTopColor: colors.border },
                                ]} // Add theme border color
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
                                        {" "}
                                        +{" "}
                                    </Text>
                                </View>
                                <Text style={{ color: colors.primary }}>
                                    Crear Nueva Etiqueta {/* Translated */}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Confirmation dialog */}
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
                            Eliminar Etiqueta {/* Translated */}
                        </Text>
                        <Text
                            style={[
                                styles.confirmMessage,
                                { color: colors.secondaryText },
                            ]}
                        >
                            ¿Estás seguro de que quieres eliminar esta etiqueta{" "}
                            {itemType === "folder"
                                ? "de la carpeta"
                                : "del documento"}
                            ? {/* Translated */}
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
                                    {" "}
                                    Cancelar {/* Translated */}{" "}
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
                                    {" "}
                                    Eliminar {/* Translated */}{" "}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Create/Edit Tag Modal */}
            <TagEditModal
                isVisible={createTagModalVisible}
                onClose={() => setCreateTagModalVisible(false)}
                onSave={handleSaveNewTag}
                title="Crear Nueva Etiqueta" // Translated
            />
        </View>
    )
}

// Styles remain the same
const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "flex-start", // Align tags/button to the start
        alignItems: "center",
        width: "100%", // Ensure it takes available width
    },
    modalOverlay: { flex: 1 },
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
        borderTopWidth: StyleSheet.hairlineWidth,
        marginTop: 8, // Use StyleSheet.hairlineWidth
    },
    createTagIcon: {
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    tagDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    emptyText: { padding: 12, textAlign: "center", fontStyle: "italic" },
    confirmModalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    }, // Added background dim
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
    confirmMessage: { textAlign: "center", marginBottom: 16 },
    confirmButtons: { flexDirection: "row", justifyContent: "space-between" },
    confirmButton: {
        flex: 0.48,
        paddingVertical: 10,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: "center",
    }, // Adjusted padding/radius
})
