import React from "react"
import { useTheme } from "../../../../hooks/useTheme"
import { Folder } from "./types"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
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
            testID: "folder-action-share",
        },
        {
            label: "Editar",
            action: handleEdit,
            icon: (
                <FontAwesome6
                    name="pen-to-square"
                    size={20}
                    color={colors.primary}
                    iconStyle="solid"
                />
            ),
            style: { color: colors.primary },
            testID: "folder-action-edit",
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
            testID: "folder-action-delete",
        },
    ]

    const modalTitle = `Opciones para "${folder.title}"`

    return (
        <ActionModalBase
            isVisible={isVisible}
            onClose={onClose}
            title={modalTitle}
            menuOptions={folderMenuOptions}
        />
    )
}
