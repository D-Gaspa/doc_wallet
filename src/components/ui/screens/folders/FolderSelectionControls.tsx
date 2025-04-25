import React from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { Row } from "../../layout"
import { Text } from "../../typography"
import { Folder } from "./types"
import { useTheme } from "../../../../hooks/useTheme"

interface FolderSelectionControlsProps {
    selectionMode: boolean
    selectedFolderIds: string[]
    filteredFolders: Folder[]
    toggleSelectionMode: () => void
    handleSelectAll: (folders: Folder[]) => void
    setBatchTagModalVisible: (visible: boolean) => void
    onMovePress?: () => void
    testID?: string
}

export function FolderSelectionControls({
    selectionMode,
    selectedFolderIds,
    filteredFolders,
    toggleSelectionMode,
    handleSelectAll,
    setBatchTagModalVisible,
    onMovePress,
    testID,
}: FolderSelectionControlsProps) {
    const { colors } = useTheme()

    const numSelected = selectedFolderIds.length
    const numTotal = filteredFolders.length
    const allSelected = numSelected === numTotal && numTotal > 0

    // Helper component for tappable text buttons
    const TextButton = ({
        title,
        onPress,
        style,
        textStyle,
        testID,
    }: {
        title: string
        onPress: () => void
        style?: object
        textStyle?: object
        testID?: string
    }) => (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.textButtonBase, style]} // Base style + specific overrides
            testID={testID}
            activeOpacity={0.6} // Feedback on press
        >
            <Text
                style={[
                    styles.textButtonText,
                    { color: colors.primary },
                    textStyle,
                ]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    )

    return (
        <View
            style={styles.container}
            testID={testID ?? "folder-selection-controls"}
        >
            {selectionMode ? (
                // --- Selection Mode Active ---
                <Row justify="space-between" align="center" style={styles.row}>
                    {/* Left side: Selection Count */}
                    <View style={styles.infoContainer}>
                        <Text
                            style={[
                                styles.selectionText,
                                { color: colors.text },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {`${numSelected} selected`}
                        </Text>
                    </View>

                    {/* Right side: Action Buttons (as TextButton) */}
                    <View style={styles.buttonsContainer}>
                        {/* Conditionally show Move and +Tags if items are selected */}
                        {numSelected > 0 && (
                            <>
                                {onMovePress && (
                                    <TextButton
                                        title="Mover"
                                        onPress={onMovePress}
                                        testID="move-folders-button"
                                    />
                                )}
                                <TextButton
                                    title="+ Tags"
                                    onPress={() =>
                                        setBatchTagModalVisible(true)
                                    }
                                    testID="batch-tags-button"
                                />
                            </>
                        )}

                        {/* Select All / None Button */}
                        <TextButton
                            title={allSelected ? "Ninguno" : "Todos"}
                            onPress={() => handleSelectAll(filteredFolders)}
                            testID="select-all-button"
                        />

                        {/* Cancel Button */}
                        <TextButton
                            title="Cancelar"
                            onPress={toggleSelectionMode}
                            // Optionally use a different color for Cancel
                            textStyle={{ color: colors.secondaryText }}
                            testID="cancel-selection-button"
                        />
                    </View>
                </Row>
            ) : (
                <View style={styles.selectButtonContainer}>
                    <TextButton
                        title="Seleccionar"
                        onPress={toggleSelectionMode}
                        testID="toggle-selection-button"
                    />
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
        marginBottom: 12,
        width: "100%",
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: 4,
    },
    row: {
        width: "100%",
        minHeight: 44,
    },
    infoContainer: {
        flexShrink: 1,
        justifyContent: "center",
        paddingRight: 8,
    },
    buttonsContainer: {
        flexGrow: 1,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        flexWrap: "nowrap",
    },
    selectionText: {
        fontSize: 14,
        fontWeight: "500",
    },
    // Base style for the tappable text
    textButtonBase: {
        paddingVertical: 8, // Vertical padding for touch area
        paddingHorizontal: 10, // Horizontal padding for touch area and spacing
        marginLeft: 6, // Space between buttons
        borderRadius: 4, // Optional: slight rounding
        justifyContent: "center",
        alignItems: "center",
    },
    // Style for the text inside the tappable area
    textButtonText: {
        fontSize: 14,
        fontWeight: "600", // Make text bold to indicate interactivity
        textAlign: "center",
    },
    // Container for the inactive "Select" button to align it right
    selectButtonContainer: {
        alignItems: "flex-end", // Align button to the right
    },
})
