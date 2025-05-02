// src/components/ui/tag_functionality/TagList.tsx
import React, { useState } from "react";
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    GestureResponderEvent,
} from "react-native";
import { Tag, TagProps } from "./Tag";
import { useTheme } from "../../../hooks/useTheme";
import PlusIcon from "../assets/svg/plus.svg";
import ChevronUpIcon from "../assets/svg/chevronup.svg";

export interface TagItem {
    id: string;
    name: string;
    color: string;
}

export interface TagListProps {
    tags: TagItem[];
    onTagPress?: (tagId: string) => void;
    onTagLongPress?: (tagId: string) => void;
    selectedTags?: string[];
    horizontal?: boolean;
    testID?: string;
    showAddTagButton?: boolean;
    onAddTagPress?: () => void;
    initiallyExpanded?: boolean;
    size?: TagProps['size'];
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
    const { colors } = useTheme();
    const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

    const MAX_EXPANDED_TAGS_TO_SHOW = 3;

    const tagsToShowExpanded = tags.slice(0, MAX_EXPANDED_TAGS_TO_SHOW);
    const remainingTagsCount = tags.length - MAX_EXPANDED_TAGS_TO_SHOW;
    const showMoreIndicator = remainingTagsCount > 0;
    const canShowAddButton = showAddTagButton && onAddTagPress;

    if (tags.length === 0 && !canShowAddButton) {
        return null;
    }

    const handleTagPress = (tagId: string) => {
        if (onTagPress) onTagPress(tagId);
    };

    const handleTagLongPress = (tagId: string) => {
        if (onTagLongPress) onTagLongPress(tagId);
    };

    const handleToggleExpand = () => {
        if (tags.length > 0 || canShowAddButton) {
            if (tagsToShowExpanded.length > 0 || showMoreIndicator || canShowAddButton){
                setIsExpanded(true);
            }
        }
    };

    const collapseTags = (event?: GestureResponderEvent) => {
        event?.stopPropagation();
        setIsExpanded(false);
    }

    return (
        <View style={styles.outerContainer}>
            {isExpanded ? (
                // --- Expanded State ---
                // Using View, but ScrollView might be better if many tags + buttons can overflow horizontally
                <View // Changed back to View assuming wrapping or limited items fit
                    style={[
                        styles.container,
                        styles.expandedContainer, // Generic expanded style
                        horizontal && styles.horizontalContainer, // Specific horizontal layout
                        !horizontal && styles.verticalContainer,
                    ]}
                    testID={testID ?? "tag-list-expanded"}
                >
                    {/* Collapse Button --> Moved to the beginning <-- */}
                    <TouchableOpacity
                        style={styles.collapseButton} // Style updated below
                        onPress={collapseTags}
                        testID="collapse-tags-button"
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    >
                        <ChevronUpIcon width={14} height={14} stroke={colors.secondaryText} />
                    </TouchableOpacity>

                    {/* Display first 3 tags */}
                    {tagsToShowExpanded.map((tag) => (
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

                    {/* "+X more" Indicator */}
                    {showMoreIndicator && (
                        <View style={styles.moreTagsIndicator}>
                            <Text style={[styles.moreTagsText, { color: colors.secondaryText }]}>
                                +{remainingTagsCount}
                            </Text>
                        </View>
                    )}

                    {/* Add Tag Button (Inline) */}
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
                            <PlusIcon width={10} height={10} fill={colors.primary} />
                        </TouchableOpacity>
                    )}

                </View> // End Expanded View
            ) : (
                // --- Collapsed State (Preview) ---
                <TouchableOpacity
                    style={[
                        styles.container,
                        styles.collapsedContainer,
                        !horizontal && styles.verticalContainer,
                    ]}
                    onPress={handleToggleExpand}
                    disabled={!(tagsToShowExpanded.length > 0 || showMoreIndicator || canShowAddButton)}
                    testID={testID ?? "tag-list-collapsed"}
                    activeOpacity={0.7}
                >
                    {tags.map((tag) => (
                        <View
                            key={tag.id}
                            style={[
                                styles.collapsedDot,
                                { backgroundColor: tag.color },
                                selectedTags.includes(tag.id) && styles.collapsedDotSelected,
                            ]}
                        />
                    ))}
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        minHeight: 28,
        justifyContent: 'center',
    },
    container: {
        flexDirection: "row",
        alignItems: 'center',
        paddingVertical: 2,
        position: 'relative', // Keep relative for potential absolute children if needed later
    },
    horizontalContainer: { // Used when horizontal=true
        flexWrap: 'nowrap', // Prevent wrapping in horizontal view
    },
    expandedContainer: { // Common style for expanded view (wrapping if vertical)
        flexWrap: 'wrap',
    },
    collapsedContainer: {
        flexWrap: 'nowrap',
        overflow: 'hidden',
        paddingLeft: 2,
    },
    verticalContainer: { // Style if horizontal={false}
        flexDirection: "column",
        alignItems: 'flex-start',
        flexWrap: 'wrap',
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
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    moreTagsText: {
        fontSize: 10,
        fontWeight: '500',
    },
    addTagButtonSmall: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'center',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 3,
        height: 22,
        marginHorizontal: 2,
        marginVertical: 2,
        borderWidth: 1,
    },
    collapseButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4, // Touch area padding
        marginRight: 4, // Add margin to space it from the first tag
        height: 22, // Match small tag height for vertical alignment
    }
});
