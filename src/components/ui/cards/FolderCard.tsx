import React, { useMemo } from "react"
import {
    GestureResponderEvent,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../hooks/useTheme"
import { ItemTagsManager } from "../tag_functionality/ItemTagsManager"
import { useTagContext } from "../tag_functionality/TagContext"
import { ListItemCard } from "./ListItemCard"
import { Folder } from "../screens/folders/types"
import {
    getIconById,
    ThemeColors as CustomIconSelectorThemeColors,
} from "../screens/folders/CustomIconSelector"
import { FA6IconName } from "../../../types/icons"

export interface FolderCardProps {
    folderId: string
    title: string
    subtitle?: string
    type?: Folder["type"]
    customIconId?: FA6IconName
    customIconColor?: string
    isFavorite?: boolean
    selected?: boolean
    showTags?: boolean
    displayIconId?: FA6IconName
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
    customIconColor,
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

    const iconNode = useMemo(() => {
        const iconSizeForCard = 28
        const effectiveIconId =
            displayIconId ||
            (type === "custom" && customIconId ? customIconId : type)

        const colorForIconOverride =
            type === "custom" && customIconId && customIconColor
                ? customIconColor
                : undefined

        return getIconById(
            effectiveIconId,
            colors as unknown as CustomIconSelectorThemeColors,
            iconSizeForCard,
            colorForIconOverride,
        )
    }, [type, customIconId, customIconColor, colors, displayIconId])

    const handleButtonPress =
        (handler?: () => void) => (event: GestureResponderEvent) => {
            event.stopPropagation()
            handler?.()
        }

    const actionIconsNode = useMemo(
        () => (
            <View style={styles.actionButtonsContainer}>
                {onToggleFavorite && (
                    <TouchableOpacity
                        onPress={handleButtonPress(onToggleFavorite)}
                        style={styles.actionButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 5 }}
                        testID={`folder-fav-btn-${folderId}`}
                        accessibilityLabel={
                            isFavorite
                                ? "Quitar de favoritos"
                                : "Añadir a favoritos"
                        }
                    >
                        {isFavorite ? (
                            <FontAwesome6
                                name="star"
                                size={18}
                                color={colors.warning}
                                iconStyle="solid"
                            />
                        ) : (
                            <FontAwesome6
                                name="star"
                                size={18}
                                color={colors.secondaryText}
                                iconStyle="regular"
                            />
                        )}
                    </TouchableOpacity>
                )}
                {onShowOptions && (
                    <TouchableOpacity
                        onPress={handleButtonPress(onShowOptions)}
                        style={styles.actionButton}
                        hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
                        testID={`folder-options-btn-${folderId}`}
                        accessibilityLabel="Más opciones"
                    >
                        <FontAwesome6
                            name="ellipsis-vertical"
                            size={18}
                            color={colors.secondaryText}
                            iconStyle="solid"
                        />
                    </TouchableOpacity>
                )}
            </View>
        ),
        [isFavorite, onToggleFavorite, onShowOptions, colors, folderId],
    )

    const folderTags = showTags
        ? tagContext.getTagsForItem(folderId, "folder")
        : []

    const childrenNode = useMemo(
        () =>
            showTags && folderTags.length > 0 ? (
                <ItemTagsManager
                    itemId={folderId}
                    itemType="folder"
                    tags={folderTags}
                    allTags={tagContext.tags}
                    onTagPress={onTagPress}
                    selectedTagIds={selectedTagIds}
                    horizontal={true}
                    showAddTagButton={true}
                    size="small"
                    initiallyExpanded={false}
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
            testID={testID ?? `folder-card-${folderId}`}
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
        marginLeft: 10,
        justifyContent: "center",
        alignItems: "center",
    },
})
