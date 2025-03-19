import React, { useState, useEffect } from "react"
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
import { FolderType } from "./FolderCreateModal"
import { CustomIconSelector } from "./CustomIconSelector"
import { useDismissGesture } from "../../gestures/useDismissGesture.ts"

// Props for the edit folder modal
interface FolderEditModalProps {
    isVisible: boolean
    onClose: () => void
    onUpdateFolder: (
        id: string,
        name: string,
        type: FolderType,
        customIconId?: string
    ) => void
    folderId: string
    initialName: string
    initialType: FolderType
    initialCustomIconId?: string
}

export function FolderEditModal({
    isVisible,
    onClose,
    onUpdateFolder,
    folderId,
    initialName,
    initialType,
    initialCustomIconId = "file",
}: FolderEditModalProps) {
    const { colors } = useTheme()
    const logger = LoggingService.getLogger
        ? LoggingService.getLogger("FolderEditModal")
        : { debug: console.debug }

    // State for folder name and type
    const [folderName, setFolderName] = useState(initialName)
    const [selectedType, setSelectedType] = useState<FolderType>(initialType)
    const [customIconId, setCustomIconId] = useState(initialCustomIconId)

    const { translateX, panHandlers, resetPosition } = useDismissGesture({
        onDismiss: handleCancel,
        direction: "horizontal",
    })

    useEffect(() => {
        if (isVisible) {
            setFolderName(initialName)
            setSelectedType(initialType)
            setCustomIconId(initialCustomIconId || "file")

            // Reset pan position when modal opens
            resetPosition()
        }
    }, [isVisible, initialName, initialType, initialCustomIconId])

    // Folder type options
    const folderTypes = [
        { type: "travel" as const, label: "Travel" },
        { type: "medical" as const, label: "Medical" },
        { type: "car" as const, label: "Vehicle" },
        { type: "education" as const, label: "Education" },
        { type: "custom" as const, label: "Custom" },
    ]

    // Handle update action
    const handleUpdate = () => {
        if (folderName.trim() === "") {
            return // Don't update folder with empty name
        }

        onUpdateFolder(
            folderId,
            folderName,
            selectedType,
            selectedType === "custom" ? customIconId : undefined
        )

        logger.debug("Updating folder", {
            id: folderId,
            name: folderName,
            type: selectedType,
            customIconId: selectedType === "custom" ? customIconId : undefined,
        })

        onClose()
    }

    function handleCancel() {
        onClose()
    }

    // Compute button style conditionally
    const updateButtonStyle: ViewStyle =
        folderName.trim() === "" ? { ...styles.disabledButton } : {}

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
                <Spacer size={30} />
                <View style={styles.headerBar}>
                    <View style={styles.closeIndicator} />
                    <Text variant="lg" weight="bold" style={styles.title}>
                        Edit new folder
                    </Text>
                </View>

                <View style={styles.container} testID="folder-edit-modal">
                    <Stack spacing={16}>
                        {/* Folder name input */}
                        <Stack spacing={8}>
                            <Text weight="medium">Folder Name</Text>
                            <TextField
                                placeholder="Enter folder name"
                                value={folderName}
                                onChangeText={setFolderName}
                            />
                        </Stack>

                        {/* Folder type selection */}
                        <Stack spacing={8}>
                            <Text weight="medium">Folder Type</Text>

                            <ScrollView
                                style={styles.typesScrollView}
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                            >
                                <View style={styles.typesContainer}>
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
                                                    setSelectedType(item.type)
                                                }
                                            />
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        </Stack>

                        {/* Custom icon selector (only visible when custom type is selected) */}
                        {selectedType === "custom" && (
                            <CustomIconSelector
                                selectedIconId={customIconId}
                                onSelectIcon={setCustomIconId}
                            />
                        )}

                        {/* Action buttons */}
                        <Row justify="space-between" align="center">
                            {/* Cancel Button */}
                            <View style={styles.buttonContainer}>
                                <Button
                                    title="Cancel"
                                    onPress={handleCancel}
                                    testID="cancel-button"
                                />
                            </View>

                            {/* Create Button */}
                            <View style={styles.buttonContainer}>
                                <Button
                                    title="Edit Folder"
                                    onPress={handleUpdate}
                                    style={updateButtonStyle}
                                    testID="edit-button"
                                />
                            </View>
                        </Row>
                    </Stack>
                </View>
            </Animated.View>
        </BaseModal>
    )
}
const styles = StyleSheet.create({
    modalContent: {
        flex: 1,
    },
    container: {
        padding: 15,
    },
    headerBar: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: "center",
        borderBottomWidth: 1,
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
    typesScrollView: {
        maxHeight: 190,
    },
    typesContainer: {
        paddingBottom: 8,
    },
    folderCardWrapper: {
        overflow: "hidden",
        marginBottom: 8,
    },
    buttonContainer: {
        flex: 0.48,
    },
    disabledButton: {
        opacity: 0.5,
    },
})
