import React, { useState } from "react"
import {
    GestureResponderEvent,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { Tag, TagProps } from "./Tag"
import { useTheme } from "../../../hooks/useTheme"

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

const getCollapsedDotSelectedStyle = (color: string): ViewStyle => ({
    borderColor: color,
})

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

    const PREVIEW_DOT_COUNT = 3
    const PREVIEW_TAG_COUNT_VERTICAL = 3

    const canShowAddButton = showAddTagButton && onAddTagPress

    if (tags.length === 0 && !canShowAddButton) {
        return null
    }

    const handleTagPress = (tagId: string) => onTagPress?.(tagId)
    const handleTagLongPress = (tagId: string) => onTagLongPress?.(tagId)

    const toggleExpansion = (e?: GestureResponderEvent) => {
        e?.stopPropagation()
        setIsExpanded((prev) => !prev)
    }

    const renderSmallAddButton = () => (
        <TouchableOpacity
            style={[
                styles.addTagButtonSmall,
                {
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.primary,
                },
            ]}
            onPress={onAddTagPress}
            testID="add-tag-button-small"
            accessibilityLabel="Añadir etiqueta"
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
            <FontAwesome6
                name="plus"
                size={10}
                color={colors.primary}
                iconStyle="solid"
            />
        </TouchableOpacity>
    )

    if (isExpanded) {
        return (
            <View
                style={
                    horizontal
                        ? styles.expandedHorizontalContainer
                        : styles.expandedVerticalContainer
                }
            >
                <ScrollView
                    horizontal={horizontal}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={
                        horizontal
                            ? styles.scrollContentHorizontal
                            : styles.scrollContentVertical
                    }
                    testID={testID ?? "tag-list-expanded"}
                >
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
                                styles.addTagButtonExpanded,
                                { borderColor: colors.primary },
                            ]}
                            onPress={onAddTagPress}
                            testID="add-tag-button-expanded"
                            accessibilityLabel="Añadir etiqueta"
                        >
                            <FontAwesome6
                                name="plus"
                                size={10}
                                color={colors.primary}
                                iconStyle="solid"
                            />
                            <Text
                                style={[
                                    styles.addTagButtonText,
                                    { color: colors.primary },
                                ]}
                            >
                                Añadir
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
                {/* Collapse Button - shown only when expanded */}
                <TouchableOpacity
                    style={styles.commonChevronButton}
                    onPress={toggleExpansion}
                    testID="collapse-tags-button"
                    accessibilityLabel="Mostrar menos etiquetas"
                >
                    <FontAwesome6
                        name="chevron-up"
                        size={14}
                        color={colors.secondaryText}
                        iconStyle="solid"
                    />
                </TouchableOpacity>
            </View>
        )
    }

    const itemsToShowCollapsed = horizontal
        ? PREVIEW_DOT_COUNT
        : PREVIEW_TAG_COUNT_VERTICAL
    const displayedCollapsedTags = tags.slice(0, itemsToShowCollapsed)
    const remainingCount = tags.length - displayedCollapsedTags.length
    const showMoreCollapsedIndicator = remainingCount > 0

    return (
        <TouchableOpacity
            style={styles.collapsedOuterContainer}
            onPress={toggleExpansion}
            disabled={tags.length === 0 && !canShowAddButton}
            testID={testID ?? "tag-list-collapsed"}
            activeOpacity={0.7}
            accessibilityLabel="Mostrar más etiquetas"
        >
            <View style={styles.collapsedInnerContainer}>
                {displayedCollapsedTags.map((tag) =>
                    horizontal ? (
                        <View
                            key={tag.id}
                            style={[
                                styles.collapsedDot,
                                { backgroundColor: tag.color },
                                selectedTags.includes(tag.id) &&
                                    getCollapsedDotSelectedStyle(
                                        colors.primary,
                                    ),
                            ]}
                        />
                    ) : (
                        <Tag
                            key={tag.id}
                            id={tag.id}
                            name={tag.name}
                            color={tag.color}
                            selected={selectedTags.includes(tag.id)}
                            onPress={() => {
                                handleTagPress(tag.id)
                            }}
                            onLongPress={() => {
                                handleTagLongPress(tag.id)
                            }}
                            size="small"
                        />
                    ),
                )}
                {showMoreCollapsedIndicator && (
                    <View style={styles.moreTagsIndicator}>
                        <Text
                            style={[
                                styles.moreTagsText,
                                { color: colors.secondaryText },
                            ]}
                        >
                            +{remainingCount}
                        </Text>
                    </View>
                )}
                {canShowAddButton && renderSmallAddButton()}
            </View>
            {/* Expand Chevron - shown only when collapsed and there's something to expand */}
            {(tags.length > itemsToShowCollapsed ||
                (tags.length > 0 &&
                    !isExpanded &&
                    canShowAddButton &&
                    !showMoreCollapsedIndicator &&
                    displayedCollapsedTags.length === tags.length)) && (
                <TouchableOpacity
                    style={styles.commonChevronButton}
                    onPress={toggleExpansion}
                    accessibilityLabel="Mostrar más etiquetas"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <FontAwesome6
                        name="chevron-down"
                        size={14}
                        color={colors.secondaryText}
                        iconStyle="solid"
                    />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    expandedHorizontalContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
    },
    expandedVerticalContainer: {
        flexDirection: "column",
        alignItems: "flex-start",
        width: "100%",
    },
    scrollContentHorizontal: {
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 5,
    },
    scrollContentVertical: {
        flexDirection: "column",
        alignItems: "flex-start",
        paddingBottom: 5,
    },
    collapsedOuterContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        paddingVertical: 2,
    },
    collapsedInnerContainer: {
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 1,
        overflow: "hidden",
    },
    // eslint-disable-next-line react-native/no-color-literals
    collapsedDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 2,
        marginVertical: 4,
        borderWidth: 0.5,
        borderColor: "transparent",
    },
    moreTagsIndicator: {
        paddingHorizontal: 5,
        justifyContent: "center",
        alignItems: "center",
        height: 20,
        marginHorizontal: 1,
    },
    moreTagsText: {
        fontSize: 10,
        fontWeight: "500",
    },
    addTagButtonExpanded: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 14,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginHorizontal: 4,
        marginVertical: 2,
        borderWidth: 1,
    },
    addTagButtonText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: "500",
    },
    addTagButtonSmall: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 2.5,
        height: 20,
        marginHorizontal: 2,
        borderWidth: 1,
    },
    commonChevronButton: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        marginLeft: 4,
        alignItems: "center",
        justifyContent: "center",
    },
})
