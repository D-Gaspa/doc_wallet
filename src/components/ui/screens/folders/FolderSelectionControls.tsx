import React from "react"
import { View, StyleSheet } from "react-native"
import { Row } from "../../layout"
import { Text } from "../../typography"
import { Button } from "../../button"
import { Folder } from "./types"

interface FolderSelectionControlsProps {
    selectionMode: boolean
    selectedFolderIds: string[]
    filteredFolders: Folder[]
    toggleSelectionMode: () => void
    handleSelectAll: (folders: Folder[]) => void
    setBatchTagModalVisible: (visible: boolean) => void
}

export function FolderSelectionControls({
    selectionMode,
    selectedFolderIds,
    filteredFolders,
    toggleSelectionMode,
    handleSelectAll,
    setBatchTagModalVisible,
}: FolderSelectionControlsProps) {
    return (
        <View style={styles.container}>
            {selectionMode ? (
                <Row justify="space-between" align="center" style={styles.row}>
                    <View style={styles.infoContainer}>
                        <Text
                            style={styles.selectionText}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {selectedFolderIds.length === 0
                                ? "None"
                                : `${selectedFolderIds.length} selected`}
                        </Text>
                    </View>

                    <View style={styles.buttonsContainer}>
                        {selectedFolderIds.length > 0 && (
                            <Button
                                title="+ Tags"
                                onPress={() => setBatchTagModalVisible(true)}
                                style={styles.actionButton}
                                testID="batch-tags-button"
                            />
                        )}

                        <Button
                            title={
                                selectedFolderIds.length ===
                                    filteredFolders.length &&
                                filteredFolders.length > 0
                                    ? "None"
                                    : "All"
                            }
                            onPress={() => handleSelectAll(filteredFolders)}
                            style={styles.actionButton}
                            testID="select-all-button"
                        />

                        <Button
                            title="X"
                            onPress={toggleSelectionMode}
                            style={styles.cancelButton}
                            testID="cancel-selection-button"
                        />
                    </View>
                </Row>
            ) : (
                <Button
                    title="Select"
                    onPress={toggleSelectionMode}
                    style={styles.selectButton}
                    testID="toggle-selection-button"
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
        marginBottom: 12,
        width: "100%",
    },
    row: {
        width: "100%",
    },
    infoContainer: {
        flex: 0.4,
        alignItems: "flex-start",
        justifyContent: "center",
        paddingRight: 4,
    },
    buttonsContainer: {
        flex: 0.6,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        flexWrap: "nowrap",
    },
    selectionText: {
        fontSize: 14,
        fontWeight: "500",
    },
    actionButton: {
        marginLeft: 6,
        paddingHorizontal: 8,
        height: 42,
        minWidth: 32,
        maxWidth: 80,
    },
    cancelButton: {
        marginLeft: 6,
        paddingHorizontal: 8,
        height: 42,
        minWidth: 32,
        maxWidth: 40,
    },
    selectButton: {
        marginLeft: 250,
        paddingHorizontal: 8,
        height: 42,
        minWidth: 10,
        maxWidth: 100,
    },
})
