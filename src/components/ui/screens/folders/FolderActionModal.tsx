import React from "react"
import { useTheme } from "../../../../hooks/useTheme"
import { Folder } from "./types"
import ShareIcon from "../../assets/svg/share.svg"
import EditIcon from "../../assets/svg/edit.svg"
import DeleteIcon from "../../assets/svg/trash.svg"
import {
    ActionModalBase,
    ActionOption,
} from "../../../common/modal/ActionModalBase"

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

    const handleShare = () => onShare(folder)
    const handleEdit = () => onEdit(folder)
    const handleDelete = () => onDelete(folder)

    const folderMenuOptions: ActionOption[] = [
        {
            label: "Share",
            action: handleShare,
            icon: <ShareIcon width={20} height={20} stroke={colors.primary} />,
            style: { color: colors.primary },
            testID: "folder-action-share",
        },
        {
            label: "Edit",
            action: handleEdit,
            icon: <EditIcon width={20} height={20} stroke={colors.primary} />,
            style: { color: colors.primary },
            testID: "folder-action-edit",
        },
        {
            label: "Delete",
            action: handleDelete,
            icon: <DeleteIcon width={20} height={20} stroke={colors.error} />,
            style: { color: colors.error },
            testID: "folder-action-delete",
        },
    ]

    return (
        <ActionModalBase
            isVisible={isVisible}
            onClose={onClose}
            title={`${folder.title} Options`}
            menuOptions={folderMenuOptions}
        />
    )
}
