import React, { useState } from "react"
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    GestureResponderEvent,
} from "react-native"
import { Tag, TagProps } from "./Tag"
import { useTheme } from "../../../hooks/useTheme"
import PlusIcon from "../assets/svg/plus.svg"
import ChevronUpIcon from "../assets/svg/chevronup.svg"

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
    testID?: string
    showAddTagButton?: boolean
    onAddTagPress?: () => void
    initiallyExpanded?: boolean
    size?: TagProps["size"]
}

export function TagList({
    tags,
    onTagPress,
    onTagLongPress,
    selectedTags = [],
    horizontal = true,
    testID,
    showAddTagButton = false,
    onAddTagPress,
    initiallyExpanded = false,
    size = "small",
}: TagListProps) {
    const { colors } = useTheme()
    const [isExpanded, setIsExpanded] = useState(initiallyExpanded)

    const PREVIEW_COUNT = 3
    const previewTags = tags.slice(0, PREVIEW_COUNT)
    const remainingTagsCount = tags.length - PREVIEW_COUNT
    const showMoreIndicator = remainingTagsCount > 0
    const canShowAddButton = showAddTagButton && onAddTagPress

    if (tags.length === 0 && !canShowAddButton) return null

    /* Handlers */
    const handleTagPress = (tagId: string) => onTagPress?.(tagId)
    const handleTagLongPress = (tagId: string) => onTagLongPress?.(tagId)

    const expandTags = () => {
        if (previewTags.length > 0 || showMoreIndicator || canShowAddButton) {
            setIsExpanded(true)
        }
    }

    const collapseTags = (e?: GestureResponderEvent) => {
        e?.stopPropagation()
        setIsExpanded(false)
    }

    /* Render */
    return (
        <View style={styles.outerContainer}>
            {isExpanded ? (
                <ScrollView
                    horizontal={horizontal}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    style={[
                        styles.scrollContainer,
                        !horizontal && styles.verticalScroll,
                    ]}
                    contentContainerStyle={[
                        styles.container,
                        horizontal
                            ? styles.horizontalContainer
                            : styles.verticalContainer,
                    ]}
                    testID={testID ?? "tag-list-expanded"}
                >
                    <TouchableOpacity
                        style={styles.collapseButton}
                        onPress={collapseTags}
                        testID="collapse-tags-button"
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    >
                        <ChevronUpIcon
                            width={14}
                            height={14}
                            stroke={colors.secondaryText}
                        />
                    </TouchableOpacity>

                    {tags.map((tag) => (
                        <Tag
                            key={tag.id}
                            id={tag.id}
                            name={tag.name}
                            color={tag.color}
                            selected={selectedTags.includes(tag.id)}
                            onPress={() => handleTagPress(tag.id)}
                            onLongPress={() => handleTagLongPress(tag.id)}
                            size={size}
                        />
                    ))}

                    {canShowAddButton && (
                        <TouchableOpacity
                            style={[
                                styles.addTagButtonSmall,
                                {
                                    backgroundColor: colors.primary + "20",
                                    borderColor: colors.primary,
                                },
                            ]}
                            onPress={onAddTagPress}
                            testID="add-tag-button-expanded"
                            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                        >
                            <PlusIcon
                                width={10}
                                height={10}
                                fill={colors.primary}
                            />
                        </TouchableOpacity>
                    )}
                </ScrollView>
            ) : (
                <TouchableOpacity
                    style={[
                        styles.container,
                        styles.collapsedContainer,
                        !horizontal && styles.verticalContainer,
                    ]}
                    onPress={expandTags}
                    disabled={
                        !(
                            previewTags.length > 0 ||
                            showMoreIndicator ||
                            canShowAddButton
                        )
                    }
                    testID={testID ?? "tag-list-collapsed"}
                    activeOpacity={0.7}
                >
                    {previewTags.map((tag) => (
                        <View
                            key={tag.id}
                            style={[
                                styles.collapsedDot,
                                { backgroundColor: tag.color },
                                selectedTags.includes(tag.id) &&
                                    styles.collapsedDotSelected,
                            ]}
                        />
                    ))}
                    {showMoreIndicator && (
                        <View style={styles.moreTagsIndicator}>
                            <Text
                                style={[
                                    styles.moreTagsText,
                                    { color: colors.secondaryText },
                                ]}
                            >
                                +{remainingTagsCount}
                            </Text>
                        </View>
                    )}
                    {canShowAddButton && (
                        <TouchableOpacity
                            style={[
                                styles.addTagButtonSmall,
                                {
                                    backgroundColor: colors.primary + "20",
                                    borderColor: colors.primary,
                                },
                            ]}
                            onPress={onAddTagPress}
                            testID="add-tag-button-collapsed"
                            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                        >
                            <PlusIcon
                                width={10}
                                height={10}
                                fill={colors.primary}
                            />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    outerContainer: {
        minHeight: 28,
        justifyContent: "center",
    },
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 2,
    },
    horizontalContainer: {
        flexWrap: "nowrap",
    },
    verticalContainer: {
        flexDirection: "column",
        alignItems: "flex-start",
        flexWrap: "wrap",
    },
    scrollContainer: {
        maxHeight: 120,
    },
    verticalScroll: {
        maxHeight: undefined,
    },
    collapsedContainer: {
        flexWrap: "nowrap",
        overflow: "hidden",
        paddingLeft: 2,
    },
    collapsedDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 2.5,
        marginVertical: 2,
    },
    collapsedDotSelected: {
        borderWidth: 1.5,
        opacity: 0.8,
    },
    moreTagsIndicator: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        marginHorizontal: 2,
        marginVertical: 2,
        height: 22,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
    },
    moreTagsText: {
        fontSize: 10,
        fontWeight: "500",
    },
    addTagButtonSmall: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 3,
        height: 22,
        marginHorizontal: 2,
        marginVertical: 2,
        borderWidth: 1,
    },
    collapseButton: {
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
        marginRight: 4,
        height: 22,
    },
})
