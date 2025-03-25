import React, { useState, useEffect, useRef } from "react"
import { StyleSheet, View, ScrollView, ViewStyle, Animated } from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { BaseModal } from "../../../common/modal"
import { Stack } from "../../layout"
import { Row } from "../../layout"
import { Spacer } from "../../layout"
import { Text } from "../../typography"
import { TextField } from "../../form"
import { FolderCard } from "../../cards"
import { Button } from "../../button"
import { LoggingService } from "../../../../services/monitoring/loggingService"
import { useDismissGesture } from "../../gestures/useDismissGesture.ts"
import { CustomIconSelector } from "./CustomIconSelector"

// Folder type definition
export type FolderType = "travel" | "medical" | "car" | "education" | "custom"

// Props for the unified folder modal
interface UnifiedFolderModalProps {
    isVisible: boolean
    onClose: () => void
    onSave: (
        name: string,
        type: FolderType,
        customIconId?: string,
        folderId?: string,
    ) => void
    mode: "create" | "edit"
    initialData?: {
        id?: string
        name?: string
        type?: FolderType
        customIconId?: string
    }
    parentFolderId?: string | null
}

export function UnifiedFolderModal({
    isVisible,
    onClose,
    onSave,
    mode = "create",
    initialData = {},
    parentFolderId = null,
}: UnifiedFolderModalProps) {
    const { colors } = useTheme()
    const logger = LoggingService.getLogger
        ? LoggingService.getLogger("UnifiedFolderModal")
        : { debug: console.debug }

    // Track if modal is fully mounted to prevent premature interactions
    const isMounted = useRef(false)

    // State for folder name and type
    const [folderName, setFolderName] = useState(initialData.name || "")
    const [selectedType, setSelectedType] = useState<FolderType>(
        initialData.type || "custom",
    )
    const [customIconId, setCustomIconId] = useState(
        initialData.customIconId || "file",
    )

    // Track whether the custom type was selected - used to safely handle icon selector visibility
    const [showCustomSelector, setShowCustomSelector] = useState(
        selectedType === "custom",
    )

    // Define the cancelHandler separately as a stable function reference
    const handleCancelRef = useRef(() => {
        // Reset state for create mode
        if (mode === "create") {
            setFolderName("")
            setSelectedType("custom")
            setCustomIconId("file")
        }
        onClose()
    })

    // Use the dismiss gesture hook with stable function reference
    const { translateX, panHandlers, resetPosition } = useDismissGesture({
        onDismiss: handleCancelRef.current,
        direction: "horizontal",
    })

    // Reset state and mark as mounted when modal opens or initialData changes
    useEffect(() => {
        if (isVisible) {
            setFolderName(initialData.name || "")
            setSelectedType(initialData.type || "custom")
            setCustomIconId(initialData.customIconId || "file")
            setShowCustomSelector(initialData.type === "custom")

            // Small delay to ensure the modal is fully rendered before allowing interactions
            const timer = setTimeout(() => {
                isMounted.current = true
                if (resetPosition) resetPosition()
            }, 100)

            return () => {
                clearTimeout(timer)
                isMounted.current = false
            }
        }
    }, [isVisible, initialData])

    // Folder type options
    const folderTypes = [
        { type: "travel" as const, label: "Travel" },
        { type: "medical" as const, label: "Medical" },
        { type: "car" as const, label: "Vehicle" },
        { type: "education" as const, label: "Education" },
        { type: "custom" as const, label: "Custom" },
    ]

    // Handle type selection with debounce
    const handleTypeSelect = (type: FolderType) => {
        if (!isMounted.current) return

        setSelectedType(type)

        // Use setTimeout to delay showing the custom selector to avoid rendering issues
        if (type === "custom") {
            if (!customIconId) setCustomIconId("file")
            // Delay showing the selector to prevent layout issues
            setTimeout(() => {
                setShowCustomSelector(true)
            }, 50)
        } else {
            setShowCustomSelector(false)
        }
    }

    // Handle icon selection
    const handleIconSelect = (iconId: string) => {
        if (!isMounted.current) return
        setCustomIconId(iconId)
    }

    // Handle save action
    const handleSave = () => {
        if (!isMounted.current || folderName.trim() === "") {
            return // Don't save if not mounted or folder has empty name
        }

        onSave(
            folderName,
            selectedType,
            selectedType === "custom" ? customIconId : undefined,
            initialData.id,
        )

        logger.debug(`${mode === "create" ? "Creating" : "Updating"} folder`, {
            name: folderName,
            type: selectedType,
            customIconId: selectedType === "custom" ? customIconId : undefined,
            parentId: parentFolderId,
            id: initialData.id,
        })

        // Reset state for create mode
        if (mode === "create") {
            setFolderName("")
            setSelectedType("custom")
            setCustomIconId("file")
        }

        onClose()
    }

    // Handle cancel action
    function handleCancel() {
        handleCancelRef.current()
    }

    // Compute button style conditionally
    const buttonStyle: ViewStyle =
        folderName.trim() === "" ? { ...styles.disabledButton } : {}

    // Get modal title and action button text based on mode
    const modalTitle = mode === "create" ? "Create new folder" : "Edit folder"
    const actionButtonText =
        mode === "create" ? "Create Folder" : "Update Folder"

    return (
        <BaseModal
            isVisible={isVisible}
            onClose={handleCancel}
            dismissOnBackdropPress={false}
        >
            <Animated.View
                style={[styles.modalContent, { transform: [{ translateX }] }]}
                {...panHandlers}
            >
                <View
                    style={[
                        styles.headerBar,
                        { borderBottomColor: colors.border },
                    ]}
                >
                    <View
                        style={[
                            styles.closeIndicator,
                            { backgroundColor: colors.secondaryText },
                        ]}
                    />
                    <Spacer size={20} />
                    <Text variant="md" weight="bold" style={styles.title}>
                        {modalTitle}
                    </Text>
                    {/* Action buttons */}
                    <Row
                        justify="space-between"
                        align="center"
                        style={styles.buttonRow}
                    >
                        {/* Cancel Button */}
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Cancel"
                                onPress={handleCancel}
                                testID="cancel-button"
                            />
                        </View>

                        {/* Action Button (Create/Update) */}
                        <View style={styles.buttonContainer}>
                            <Button
                                title={actionButtonText}
                                onPress={handleSave}
                                style={buttonStyle}
                                testID={
                                    mode === "create"
                                        ? "create-button"
                                        : "update-button"
                                }
                            />
                        </View>
                    </Row>
                </View>

                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        style={styles.container}
                        testID={`folder-${mode}-modal`}
                    >
                        <Stack spacing={16}>
                            {/* Folder name input */}
                            <Stack spacing={8}>
                                <Text weight="medium">Folder Name</Text>
                                <TextField
                                    placeholder="Enter folder name"
                                    value={folderName}
                                    onChangeText={setFolderName}
                                    testID="folder-name-input"
                                    style={styles.textField}
                                />
                            </Stack>

                            {/* Folder type selection */}
                            <Stack spacing={8}>
                                <Text weight="medium">Folder Type</Text>

                                <View style={styles.typesOuterContainer}>
                                    {folderTypes.map((item) => (
                                        <View
                                            key={item.type}
                                            style={[
                                                styles.folderCardWrapper,
                                                selectedType === item.type && {
                                                    backgroundColor:
                                                        colors.primary + "20", // 20% opacity
                                                    borderColor: colors.primary,
                                                },
                                            ]}
                                        >
                                            <FolderCard
                                                title={item.label}
                                                type={item.type}
                                                onPress={() =>
                                                    handleTypeSelect(item.type)
                                                }
                                                testID={`folder-type-${item.type}`}
                                            />
                                        </View>
                                    ))}
                                </View>
                            </Stack>

                            {/* Icon selector placeholder - always present for consistent layout */}
                            <View style={styles.iconSelectorContainer}>
                                {showCustomSelector &&
                                selectedType === "custom" ? (
                                    <CustomIconSelector
                                        selectedIconId={customIconId}
                                        onSelectIcon={handleIconSelect}
                                    />
                                ) : (
                                    <View style={styles.placeholderContainer} />
                                )}
                            </View>
                        </Stack>
                    </View>
                </ScrollView>
            </Animated.View>
        </BaseModal>
    )
}

const styles = StyleSheet.create({
    modalContent: {
        flex: 1,
        width: "100%",
    },
    scrollContainer: {
        flex: 1,
        width: "100%",
    },
    scrollContentContainer: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    container: {
        padding: 20,
        width: 380,
        flex: 1,
    },
    headerBar: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: "center",
        borderBottomWidth: 1,
        width: "100%",
    },
    title: {
        marginVertical: 10,
    },
    closeIndicator: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        marginBottom: 5,
    },
    textField: {
        width: "100%",
    },
    typesOuterContainer: {
        width: "100%",
        paddingVertical: 5,
    },
    folderCardWrapper: {
        overflow: "hidden",
        marginBottom: 12,
    },
    iconSelectorContainer: {
        width: "100%",
        minHeight: 120,
        marginTop: 10,
        marginBottom: 20,
    },
    placeholderContainer: {
        minHeight: 120,
    },
    buttonRow: {
        width: "100%",
    },
    buttonContainer: {
        flex: 0.48,
    },
    disabledButton: {
        opacity: 0.5,
    },
})
