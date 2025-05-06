import React from "react"
import {
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native"
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

    interface TextButtonProps {
        title: string
        onPress: () => void
        style?: ViewStyle
        textStyle?: TextStyle
        testID?: string
        disabled?: boolean
    }

    const TextButton = ({
        title,
        onPress,
        style,
        textStyle,
        testID,
        disabled = false,
    }: TextButtonProps) => (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.textButtonBase,
                style,
                disabled && styles.disabledButtonOpacity,
            ]}
            testID={testID}
            activeOpacity={disabled ? 1 : 0.6}
        >
            <Text
                style={[
                    styles.textButtonText,
                    { color: disabled ? colors.secondaryText : colors.primary },
                    textStyle,
                ]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    )

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
            testID={testID ?? "item-selection-controls"}
        >
            <Row justify="space-between" align="center" style={styles.row}>
                {/* Left side: Selection Count */}
                <View style={styles.infoContainer}>
                    <Text
                        style={[
                            styles.selectionText,
                            /* eslint-disable-next-line react-native/no-inline-styles */
                            { color: colors.text, fontSize: 14 },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="clip"
                    >
                        {`${numSelected} Selected`}
                    </Text>
                </View>

                {/* Right side: Action Buttons */}
                <View style={styles.buttonsContainer}>
                    {numSelected > 0 && (
                        <>
                            {onDeletePress && (
                                <TextButton
                                    title="Delete"
                                    onPress={onDeletePress}
                                    textStyle={{ color: colors.error }}
                                    testID="batch-delete-button"
                                />
                            )}
                            {onMovePress && (
                                <TextButton
                                    title="Move"
                                    onPress={onMovePress}
                                    testID="move-items-button"
                                />
                            )}
                            <TextButton
                                title="+ Tags"
                                onPress={() => setBatchTagModalVisible(true)}
                                testID="batch-tags-button"
                            />
                        </>
                    )}

                    {/* Select All / None Button */}
                    <TextButton
                        disabled={numTotal === 0}
                        title={allSelected ? "None" : "All"}
                        onPress={() => handleSelectAll(displayItems)}
                        testID="select-all-button"
                    />

                    {/* Cancel Button */}
                    <TextButton
                        title="Cancel"
                        onPress={toggleSelectionMode}
                        testID="cancel-selection-button"
                    />
                </View>
            </Row>
        </View>
    )
}

const styles = StyleSheet.create({
    textButtonBase: {
        paddingVertical: 8,
        paddingHorizontal: 6,
        marginLeft: 2,
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    textButtonText: {
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },
    disabledButtonOpacity: {
        opacity: 0.5,
    },
    container: {
        width: "100%",
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 8,
        marginBottom: 4,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    row: {
        width: "100%",
        minHeight: 36,
        flexWrap: "nowrap",
    },
    infoContainer: {
        flexShrink: 1,
        minWidth: 30,
        justifyContent: "center",
        paddingRight: 4,
        marginRight: "auto",
    },
    buttonsContainer: {
        flexShrink: 1,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        flexWrap: "nowrap",
    },
    selectionText: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
})
