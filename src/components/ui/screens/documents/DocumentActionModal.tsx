import React from "react"
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme.ts"
import { Stack } from "../../layout"
import { IDocument } from "../../../../types/document.ts"
import StarIcon from "../../assets/svg/starfilled.svg"
import StarOutlineIcon from "../../assets/svg/favorite.svg"
import ShareIcon from "../../assets/svg/share.svg"
import InfoIcon from "../../assets/svg/info.svg"
import TrashIcon from "../../assets/svg/trash.svg"
import ExitIcon from "../../assets/svg/close.svg"

interface DocumentActionModalProps {
    isVisible: boolean
    onClose: () => void
    document: IDocument | null
    onToggleFavorite: (document: IDocument) => void
    onShare: (document: IDocument) => void
    onViewDetails: (document: IDocument) => void
    onDelete: (document: IDocument) => void
    isFavorite: boolean
}

export function DocumentActionModal({
    isVisible,
    onClose,
    document,
    onToggleFavorite,
    onShare,
    onViewDetails,
    onDelete,
    isFavorite,
}: DocumentActionModalProps) {
    const { colors } = useTheme()

    if (!document) return null

    // Action Handlers
    const handleToggleFavorite = () => {
        if (!document) return
        onToggleFavorite(document)
        onClose()
    }
    const handleShare = () => {
        if (!document) return
        onShare(document)
        onClose()
    }
    const handleViewDetails = () => {
        if (!document) return
        onViewDetails(document)
        onClose()
    }
    const handleDelete = () => {
        if (!document) return
        onDelete(document)
        onClose()
    }

    const menuOptions = [
        {
            label: isFavorite ? "Remove Favorite" : "Add Favorite",
            action: handleToggleFavorite,
            icon: isFavorite ? (
                <StarIcon width={20} height={20} fill={colors.warning} />
            ) : (
                <StarOutlineIcon
                    width={20}
                    height={20}
                    stroke={colors.primary}
                />
            ),
            style: { color: isFavorite ? colors.warning : colors.primary },
        },
        {
            label: "Share",
            action: handleShare,
            icon: <ShareIcon width={20} height={20} stroke={colors.primary} />,
            style: { color: colors.primary },
        },
        {
            label: "View Details",
            action: handleViewDetails,
            icon: <InfoIcon width={20} height={20} stroke={colors.primary} />,
            style: { color: colors.primary },
        },
        {
            label: "Delete",
            action: handleDelete,
            icon: <TrashIcon width={20} height={20} stroke={colors.error} />,
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
                                {document.title || "Document"} Options
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

// TODO: Reuse styles from FolderActionModal, potentially move to common location later
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
