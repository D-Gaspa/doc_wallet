import React from "react"
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
    type?: Folder["type"]
    customIconId?: Folder["customIconId"]
    isFavorite?: boolean
    selected?: boolean

    // Handlers
    onPress: () => void
    onLongPress?: () => void
    onToggleFavorite: () => void
    onShowOptions?: () => void

    onTagPress?: (tagId: string) => void
    selectedTagIds?: string[]

    testID?: string
}

export function FolderCard({
    folderId,
    title,
    type = "custom",
    customIconId,
    isFavorite = false,
    selected = false,
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
        // TODO: Using getIconById for now, will be replaced by Lucide later
        return getIconById(
            type === "custom" && customIconId ? customIconId : type,
            colors as ThemeColors,
            28, // Icon size for the card
        )
    }, [type, customIconId, colors])

    const handleButtonPress =
        (handler?: () => void) => (event: GestureResponderEvent) => {
            event.stopPropagation()
            handler?.()
        }

    const actionIconsNode = React.useMemo(
        () => (
            <View style={styles.actionButtonsContainer}>
                {/* Favorite Button */}
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
        [isFavorite, onToggleFavorite, onShowOptions, colors, folderId],
    )

    // --- Prepare Children (Tags) ---
    const folderTags = tagContext.getTagsForItem(folderId, "folder")
    const childrenNode = React.useMemo(
        () => (
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
        ),
        [folderId, folderTags, tagContext.tags, onTagPress, selectedTagIds],
    )

    // --- Render Base Component ---
    return (
        <ListItemCard
            id={folderId}
            title={title}
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
