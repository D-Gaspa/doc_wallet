import React, { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { useTagContext } from "./TagContext"
import { Row } from "../layout"
import { Button } from "../button"
import { Toast } from "../feedback"
import { Checkbox } from "../form"
import { SelectedItem } from "../screens/folders/useSelectionMode"
import { BaseBottomSheetModal } from "../../common/modal/BaseBottomSheetModal"
import { AlertType } from "../feedback/Alert"

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
    const [toastVisible, setToastVisible] = useState(false)
    const [toastMessage, setToastMessage] = useState("")
    const [toastType, setToastType] = useState<AlertType>("info")

    const handleClose = () => {
        setSelectedTagIds([])
        onClose()
    }
    const showToast = (message: string, type: AlertType = "info") => {
        setToastMessage(message)
        setToastType(type)
        setToastVisible(true)
    }
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
            showToast("Please select at least one tag", "warning")
            return
        }
        if (items.length === 0) {
            showToast("No items selected", "warning")
            return
        }
        const success = batchAssociateTags(selectedTagIds, items)
        if (success) {
            showToast(`Tags applied to ${items.length} item(s)`, "success")
            setSelectedTagIds([])
            if (onTagsApplied) {
                onTagsApplied()
            }
            onClose()
        } else {
            showToast("Failed to apply tags", "error")
        }
    }

    const handleRemoveTags = () => {
        if (selectedTagIds.length === 0) {
            showToast("Please select at least one tag to remove", "warning")
            return
        }
        if (items.length === 0) {
            showToast("No items selected", "warning")
            return
        }

        const success = batchDisassociateTags(selectedTagIds, items)

        if (success) {
            showToast(`Tags removed from ${items.length} item(s)`, "success")
            setSelectedTagIds([])
            if (onTagsApplied) {
                onTagsApplied()
            }
            onClose()
        } else {
            showToast("Failed to remove tags", "error")
        }
    }

    return (
        <BaseBottomSheetModal
            isVisible={isVisible}
            onClose={handleClose}
            dismissOnBackdropPress={true}
        >
            {/* eslint-disable-next-line react-native/no-inline-styles */}
            <View style={[styles.modalContentContainer, { paddingBottom: 20 }]}>
                {/* Header */}
                <Text style={[styles.title, { color: colors.text }]}>
                    {`Manage Tags (${items.length} item${
                        items.length !== 1 ? "s" : ""
                    } selected)`}
                </Text>

                {/* Scrollable Tag List */}
                <ScrollView
                    style={styles.tagsScrollView}
                    contentContainerStyle={styles.tagsContentContainer}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                >
                    {tags.length > 0 ? (
                        tags.map((tag) => (
                            <Row
                                key={tag.id}
                                align="center"
                                spacing={10}
                                style={styles.tagRow}
                            >
                                <Checkbox
                                    checked={selectedTagIds.includes(tag.id)}
                                    onToggle={() => handleTagToggle(tag.id)}
                                    testID={`checkbox-${tag.id}`}
                                />
                                <View
                                    style={[
                                        styles.tagPreview,
                                        {
                                            backgroundColor: tag.color + "20",
                                            borderColor: tag.color,
                                        },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.dot,
                                            { backgroundColor: tag.color },
                                        ]}
                                    />
                                    <Text
                                        style={{ color: colors.text }}
                                        numberOfLines={1}
                                    >
                                        {tag.name}
                                    </Text>
                                </View>
                            </Row>
                        ))
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
                </ScrollView>

                <View
                    style={[
                        styles.separator,
                        { borderTopColor: colors.border },
                    ]}
                />

                {/* Action Buttons (Apply/Remove) */}
                <View style={styles.actionButtonsContainer}>
                    <Row justify="space-between" align="center">
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Apply Tags"
                                onPress={handleApplyTags}
                                disabled={selectedTagIds.length === 0}
                                testID="apply-tags-button"
                            />
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Remove Tags"
                                variant="outline"
                                onPress={handleRemoveTags}
                                disabled={selectedTagIds.length === 0}
                                testID="remove-tags-button"
                            />
                        </View>
                    </Row>
                </View>

                {/* Close Button (Separate) */}
                <View style={styles.closeButtonContainer}>
                    <Button
                        title="Close"
                        variant="text"
                        onPress={handleClose}
                        testID="close-button"
                    />
                </View>

                <Toast
                    message={toastMessage}
                    visible={toastVisible}
                    onDismiss={() => setToastVisible(false)}
                    duration={
                        toastType === "error" || toastType === "warning"
                            ? 4000
                            : 3000
                    }
                />
            </View>
        </BaseBottomSheetModal>
    )
}

const styles = StyleSheet.create({
    modalContentContainer: {
        width: "100%",
        flexDirection: "column",
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 16,
        flexShrink: 0,
    },
    tagsScrollView: {
        flexGrow: 1,
        flexShrink: 1,
        marginVertical: 8,
    },
    tagsContentContainer: {
        paddingBottom: 10,
    },
    tagRow: {
        marginBottom: 12,
    },
    tagPreview: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        flex: 1,
        overflow: "hidden",
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    emptyText: {
        fontStyle: "italic",
        opacity: 0.7,
        textAlign: "center",
        marginVertical: 20,
        paddingHorizontal: 10,
    },
    separator: {
        borderTopWidth: StyleSheet.hairlineWidth,
        marginVertical: 16,
        flexShrink: 0,
    },
    actionButtonsContainer: {
        marginBottom: 12,
        flexShrink: 0,
    },
    buttonContainer: {
        flex: 1,
        marginHorizontal: 5,
    },
    closeButtonContainer: {
        marginTop: 4,
        marginBottom: 5,
        flexShrink: 0,
    },
})
