import React, { useEffect, useState } from "react"
import { Modal, StyleSheet, Text, View } from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { useTagContext } from "./TagContext"
import { Row, Stack } from "../layout"
import { Button } from "../button"
import { Alert } from "../feedback"
import { Checkbox } from "../form"
import { SelectedItem } from "../screens/folders/useSelectionMode"

interface BatchTagManagerProps {
    isVisible: boolean
    onClose: () => void
    items: SelectedItem[]
    onTagsApplied?: () => void
}

export function BatchTagManager({
    isVisible,
    onClose,
    items,
    onTagsApplied,
}: BatchTagManagerProps) {
    const { colors } = useTheme()
    const { tags, batchAssociateTags, batchDisassociateTags } = useTagContext()

    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
    const [alert, setAlert] = useState<{
        visible: boolean
        message: string
        type: "success" | "error" | "info" | "warning"
    }>({
        visible: false,
        message: "",
        type: "info",
    })

    useEffect(() => {
        if (!isVisible) {
            setSelectedTagIds([])
        }
    }, [isVisible, items])

    const handleTagToggle = (tagId: string) => {
        setSelectedTagIds((prevSelected) => {
            if (prevSelected.includes(tagId)) {
                return prevSelected.filter((id) => id !== tagId)
            } else {
                return [...prevSelected, tagId]
            }
        })
    }

    const handleApplyTags = () => {
        if (selectedTagIds.length === 0) {
            setAlert({
                visible: true,
                message: "Please select at least one tag",
                type: "warning",
            })
            return
        }
        if (items.length === 0) {
            setAlert({
                visible: true,
                message: "No items selected",
                type: "warning",
            })
            return
        }

        const success = batchAssociateTags(selectedTagIds, items)

        if (success) {
            setAlert({
                visible: true,
                message: `Tags applied to ${items.length} item(s)`,
                type: "success",
            })
            setSelectedTagIds([])
            if (onTagsApplied) {
                onTagsApplied()
            }
        } else {
            setAlert({
                visible: true,
                message: "Failed to apply tags",
                type: "error",
            })
        }
    }

    const handleRemoveTags = () => {
        if (selectedTagIds.length === 0) {
            setAlert({
                visible: true,
                message: "Please select at least one tag to remove",
                type: "warning",
            })
            return
        }
        if (items.length === 0) {
            setAlert({
                visible: true,
                message: "No items selected",
                type: "warning",
            })
            return
        }

        const success = batchDisassociateTags(selectedTagIds, items)

        if (success) {
            setAlert({
                visible: true,
                message: `Tags removed from ${items.length} item(s)`,
                type: "success",
            })
            setSelectedTagIds([])
            if (onTagsApplied) {
                onTagsApplied()
            }
        } else {
            setAlert({
                visible: true,
                message: "Failed to remove tags",
                type: "error",
            })
        }
    }

    const handleClose = () => {
        setSelectedTagIds([])
        onClose()
    }

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.modalBackground}>
                <View
                    style={[
                        styles.modalContainer,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <Stack spacing={16}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            {`Manage Tags (${items.length} item${
                                items.length !== 1 ? "s" : ""
                            } selected)`}
                        </Text>

                        {tags.length > 0 ? (
                            <View style={styles.tagsContainer}>
                                {tags.map((tag) => (
                                    <Row
                                        key={tag.id}
                                        align="center"
                                        spacing={8}
                                        style={styles.tagRow}
                                    >
                                        <Checkbox
                                            checked={selectedTagIds.includes(
                                                tag.id,
                                            )}
                                            onToggle={() =>
                                                handleTagToggle(tag.id)
                                            }
                                            testID={`checkbox-${tag.id}`}
                                        />
                                        <View
                                            style={[
                                                styles.tagPreview,
                                                {
                                                    backgroundColor:
                                                        tag.color + "20",
                                                    borderColor: tag.color,
                                                },
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.dot,
                                                    {
                                                        backgroundColor:
                                                            tag.color,
                                                    },
                                                ]}
                                            />
                                            <Text
                                                style={{ color: colors.text }}
                                            >
                                                {tag.name}
                                            </Text>
                                        </View>
                                    </Row>
                                ))}
                            </View>
                        ) : (
                            <Text
                                style={[
                                    styles.emptyText,
                                    { color: colors.secondaryText },
                                ]}
                            >
                                No tags available. Create tags first.
                            </Text>
                        )}

                        <Stack spacing={12}>
                            <Row justify="space-between" align="center">
                                <View style={styles.buttonContainer}>
                                    <Button
                                        title="Apply Tags"
                                        onPress={handleApplyTags}
                                        style={
                                            selectedTagIds.length === 0
                                                ? styles.disabledButton
                                                : {}
                                        }
                                        testID="apply-tags-button"
                                    />
                                </View>
                                <View style={styles.buttonContainer}>
                                    <Button
                                        title="Remove Tags"
                                        onPress={handleRemoveTags}
                                        testID="remove-tags-button"
                                    />
                                </View>
                            </Row>
                            <Button
                                title="Close"
                                onPress={handleClose}
                                style={styles.closeButton}
                                testID="close-button"
                            />
                        </Stack>
                    </Stack>

                    {/* Alert notification */}
                    {alert.visible && (
                        <Alert
                            type={alert.type}
                            message={alert.message}
                            visible={alert.visible}
                            onClose={() =>
                                setAlert({ ...alert, visible: false })
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "85%",
        borderRadius: 10,
        padding: 20,
        maxHeight: "80%",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 16,
    },
    tagsContainer: {
        maxHeight: 300,
    },
    tagRow: {
        marginBottom: 8,
    },
    tagPreview: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        flex: 1,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    emptyText: {
        fontStyle: "italic",
        opacity: 0.7,
        textAlign: "center",
        marginTop: 8,
    },
    buttonContainer: {
        flex: 0.48,
    },
    disabledButton: {
        opacity: 0.5,
    },
    closeButton: {
        borderWidth: 1,
    },
})
