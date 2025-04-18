import React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { ItemTagsManager } from "../tag_functionality/ItemTagsManager.tsx"
import { useTagContext } from "../tag_functionality/TagContext.tsx"
import TravelIcon from "../assets/svg/airplane.svg"
import MedicalIcon from "../assets/svg/medical.svg"
import CarIcon from "../assets/svg/car.svg"
import EducationIcon from "../assets/svg/book.svg"
import AddIcon from "../assets/svg/plus.svg"

export interface FolderCardProps {
    title: string
    type?: "travel" | "medical" | "car" | "education" | "custom"
    onPress: () => void
    onLongPress?: () => void
    customIcon?: React.ReactNode
    isNewFolder?: boolean
    selected?: boolean
    folderId?: string
    onTagPress?: (tagId: string) => void
    selectedTagIds?: string[]
    testID?: string
    showAddTagButton?: boolean
    handleMoveFolders?: (folderIds: string[], targetId: string) => void
}

export function FolderCard({
    title,
    type = "custom",
    onPress,
    onLongPress,
    customIcon,
    isNewFolder = false,
    selected = false,
    folderId,
    onTagPress,
    selectedTagIds = [],
    testID,
    showAddTagButton = true,
}: FolderCardProps) {
    const { colors } = useTheme()
    const tagContext = useTagContext()

    // Map predefined folder types to their respective SVG icons
    const folderIcons = {
        travel: <TravelIcon width={24} height={24} fill={"#E74C3C"} />,
        medical: <MedicalIcon width={24} height={24} fill={"#3498DB"} />,
        car: <CarIcon width={24} height={24} fill={"#9B59B6"} />,
        education: <EducationIcon width={24} height={24} fill={"#2ECC71"} />,
        custom: customIcon ?? (
            <EducationIcon width={24} height={24} fill={colors.primary} />
        ),
    }

    // Get folder tags if folder has an ID
    const folderTags = folderId
        ? tagContext.getTagsForItem(folderId, "folder")
        : []

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { borderBottomColor: colors.secondaryText },
                selected && { backgroundColor: colors.background },
            ]}
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={500}
            testID={testID}
            activeOpacity={0.7}
        >
            {/* Selection indicator */}
            {selected && (
                <View
                    style={[
                        styles.selectionIndicator,
                        { backgroundColor: colors.primary },
                    ]}
                />
            )}

            <View style={styles.contentContainer}>
                <View style={styles.iconWrapper}>
                    {isNewFolder ? (
                        <AddIcon width={24} height={24} fill={colors.primary} />
                    ) : (
                        folderIcons[type]
                    )}
                </View>
                <Text
                    style={[styles.title, { color: colors.text }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {isNewFolder ? "Create a new folder" : title}
                </Text>
            </View>

            {/* Tags container with tagging functionality */}
            {!isNewFolder && folderId && (
                <View style={styles.tagsContainer}>
                    <ItemTagsManager
                        itemId={folderId}
                        itemType="folder"
                        tags={folderTags}
                        allTags={tagContext.tags}
                        onTagPress={onTagPress}
                        selectedTagIds={selectedTagIds}
                        maxTags={3}
                        horizontal={true}
                        showAddTagButton={showAddTagButton}
                    />
                </View>
            )}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        position: "relative",
        height: 60,
    },
    selectionIndicator: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    contentContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 0.8,
        minWidth: 140,
    },
    iconWrapper: {
        marginRight: 12,
        width: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 16,
        fontWeight: "500",
        flex: 1,
    },
    tagsContainer: {
        flex: 0.4,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        minWidth: 120,
    },
})
