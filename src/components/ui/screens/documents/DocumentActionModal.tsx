import React from "react"
import { useTheme } from "../../../../hooks/useTheme"
import { IDocument } from "../../../../types/document"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import {
    ActionModalBase,
    ActionOption,
} from "../../../common/modal/ActionModalBase"

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

    const handleToggleFavorite = () => onToggleFavorite(document)
    const handleShare = () => onShare(document)
    const handleViewDetails = () => onViewDetails(document)
    const handleDelete = () => onDelete(document)

    const documentMenuOptions: ActionOption[] = [
        {
            label: isFavorite ? "Quitar de favoritos" : "Añadir a favoritos",
            action: handleToggleFavorite,
            icon: (
                <FontAwesome6
                    name="star"
                    size={20}
                    color={isFavorite ? colors.warning : colors.primary}
                    iconStyle={isFavorite ? "solid" : "regular"}
                />
            ),
            style: { color: isFavorite ? colors.warning : colors.primary },
            testID: "doc-action-favorite",
        },
        {
            label: "Compartir",
            action: handleShare,
            icon: (
                <FontAwesome6
                    name="share"
                    size={20}
                    color={colors.primary}
                    iconStyle="solid"
                />
            ),
            style: { color: colors.primary },
            testID: "doc-action-share",
        },
        {
            label: "Ver detalles",
            action: handleViewDetails,
            icon: (
                <FontAwesome6
                    name="circle-info"
                    size={20}
                    color={colors.primary}
                    iconStyle="solid"
                />
            ),
            style: { color: colors.primary },
            testID: "doc-action-details",
        },
        {
            label: "Eliminar",
            action: handleDelete,
            icon: (
                <FontAwesome6
                    name="trash"
                    size={20}
                    color={colors.error}
                    iconStyle="solid"
                />
            ),
            style: { color: colors.error },
            testID: "doc-action-delete",
        },
    ]

    const modalTitle = `Opciones para "${document.title || "Documento"}"`

    return (
        <ActionModalBase
            isVisible={isVisible}
            onClose={onClose}
            title={modalTitle}
            menuOptions={documentMenuOptions}
        />
    )
}
