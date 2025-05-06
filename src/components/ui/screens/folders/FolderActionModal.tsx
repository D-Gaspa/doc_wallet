import React from "react"
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { Stack } from "../../layout"
import { Folder } from "./types"

import ShareIcon from "../../assets/svg/share.svg"
import EditIcon from "../../assets/svg/edit.svg"
import DeleteIcon from "../../assets/svg/trash.svg"
import ExitIcon from "../../assets/svg/close.svg"

interface FolderActionModalProps {
    isVisible: boolean
    onClose: () => void
    folder: Folder | null
    onShare: (folder: Folder) => void
    onEdit: (folder: Folder) => void
    onDelete: (folder: Folder) => void
}

export function FolderActionModal({
    isVisible,
    onClose,
    folder,
    onShare,
    onEdit,
    onDelete,
}: FolderActionModalProps) {
    const { colors } = useTheme()

    if (!folder) return null

    const handleShare = () => {
        if (!folder) return
        onShare(folder)
        onClose()
    }
    const handleEdit = () => {
        if (!folder) return
        onEdit(folder)
        onClose()
    }
    const handleDelete = () => {
        if (!folder) return
        onDelete(folder)
        onClose()
    }

    const menuOptions = [
        {
            label: "Share",
            action: handleShare,
            icon: <ShareIcon width={20} height={20} stroke={colors.primary} />,
            style: { color: colors.primary },
        },
        {
            label: "Edit",
            action: handleEdit,
            icon: <EditIcon width={20} height={20} stroke={colors.primary} />,
            style: { color: colors.primary },
        },
        {
            label: "Delete",
            action: handleDelete,
            icon: <DeleteIcon width={20} height={20} stroke={colors.error} />,
            style: { color: colors.error },
        },
    ]

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View
                    style={[
                        styles.overlay,
                        { backgroundColor: colors.shadow + "60" },
                    ]}
                >
                    <TouchableWithoutFeedback
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View
                            style={[
                                styles.modalContent,
                                {
                                    backgroundColor: colors.card,
                                    shadowColor: colors.shadow,
                                },
                            ]}
                        >
                            <Text
                                style={[styles.title, { color: colors.text }]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {folder.title} Options
                            </Text>
                            <Stack spacing={0} style={styles.optionsStack}>
                                {menuOptions.map((option, index) => (
                                    <TouchableOpacity
                                        key={option.label}
                                        style={[
                                            styles.optionButton,
                                            index < menuOptions.length - 1 && {
                                                borderBottomColor:
                                                    colors.border,
                                                borderBottomWidth:
                                                    StyleSheet.hairlineWidth,
                                            },
                                        ]}
                                        onPress={option.action}
                                        activeOpacity={0.7}
                                    >
                                        {option.icon && (
                                            <View style={styles.iconWrapper}>
                                                {option.icon}
                                            </View>
                                        )}
                                        <Text
                                            style={[
                                                styles.optionText,
                                                option.style,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </Stack>
                            <TouchableOpacity
                                style={[
                                    styles.optionButton,
                                    styles.closeButton,
                                    { borderTopColor: colors.border },
                                ]}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <ExitIcon
                                    width={20}
                                    height={20}
                                    stroke={colors.secondaryText}
                                />
                                <Text
                                    style={[
                                        styles.optionText,
                                        { color: colors.secondaryText },
                                    ]}
                                >
                                    Close
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    )
}

// TODO: Reuse styles from DocumentActionModal
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "80%",
        maxWidth: 320,
        borderRadius: 12,
        paddingTop: 15,
        paddingBottom: 0,
        paddingHorizontal: 0,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    optionsStack: {
        marginBottom: 5,
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    iconWrapper: {
        marginRight: 15,
        width: 24,
        alignItems: "center",
    },
    optionText: {
        fontSize: 16,
        fontWeight: "500",
    },
    closeButton: {
        borderTopWidth: StyleSheet.hairlineWidth,
    },
})
