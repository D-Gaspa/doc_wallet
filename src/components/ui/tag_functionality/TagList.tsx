// src/components/ui/tag_functionality/TagList.tsx
import React from "react"
import {
    View,
    StyleSheet,
    ScrollView,
    Text,
    TouchableOpacity,
} from "react-native"
import { Tag } from "./Tag"
import { useTheme } from "../../../hooks/useTheme"
import PlusIcon from "../assets/svg/plus.svg"

export interface TagItem {
    id: string
    name: string
    color: string
}

export interface TagListProps {
    tags: TagItem[]
    onTagPress?: (tagId: string) => void
    onTagLongPress?: (tagId: string) => void
    selectedTags?: string[]
    horizontal?: boolean
    maxTags?: number
    testID?: string
    // Props for add tag button
    showAddButton?: boolean
    onAddTagPress?: () => void
}

export function TagList({
    tags,
    onTagPress,
    onTagLongPress,
    selectedTags = [],
    horizontal = true,
    maxTags,
    testID,
    showAddButton = false,
    onAddTagPress,
}: TagListProps) {
    const { colors } = useTheme() // Get theme colors

    // When no tags and no add button, return null
    if (tags.length === 0 && !showAddButton) {
        return null
    }

    // Limit the number of tags if maxTags is provided
    const displayTags = maxTags ? tags.slice(0, maxTags) : tags

    // Add indicator for additional tags
    const hasMoreTags = maxTags && tags.length > maxTags
    const moreTags = tags.length - (maxTags || 0)

    // Handle tag press
    const handleTagPress = (tagId: string) => {
        if (onTagPress) {
            onTagPress(tagId)
        }
    }

    // Handle tag long press - ensure not to trigger onTagPress
    const handleTagLongPress = (tagId: string) => {
        if (onTagLongPress) {
            onTagLongPress(tagId)
        }
    }

    return (
        <ScrollView
            horizontal={horizontal}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
                styles.container,
                !horizontal && styles.verticalContainer,
            ]}
            testID={testID ?? "tag-list"}
        >
            {displayTags.map((tag) => (
                <Tag
                    key={tag.id}
                    id={tag.id}
                    name={tag.name}
                    color={tag.color}
                    selected={selectedTags.includes(tag.id)}
                    onPress={() => handleTagPress(tag.id)}
                    onLongPress={() => handleTagLongPress(tag.id)}
                />
            ))}

            {hasMoreTags && (
                <View style={styles.moreTagsIndicator}>
                    <Text style={styles.moreTagsText}>+{moreTags}</Text>
                </View>
            )}

            {/* Add Tag Button styled as a tag */}
            {showAddButton && onAddTagPress && (
                <TouchableOpacity
                    style={[
                        styles.addTagButton,
                        {
                            backgroundColor: colors.primary + "20",
                            borderColor: colors.primary,
                        },
                    ]}
                    onPress={onAddTagPress}
                    testID="add-tag-button"
                >
                    <PlusIcon width={12} height={12} fill={colors.primary} />
                    <Text
                        style={[styles.addTagText, { color: colors.primary }]}
                    >
                        Add Tag
                    </Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        flexWrap: "wrap",
        padding: 4,
    },
    verticalContainer: {
        flexDirection: "column",
    },
    moreTagsIndicator: {
        alignItems: "center",
        justifyContent: "center",
        padding: 4,
    },
    moreTagsText: {
        fontSize: 12,
        opacity: 0.7,
    },
    addTagButton: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 6,
        margin: 4,
        borderWidth: 1,
    },
    addTagText: {
        fontSize: 12,
        marginLeft: 3,
        fontWeight: "500",
    },
})
