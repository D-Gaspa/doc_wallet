import React, { useState, useRef, useEffect } from "react"
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    FlatList,
    Modal,
    TouchableWithoutFeedback,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { useTagContext } from "./TagContext"
import { Checkbox } from "../form"
import FilterIcon from "../assets/svg/filter.svg"

export interface TagFilterDropdownProps {
    selectedTagIds: string[]
    onSelectTags: (tagIds: string[]) => void
    itemName?: string // Optional item name for tag suggestions
    itemType?: "folder" | "document" // Optional item type for tag suggestions
    testID?: string
}

export function TagFilterDropdown({
    selectedTagIds = [],
    onSelectTags,
    itemName = "",
    itemType = "folder",
    testID,
}: TagFilterDropdownProps) {
    const { colors } = useTheme()
    const { tags, getSuggestedTags } = useTagContext()

    // Dropdown state
    const [isOpen, setIsOpen] = useState(false)
    const buttonRef = useRef<View>(null)
    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        right: 0,
    })
    const [tempSelectedTags, setTempSelectedTags] = useState<string[]>([
        ...selectedTagIds,
    ])

    // Get tag suggestions if itemName and itemType are provided
    const suggestedTags =
        itemName && itemType
            ? getSuggestedTags(itemType, itemName).filter(
                  (tag) => !selectedTagIds.includes(tag.id),
              ) // Don't suggest already selected tags
            : []

    const toggleDropdown = () => {
        if (buttonRef.current) {
            buttonRef.current.measureInWindow((x, y, width, height) => {
                setDropdownPosition({
                    top: y + height + 5,
                    right: 20,
                })
                setIsOpen(!isOpen)
            })
        }
    }

    const handleTagToggle = (tagId: string) => {
        setTempSelectedTags((prev) => {
            if (prev.includes(tagId)) {
                return prev.filter((id) => id !== tagId)
            } else {
                return [...prev, tagId]
            }
        })
    }

    const applyFilters = () => {
        onSelectTags(tempSelectedTags)
        setIsOpen(false)
    }

    const resetFilters = () => {
        setTempSelectedTags([])
        onSelectTags([])
        setIsOpen(false)
    }

    // Reset local selection when selected tags change externally
    useEffect(() => {
        setTempSelectedTags([...selectedTagIds])
    }, [selectedTagIds])

    // Group tags for better organization
    const groupedTags = [
        // First show the suggested tags section if there are suggestions
        ...(suggestedTags.length > 0
            ? [
                  {
                      title: "Suggested Tags",
                      data: suggestedTags,
                  },
              ]
            : []),
        // Then show all available tags
        {
            title: "All Tags",
            data: tags,
        },
    ]

    return (
        <View ref={buttonRef} testID={testID ?? "tag-filter-dropdown"}>
            {/* Filter Button */}
            <TouchableOpacity
                style={styles.filterButton}
                onPress={toggleDropdown}
            >
                <FilterIcon width={24} height={24} stroke={colors.primary} />
                {selectedTagIds.length > 0 && (
                    <View
                        style={[
                            styles.filterBadge,
                            { backgroundColor: colors.primary },
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterBadgeText,
                                { color: colors.background },
                            ]}
                        >
                            {selectedTagIds.length}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Dropdown Menu Modal */}
            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View
                                style={[
                                    styles.dropdown,
                                    {
                                        top: dropdownPosition.top,
                                        right: dropdownPosition.right,
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.dropdownTitle,
                                        { color: colors.text },
                                    ]}
                                >
                                    Filter by Tags
                                </Text>

                                {tags.length > 0 ? (
                                    <FlatList
                                        data={groupedTags}
                                        keyExtractor={(item, index) =>
                                            `group-${index}`
                                        }
                                        renderItem={({ item: group }) => (
                                            <View style={styles.tagGroup}>
                                                <Text
                                                    style={[
                                                        styles.groupTitle,
                                                        {
                                                            color: colors.secondaryText,
                                                        },
                                                    ]}
                                                >
                                                    {group.title}
                                                </Text>
                                                {group.data.map((tag) => (
                                                    <TouchableOpacity
                                                        key={tag.id}
                                                        style={styles.tagItem}
                                                        onPress={() =>
                                                            handleTagToggle(
                                                                tag.id,
                                                            )
                                                        }
                                                    >
                                                        <Checkbox
                                                            checked={tempSelectedTags.includes(
                                                                tag.id,
                                                            )}
                                                            onToggle={() =>
                                                                handleTagToggle(
                                                                    tag.id,
                                                                )
                                                            }
                                                        />
                                                        <View
                                                            style={[
                                                                styles.tagColor,
                                                                {
                                                                    backgroundColor:
                                                                        tag.color,
                                                                },
                                                            ]}
                                                        />
                                                        <Text
                                                            style={{
                                                                color: colors.text,
                                                            }}
                                                        >
                                                            {tag.name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                        style={styles.tagsList}
                                    />
                                ) : (
                                    <Text
                                        style={[
                                            styles.emptyText,
                                            { color: colors.secondaryText },
                                        ]}
                                    >
                                        No tags available
                                    </Text>
                                )}

                                {/* Action buttons */}
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.actionButton,
                                            { borderColor: colors.border },
                                        ]}
                                        onPress={resetFilters}
                                    >
                                        <Text style={{ color: colors.error }}>
                                            Reset
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.actionButton,
                                            { backgroundColor: colors.primary },
                                        ]}
                                        onPress={applyFilters}
                                    >
                                        <Text
                                            style={{ color: colors.background }}
                                        >
                                            Apply
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    filterButton: {
        padding: 8,
        position: "relative",
    },
    filterBadge: {
        position: "absolute",
        top: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    filterBadgeText: {
        fontSize: 10,
        fontWeight: "bold",
    },
    overlay: {
        flex: 1,
    },
    dropdown: {
        position: "absolute",
        width: 250,
        maxHeight: 500,
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dropdownTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 12,
        textAlign: "center",
    },
    tagsList: {
        maxHeight: 350,
    },
    tagGroup: {
        marginBottom: 12,
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    tagItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },
    tagColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginLeft: 8,
        marginRight: 8,
    },
    emptyText: {
        textAlign: "center",
        padding: 12,
        fontStyle: "italic",
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 4,
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 4,
        borderWidth: 1,
        minWidth: 80,
        alignItems: "center",
    },
})
