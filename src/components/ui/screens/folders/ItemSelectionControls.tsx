import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { Row } from "../../layout"
import { ListItem } from "./types"
import { SelectedItem } from "./useSelectionMode"
import { useTheme } from "../../../../hooks/useTheme"

interface ItemSelectionControlsProps {
    selectedItems: SelectedItem[]
    displayItems: ListItem[]
    toggleSelectionMode: () => void
    handleSelectAll: (items: ListItem[]) => void
    setBatchTagModalVisible: (visible: boolean) => void
    onMovePress?: () => void
    onDeletePress?: () => void
    testID?: string
}

export function ItemSelectionControls({
    selectedItems,
    displayItems,
    toggleSelectionMode,
    handleSelectAll,
    setBatchTagModalVisible,
    onMovePress,
    onDeletePress,
    testID,
}: ItemSelectionControlsProps) {
    const { colors } = useTheme()

    const numSelected = selectedItems.length
    const numTotal = displayItems.length
    const allSelected = numSelected === numTotal && numTotal > 0
    const iconSize = 22

    let selectAllIconName: "square" | "square-check" | "square-minus"
    let selectAllAccessibilityLabel: string

    if (allSelected) {
        selectAllIconName = "square-check"
        selectAllAccessibilityLabel = "Deseleccionar todo"
    } else if (numSelected > 0 && numSelected < numTotal) {
        selectAllIconName = "square-minus"
        selectAllAccessibilityLabel = "Deseleccionar todo"
    } else {
        selectAllIconName = "square"
        selectAllAccessibilityLabel = "Seleccionar todo"
    }

    const selectionText = numSelected === 1 ? "Seleccionado" : "Seleccionados"

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    borderBottomColor: colors.border,
                },
            ]}
            testID={testID ?? "item-selection-controls-navbar"}
        >
            <Row justify="space-between" align="center" style={styles.row}>
                {/* Left side: Cancel/Close Icon */}
                <TouchableOpacity
                    onPress={toggleSelectionMode}
                    style={styles.actionButton}
                    testID="cancel-selection-icon-button"
                    activeOpacity={0.7}
                    accessibilityLabel="Cancelar selección"
                >
                    <FontAwesome6
                        name="xmark"
                        size={iconSize + 2}
                        color={colors.text}
                        iconStyle="solid"
                    />
                </TouchableOpacity>

                {/* Center: Selection Count - Redesigned */}
                <View style={styles.infoContainer}>
                    <Text
                        style={[
                            styles.selectionCountNumber,
                            { color: colors.primary },
                        ]}
                    >
                        {numSelected}
                    </Text>
                    <Text
                        style={[
                            styles.selectionCountText,
                            { color: colors.secondaryText },
                        ]}
                    >
                        {selectionText}
                    </Text>
                </View>

                {/* Right side: Action Icons */}
                <Row
                    spacing={0}
                    align="center"
                    style={styles.actionIconsContainer}
                >
                    {numSelected > 0 && onDeletePress && (
                        <TouchableOpacity
                            onPress={onDeletePress}
                            style={styles.actionButton}
                            testID="batch-delete-icon-button"
                            activeOpacity={0.7}
                            accessibilityLabel="Eliminar seleccionados"
                        >
                            <FontAwesome6
                                name="trash"
                                size={iconSize}
                                color={colors.error}
                                iconStyle="solid"
                            />
                        </TouchableOpacity>
                    )}
                    {numSelected > 0 && onMovePress && (
                        <TouchableOpacity
                            onPress={onMovePress}
                            style={styles.actionButton}
                            testID="move-items-icon-button"
                            activeOpacity={0.7}
                            accessibilityLabel="Mover seleccionados"
                        >
                            <FontAwesome6
                                name="folder-open"
                                size={iconSize}
                                color={colors.primary}
                                iconStyle="solid"
                            />
                        </TouchableOpacity>
                    )}
                    {numSelected > 0 && (
                        <TouchableOpacity
                            onPress={() => setBatchTagModalVisible(true)}
                            style={styles.actionButton}
                            testID="batch-tags-icon-button"
                            activeOpacity={0.7}
                            accessibilityLabel="Etiquetar seleccionados"
                        >
                            <FontAwesome6
                                name="tags"
                                size={iconSize}
                                color={colors.primary}
                                iconStyle="solid"
                            />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={() => handleSelectAll(displayItems)}
                        style={styles.actionButton}
                        testID="select-all-icon-button"
                        activeOpacity={0.7}
                        disabled={numTotal === 0}
                        accessibilityLabel={selectAllAccessibilityLabel}
                    >
                        <FontAwesome6
                            name={selectAllIconName}
                            size={iconSize}
                            color={
                                numTotal === 0
                                    ? colors.secondaryText
                                    : colors.primary
                            }
                            iconStyle="solid"
                        />
                    </TouchableOpacity>
                </Row>
            </Row>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        minHeight: 56,
        justifyContent: "center",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    row: {
        width: "100%",
        minHeight: 40,
        alignItems: "center",
    },
    infoContainer: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
        overflow: "hidden",
    },
    selectionCountNumber: {
        fontSize: 18,
        fontWeight: "bold",
        lineHeight: 20,
    },
    selectionCountText: {
        fontSize: 11,
        lineHeight: 14,
        textTransform: "uppercase",
    },
    actionIconsContainer: {},
    actionButton: {
        padding: 10,
        marginHorizontal: 3,
    },
})
