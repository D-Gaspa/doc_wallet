import React, { useMemo } from "react"
import {
    GestureResponderEvent,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { ItemTagsManager } from "../tag_functionality/ItemTagsManager"
import { useTagContext } from "../tag_functionality/TagContext"
import { ListItemCard } from "./ListItemCard"
import { Folder } from "../screens/folders/types"
import { getIconById, ThemeColors } from "../screens/folders/CustomIconSelector"

import StarIcon from "../assets/svg/starfilled.svg"
import StarOutlineIcon from "../assets/svg/favorite.svg"
import SettingsIcon from "../assets/svg/threedots.svg"

export interface FolderCardProps {
    folderId: string
    title: string
    subtitle?: string
    type?: Folder["type"]
    customIconId?: Folder["customIconId"]
    isFavorite?: boolean
    selected?: boolean
    showTags?: boolean
    displayIconId?: string

    // Handlers
    onPress: () => void
    onLongPress?: () => void
    onToggleFavorite?: () => void
    onShowOptions?: () => void

    onTagPress?: (tagId: string) => void
    selectedTagIds?: string[]

    testID?: string
}

export function FolderCard({
    folderId,
    title,
    subtitle,
    type = "custom",
    customIconId,
    isFavorite = false,
    selected = false,
    showTags = true,
    displayIconId,
    onPress,
    onLongPress,
    onToggleFavorite,
    onShowOptions,
    onTagPress,
    selectedTagIds = [],
    testID,
}: FolderCardProps) {
    const { colors } = useTheme()
    const tagContext = useTagContext()

    const iconNode = React.useMemo(() => {
        const iconSizeForCard = 28

        if (displayIconId) {
            return getIconById(
                displayIconId,
                colors as ThemeColors,
                iconSizeForCard,
            )
        }

        return getIconById(
            type === "custom" && customIconId ? customIconId : type,
            colors as ThemeColors,
            iconSizeForCard,
        )
    }, [type, customIconId, colors, displayIconId])

    const handleButtonPress =
        (handler?: () => void) => (event: GestureResponderEvent) => {
            event.stopPropagation()
            handler?.()
        }

    const actionIconsNode = React.useMemo(
        () => (
            <View style={styles.actionButtonsContainer}>
                {onToggleFavorite && (
                    <TouchableOpacity
                        onPress={handleButtonPress(onToggleFavorite)}
                        style={styles.actionButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 5 }}
                        testID={`folder-fav-btn-${folderId}`}
                    >
                        {isFavorite ? (
                            <StarIcon
                                width={18}
                                height={18}
                                fill={colors.warning}
                            />
                        ) : (
                            <StarOutlineIcon
                                width={18}
                                height={18}
                                stroke={colors.secondaryText}
                            />
                        )}
                    </TouchableOpacity>
                )}

                {/* Options Button */}
                {onShowOptions && (
                    <TouchableOpacity
                        onPress={handleButtonPress(onShowOptions)}
                        style={styles.actionButton}
                        hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
                        testID={`folder-options-btn-${folderId}`}
                    >
                        <SettingsIcon
                            width={18}
                            height={18}
                            fill={colors.secondaryText}
                        />
                    </TouchableOpacity>
                )}
            </View>
        ),

        [
            isFavorite,
            onToggleFavorite,
            onShowOptions,
            colors,
            folderId,
            handleButtonPress,
        ],
    )

    // --- Prepare Children (Tags) ---
    const folderTags = showTags
        ? tagContext.getTagsForItem(folderId, "folder")
        : []
    const childrenNode = useMemo(
        () =>
            showTags ? (
                <ItemTagsManager
                    itemId={folderId}
                    itemType="folder"
                    tags={folderTags}
                    allTags={tagContext.tags}
                    onTagPress={onTagPress}
                    selectedTagIds={selectedTagIds}
                    horizontal={true}
                    showAddTagButton={true}
                />
            ) : null,
        [
            showTags,
            folderId,
            folderTags,
            tagContext.tags,
            onTagPress,
            selectedTagIds,
        ],
    )

    return (
        <ListItemCard
            id={folderId}
            title={title}
            subtitle={subtitle}
            icon={iconNode}
            actionIcons={actionIconsNode}
            onPress={onPress}
            onLongPress={onLongPress}
            selected={selected}
            testID={testID}
        >
            {childrenNode}
        </ListItemCard>
    )
}

const styles = StyleSheet.create({
    actionButtonsContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    actionButton: {
        padding: 4,
        marginLeft: 8,
        justifyContent: "center",
        alignItems: "center",
    },
})
