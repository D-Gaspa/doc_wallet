// src/components/ui/tags/TagEditModal.tsx
import React, { useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { BaseModal } from "../../common/modal"
import { Stack } from "../layout"
import { Row } from "../layout"
import { Text } from "../typography"
import { TextField } from "../form"
import { Button } from "../button"
import { LoggingService } from "../../../services/monitoring/loggingService.ts"

// Predefined tag colors
const TAG_COLORS = [
    "#E74C3C", // Red
    "#F39C12", // Orange
    "#2ECC71", // Green
    "#3498DB", // Blue
    "#9B59B6", // Purple
    "#1ABC9C", // Teal
    "#34495E", // Navy
    "#7F8C8D", // Gray
]

interface TagEditModalProps {
    isVisible: boolean
    onClose: () => void
    onSave: (name: string, color: string, id?: string) => void
    onDelete?: (id: string) => void
    initialName?: string
    initialColor?: string
    tagId?: string
    title?: string
}

export function TagEditModal({
    isVisible,
    onClose,
    onSave,
    onDelete,
    initialName = "",
    initialColor = TAG_COLORS[0],
    tagId,
    title = "Create New Tag",
}: TagEditModalProps) {
    const logger = LoggingService.getLogger
        ? LoggingService.getLogger("TagEditModal")
        : { debug: console.debug }

    const [name, setName] = useState(initialName)
    const [selectedColor, setSelectedColor] = useState(initialColor)

    // Reset form when modal opens with new data
    useEffect(() => {
        if (isVisible) {
            setName(initialName)
            setSelectedColor(initialColor)
        }
    }, [isVisible, initialName, initialColor])

    const handleSave = () => {
        if (name.trim() === "") {
            return // Don't save tag with empty name
        }

        onSave(name.trim(), selectedColor, tagId)
        logger.debug("Saving tag", { id: tagId, name, color: selectedColor })
        onClose()
    }

    const handleDelete = () => {
        if (tagId && onDelete) {
            onDelete(tagId)
            logger.debug("Deleting tag", { id: tagId })
            onClose()
        }
    }

    return (
        <BaseModal isVisible={isVisible} onClose={onClose}>
            <View style={styles.container} testID="tag-edit-modal">
                <Text variant="lg" weight="bold" style={styles.title}>
                    {title}
                </Text>

                <Stack spacing={16}>
                    {/* Tag name input */}
                    <Stack spacing={8}>
                        <Text weight="medium">Tag Name</Text>
                        <TextField
                            placeholder="Enter tag name"
                            value={name}
                            onChangeText={setName}
                            testID="tag-name-input"
                        />
                    </Stack>

                    {/* Color selection */}
                    <Stack spacing={8}>
                        <Text weight="medium">Tag Color</Text>
                        <View style={styles.colorsContainer}>
                            {TAG_COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        selectedColor === color &&
                                            styles.selectedColor,
                                    ]}
                                    onPress={() => setSelectedColor(color)}
                                    testID={`color-${color.replace("#", "")}`}
                                />
                            ))}
                        </View>
                    </Stack>

                    {/* Preview */}
                    <Stack spacing={8}>
                        <Text weight="medium">Preview</Text>
                        <View style={styles.previewContainer}>
                            <View
                                style={[
                                    styles.tagPreview,
                                    {
                                        backgroundColor: selectedColor + "20",
                                        borderColor: selectedColor,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.dot,
                                        { backgroundColor: selectedColor },
                                    ]}
                                />
                                <Text>{name || "Tag Preview"}</Text>
                            </View>
                        </View>
                    </Stack>

                    {/* Action buttons */}
                    {tagId && onDelete ? (
                        // Edit mode with delete button
                        <Stack spacing={12}>
                            <Row justify="space-between" align="center">
                                <View style={styles.buttonContainer}>
                                    <Button
                                        title="Cancel"
                                        onPress={onClose}
                                        style={styles.cancelButton}
                                        testID="cancel-button"
                                    />
                                </View>
                                <View style={styles.buttonContainer}>
                                    <Button
                                        title="Update"
                                        onPress={handleSave}
                                        style={
                                            name.trim() === ""
                                                ? styles.disabledButton
                                                : {}
                                        }
                                        testID="save-button"
                                    />
                                </View>
                            </Row>
                            <Button
                                title="Delete Tag"
                                onPress={handleDelete}
                                testID="delete-button"
                            />
                        </Stack>
                    ) : (
                        // Create mode
                        <Row justify="space-between" align="center">
                            <View style={styles.buttonContainer}>
                                <Button
                                    title="Cancel"
                                    onPress={onClose}
                                    style={styles.cancelButton}
                                    testID="cancel-button"
                                />
                            </View>
                            <View style={styles.buttonContainer}>
                                <Button
                                    title="Create Tag"
                                    onPress={handleSave}
                                    style={
                                        name.trim() === ""
                                            ? styles.disabledButton
                                            : {}
                                    }
                                    testID="save-button"
                                />
                            </View>
                        </Row>
                    )}
                </Stack>
            </View>
        </BaseModal>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        marginBottom: 16,
        textAlign: "center",
    },
    colorsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        margin: 4,
    },
    selectedColor: {
        borderWidth: 3,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    previewContainer: {
        alignItems: "center",
        padding: 8,
    },
    tagPreview: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    buttonContainer: {
        flex: 0.48,
    },
    cancelButton: {
        borderWidth: 1,
    },
    disabledButton: {
        opacity: 0.5,
    },
})
