import React from "react"
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { Stack } from "../../layout"
import { Folder } from "./types"

import ShareIcon from "../../assets/svg/share.svg"
import EditIcon from "../../assets/svg/edit.svg"
import ExitIcon from "../../assets/svg/close.svg"

interface FolderActionModalProps {
    isVisible: boolean
    onClose: () => void
    folder: Folder | null
    onShare: (folder: Folder) => void
    onEdit: (folder: Folder) => void
}

export function FolderActionModal({
    isVisible,
    onClose,
    folder,
    onShare,
    onEdit,
}: FolderActionModalProps) {
    const { colors } = useTheme()

    if (!folder) return null
    const handleShare = () => {
        onShare(folder)
        onClose()
    }

    const handleEdit = () => {
        onEdit(folder)
        onClose()
    }

    const menuOptions = [
        { label: "Share", action: handleShare, icon: <ShareIcon /> },
        { label: "Edit", action: handleEdit, icon: <EditIcon /> },
        { label: "Exit", action: onClose, icon: <ExitIcon /> },
    ]

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View
                            style={[
                                styles.modalContent,
                                { backgroundColor: colors.card },
                            ]}
                        >
                            <Text
                                style={[styles.title, { color: colors.text }]}
                            >
                                {folder.title} Options
                            </Text>
                            <Stack spacing={0}>
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
                                            // Style the 'Exit' or 'Delete' differently if needed
                                            option.label === "Exit" &&
                                                styles.exitButton,
                                        ]}
                                        onPress={option.action}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                option.label === "Exit"
                                                    ? { color: colors.error } // Example: Red for Exit
                                                    : { color: colors.primary },
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </Stack>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "80%",
        maxWidth: 300,
        borderRadius: 12,
        paddingVertical: 10, // Padding top/bottom for the whole modal
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
        paddingHorizontal: 15, // Add padding for title
    },
    optionButton: {
        flexDirection: "row", // For icon + text layout
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 20, // Padding inside each button
    },
    optionText: {
        fontSize: 16,
        fontWeight: "500",
        marginLeft: 10, // Space between icon and text
    },
    exitButton: {
        // Optional: Specific styles for the Exit button if needed
    },
})
