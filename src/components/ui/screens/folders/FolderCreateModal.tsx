import React, { useState } from "react"
import { StyleSheet, View, ScrollView, ViewStyle, Animated } from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { BaseModal } from "../../../common/modal"
import { Stack } from "../../layout"
import { Row } from "../../layout"
import { Text } from "../../typography"
import { TextField } from "../../form"
import { FolderCard } from "../../cards"
import { Button } from "../../button"
import { LoggingService } from "../../../../services/monitoring/loggingService"
import { CustomIconSelector } from "./CustomIconSelector"
import { useDismissGesture } from "../../gestures/useDismissGesture.ts"

// Folder type definition
export type FolderType = "travel" | "medical" | "car" | "education" | "custom"

// Props for the create folder modal
interface FolderCreateModalProps {
    isVisible: boolean
    onClose: () => void
    onCreateFolder: (
        name: string,
        type: FolderType,
        customIconId?: string
    ) => void
    parentFolderId: string | null
}

export function FolderCreateModal({
    isVisible,
    onClose,
    onCreateFolder,
    parentFolderId,
}: FolderCreateModalProps) {
    const { colors } = useTheme()
    const logger = LoggingService.getLogger
        ? LoggingService.getLogger("FolderCreateModal")
        : { debug: console.debug }

    // State for folder name and type
    const [folderName, setFolderName] = useState("")
    const [selectedType, setSelectedType] = useState<FolderType>("custom")
    const [customIconId, setCustomIconId] = useState("file") // Default custom icon

    // Use the dismiss gesture hook
    const { translateX, panHandlers } = useDismissGesture({
        onDismiss: handleCancel,
        direction: "horizontal",
    })

    // Folder type options
    const folderTypes = [
        { type: "travel" as const, label: "Travel" },
        { type: "medical" as const, label: "Medical" },
        { type: "car" as const, label: "Vehicle" },
        { type: "education" as const, label: "Education" },
        { type: "custom" as const, label: "Custom" },
    ]

    // Handle create action
    const handleCreate = () => {
        if (folderName.trim() === "") {
            return // Don't create folder with empty name
        }

        onCreateFolder(
            folderName,
            selectedType,
            selectedType === "custom" ? customIconId : undefined
        )
        logger.debug("Creating folder", {
            name: folderName,
            type: selectedType,
            customIconId: selectedType === "custom" ? customIconId : undefined,
            parentId: parentFolderId,
        })

        // Reset state
        setFolderName("")
        setSelectedType("custom")
        setCustomIconId("file")
        onClose()
    }

    // Handle cancel action
    function handleCancel() {
        // Reset state
        setFolderName("")
        setSelectedType("custom")
        setCustomIconId("file")
        onClose()
    }

    // Compute button style conditionally
    const createButtonStyle: ViewStyle =
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
                    <Text variant="lg" weight="bold" style={styles.title}>
                        Create New Folder
                    </Text>
                </View>

                <View style={styles.container} testID="folder-create-modal">
                    <Stack spacing={16}>
                        {/* Folder name input */}
                        <Stack spacing={8}>
                            <Text weight="medium">Folder Name</Text>
                            <TextField
                                placeholder="Enter folder name"
                                value={folderName}
                                onChangeText={setFolderName}
                                testID="folder-name-input"
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
                                                testID={`folder-type-${item.type}`}
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
                                    title="Create Folder"
                                    onPress={handleCreate}
                                    style={createButtonStyle}
                                    testID="create-button"
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
