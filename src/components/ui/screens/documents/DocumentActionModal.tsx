import React from "react"
import { useTheme } from "../../../../hooks/useTheme.ts"
import { IDocument } from "../../../../types/document.ts"
import StarIcon from "../../assets/svg/starfilled.svg"
import StarOutlineIcon from "../../assets/svg/favorite.svg"
import ShareIcon from "../../assets/svg/share.svg"
import InfoIcon from "../../assets/svg/info.svg"
import TrashIcon from "../../assets/svg/trash.svg"
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
            testID: "doc-action-favorite",
        },
        {
            label: "Share",
            action: handleShare,
            icon: <ShareIcon width={20} height={20} stroke={colors.primary} />,
            style: { color: colors.primary },
            testID: "doc-action-share",
        },
        {
            label: "View Details",
            action: handleViewDetails,
            icon: <InfoIcon width={20} height={20} stroke={colors.primary} />,
            style: { color: colors.primary },
            testID: "doc-action-details",
        },
        {
            label: "Delete",
            action: handleDelete,
            icon: <TrashIcon width={20} height={20} stroke={colors.error} />,
            style: { color: colors.error },
            testID: "doc-action-delete",
        },
    ]

    return (
        <ActionModalBase
            isVisible={isVisible}
            onClose={onClose}
            title={`${document.title || "Document"} Options`}
            menuOptions={documentMenuOptions}
        />
    )
}
