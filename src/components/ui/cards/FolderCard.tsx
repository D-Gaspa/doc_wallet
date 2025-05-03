import React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts" // Adjust path
import { ItemTagsManager } from "../tag_functionality/ItemTagsManager.tsx" // Adjust path
import { useTagContext } from "../tag_functionality/TagContext.tsx" // Adjust path
import { GestureResponderEvent } from "react-native"

// --- Import necessary icons ---
import TravelIcon from "../assets/svg/airplane.svg" // Adjusted path
import MedicalIcon from "../assets/svg/medical.svg" // Adjusted path
import CarIcon from "../assets/svg/car.svg" // Adjusted path
import EducationIcon from "../assets/svg/book.svg" // Adjusted path
import AddIcon from "..//assets/svg/plus.svg" // Adjusted path
import StarIcon from "../assets/svg/starfilled.svg"
import StarOutlineIcon from "../assets/svg/favorite.svg"
import SettingsIcon from "../assets/svg/threedots.svg"

export interface FolderCardProps {
    title: string
    type?: "travel" | "medical" | "car" | "education" | "custom"
    onPress: () => void
    onLongPress?: () => void
    onToggleFavorite: () => void // <-- Re-added: Action for the favorite button CLICK
    onShowOptions?: () => void
    isFavorite?: boolean
    customIcon?: React.ReactNode
    isNewFolder?: boolean
    selected?: boolean
    folderId?: string
    onTagPress?: (tagId: string) => void
    selectedTagIds?: string[]
    testID?: string
    handleMoveFolders?: (folderIds: string[], targetId: string | null) => void
}

// --- Component Implementation ---
export function FolderCard({
    title,
    type = "custom",
    onPress,
    onLongPress,
    customIcon,
    isNewFolder = false,
    selected = false,
    folderId,
    onToggleFavorite, // <-- Ensure it's destructured
    onShowOptions,
    isFavorite = false,
    onTagPress,
    selectedTagIds = [],
    testID,
}: FolderCardProps) {
    const { colors } = useTheme()
    const tagContext = useTagContext()

    const folderIcons = {
        /* ... icon mapping ... */
        travel: <TravelIcon width={24} height={24} fill={"#E74C3C"} />,
        medical: <MedicalIcon width={24} height={24} fill={"#3498DB"} />,
        car: <CarIcon width={24} height={24} fill={"#9B59B6"} />,
        education: <EducationIcon width={24} height={24} fill={"#2ECC71"} />,
        custom: customIcon ?? (
            <EducationIcon width={24} height={24} fill={colors.primary} />
        ),
    }

    const folderTags = folderId
        ? tagContext.getTagsForItem(folderId, "folder")
        : []

    const handleButtonPress =
        (handler?: () => void) => (event: GestureResponderEvent) => {
            event.stopPropagation()
            handler?.()
        }

    return (
        <TouchableOpacity
            style={[styles.container, { borderBottomColor: colors.border }]}
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={500}
            testID={testID}
            activeOpacity={0.7}
        >
            {selected && (
                <View
                    style={[
                        styles.selectionIndicator,
                        { backgroundColor: colors.primary },
                    ]}
                />
            )}
            <View style={styles.mainContentWrapper}>
                <View style={styles.topRow}>
                    <View style={styles.iconWrapper}>
                        {isNewFolder ? (
                            <AddIcon
                                width={24}
                                height={24}
                                fill={colors.primary}
                            />
                        ) : (
                            folderIcons[type]
                        )}
                    </View>
                    <View style={styles.detailsColumn}>
                        <View style={styles.titleRow}>
                            <Text
                                style={[styles.title, { color: colors.text }]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {isNewFolder ? "Crear nueva carpeta" : title}
                            </Text>
                            {!isNewFolder && folderId && (
                                <View style={styles.actionButtons}>
                                    {/* Favorite Button --> NOW CLICKABLE <-- */}
                                    <TouchableOpacity // <-- Make the star touchable
                                        onPress={handleButtonPress(
                                            onToggleFavorite,
                                        )} // <-- Call toggle favorite
                                        style={styles.actionButton}
                                        hitSlop={{
                                            top: 10,
                                            bottom: 10,
                                            left: 10,
                                            right: 5,
                                        }}
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
                                    {/* Settings Button */}
                                    <TouchableOpacity
                                        onPress={handleButtonPress(
                                            onShowOptions,
                                        )}
                                        style={styles.actionButton}
                                        hitSlop={{
                                            top: 10,
                                            bottom: 10,
                                            left: 5,
                                            right: 10,
                                        }}
                                    >
                                        <SettingsIcon
                                            width={18}
                                            height={18}
                                            fill={colors.secondaryText}
                                        />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        {!isNewFolder && folderId && folderTags.length > 0 && (
                            <View style={styles.tagsContainer}>
                                <ItemTagsManager
                                    itemId={folderId}
                                    itemType="folder"
                                    tags={folderTags}
                                    allTags={tagContext.tags}
                                    onTagPress={onTagPress}
                                    selectedTagIds={selectedTagIds}
                                    horizontal={true}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

// --- Stylesheet --- (Keep styles same as before)
const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: StyleSheet.hairlineWidth,
        position: "relative",
        paddingHorizontal: 8,
        paddingVertical: 10,
    },
    selectionIndicator: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
    },
    mainContentWrapper: { flex: 1, flexDirection: "column" },
    topRow: { flexDirection: "row", alignItems: "center" },
    iconWrapper: {
        marginRight: 12,
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
    },
    detailsColumn: { flex: 1, flexDirection: "column" },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
        minHeight: 24,
    },
    title: { fontSize: 16, fontWeight: "500", flexShrink: 1, marginRight: 8 },
    actionButtons: { flexDirection: "row", alignItems: "center" },
    actionButton: {
        padding: 4,
        marginLeft: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    tagsContainer: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        marginTop: 4,
    },
})
