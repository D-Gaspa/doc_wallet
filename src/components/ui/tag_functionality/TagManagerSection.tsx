import React, { useState } from "react"
import { View, StyleSheet } from "react-native"
import { useTagContext } from "./TagContext"
import { TagEditModal } from "./TagEditModal"
import { Alert } from "../feedback"

interface TagManagerSectionProps {
    folderId: string
    folderName: string
    handleTagFilterPress: (tagId: string | null) => void
    selectedTagFilters: string[]
    testID?: string
}

export function TagManagerSection({
    folderId,
    testID,
}: TagManagerSectionProps) {
    const { associateTag, createTag, updateTag, deleteTag } = useTagContext()

    // Get tags for this folder

    // State for modals and alerts
    const [isCreateTagModalVisible, setCreateTagModalVisible] = useState(false)
    const [isEditTagModalVisible, setEditTagModalVisible] = useState(false)
    const [selectedTag, setSelectedTag] = useState<{
        id: string
        name: string
        color: string
    } | null>(null)
    const [alert, setAlert] = useState<{
        visible: boolean
        message: string
        type: "success" | "error" | "info" | "warning"
    }>({
        visible: false,
        message: "",
        type: "info",
    })

    // Handle tag creation/update
    const handleSaveTag = (name: string, color: string, id?: string) => {
        if (id) {
            // Update existing tag
            const updated = updateTag(id, name, color)
            if (updated) {
                setAlert({
                    visible: true,
                    message: "Tag updated successfully",
                    type: "success",
                })
            } else {
                setAlert({
                    visible: true,
                    message: "Failed to update tag",
                    type: "error",
                })
            }
        } else {
            // Create new tag
            const newTag = createTag(name, color)
            if (newTag) {
                // Automatically associate new tag with current folder
                associateTag(newTag.id, folderId, "folder", newTag)
                setAlert({
                    visible: true,
                    message: "Tag created and added to folder",
                    type: "success",
                })
            } else {
                setAlert({
                    visible: true,
                    message: "Failed to create tag",
                    type: "error",
                })
            }
        }
    }

    // Handle tag deletion
    const handleDeleteTag = (tagId: string) => {
        const success = deleteTag(tagId)
        if (success) {
            setAlert({
                visible: true,
                message: "Tag deleted successfully",
                type: "success",
            })
            setEditTagModalVisible(false)
            setSelectedTag(null)
        } else {
            setAlert({
                visible: true,
                message: "Failed to delete tag",
                type: "error",
            })
        }
    }

    return (
        <View style={styles.container} testID={testID ?? "tag-manager-section"}>
            {/* Create Tag Modal */}
            <TagEditModal
                isVisible={isCreateTagModalVisible}
                onClose={() => setCreateTagModalVisible(false)}
                onSave={handleSaveTag}
                title="Create new tag"
            />

            {/* Edit Tag Modal */}
            {selectedTag && (
                <TagEditModal
                    isVisible={isEditTagModalVisible}
                    onClose={() => {
                        setEditTagModalVisible(false)
                        setSelectedTag(null)
                    }}
                    onSave={(name, color) =>
                        handleSaveTag(name, color, selectedTag.id)
                    }
                    onDelete={handleDeleteTag}
                    initialName={selectedTag.name}
                    initialColor={selectedTag.color}
                    tagId={selectedTag.id}
                    title="Edit Tag"
                />
            )}

            {/* Alert notification */}
            {alert.visible && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    visible={alert.visible}
                    onClose={() => setAlert({ ...alert, visible: false })}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
        marginBottom: 80, // Add enough margin to not overlap with bottom buttons
        paddingHorizontal: 16,
    },
})
