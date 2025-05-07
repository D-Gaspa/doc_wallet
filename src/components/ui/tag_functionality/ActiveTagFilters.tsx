import React from "react"
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import { Row } from "../layout"
import { useTheme } from "../../../hooks/useTheme"
import { Tag, useTagContext } from "./TagContext"

interface ActiveTagFiltersProps {
    selectedTagFilters: string[]
    onRemoveFilter: (tagId: string) => void
    onClearFilters: () => void
    testID?: string
}

export function ActiveTagFilters({
    selectedTagFilters,
    onRemoveFilter,
    onClearFilters,
    testID,
}: ActiveTagFiltersProps) {
    const { colors } = useTheme()
    const tagContext = useTagContext()

    if (selectedTagFilters.length === 0) return null

    // Get tags for display
    const filterTags = selectedTagFilters
        .map((tagId) => tagContext.tags.find((tag) => tag.id === tagId))
        .filter((tag): tag is Tag => tag !== undefined)

    return (
        <View style={styles.container} testID={testID ?? "active-tag-filters"}>
            <Row align="center" spacing={5} style={styles.rowContainer}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>
                    Filtrado por
                </Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tagsScrollContainer}
                >
                    {filterTags.map((tag) => (
                        <View
                            key={tag.id}
                            style={[
                                styles.tagItem,
                                {
                                    backgroundColor: tag.color + "20",
                                    borderColor: tag.color,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.tagDot,
                                    { backgroundColor: tag.color },
                                ]}
                            />
                            <Text
                                style={[styles.tagText, { color: colors.text }]}
                            >
                                {tag.name}
                            </Text>
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => onRemoveFilter(tag.id)}
                                hitSlop={{
                                    top: 10,
                                    right: 10,
                                    bottom: 10,
                                    left: 10,
                                }}
                            >
                                <Text style={{ color: colors.text }}>×</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                {selectedTagFilters.length > 0 && (
                    <TouchableOpacity
                        onPress={onClearFilters}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        style={styles.clearButton}
                    >
                        <Text
                            style={[
                                styles.clearText,
                                { color: colors.primary },
                            ]}
                        >
                            Clear
                        </Text>
                    </TouchableOpacity>
                )}
            </Row>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
        marginTop: 4,
        paddingHorizontal: 2,
        borderRadius: 8,
    },
    rowContainer: {
        flexWrap: "nowrap",
    },
    label: {
        fontSize: 12,
        fontWeight: "500",
    },
    tagsScrollContainer: {
        flexDirection: "row",
        flexGrow: 1,
        flexShrink: 1,
        paddingRight: 4,
    },
    tagItem: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        paddingHorizontal: 6,
        borderWidth: 1,
        marginRight: 4,
        height: 30,
    },
    tagDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 3,
    },
    tagText: {
        fontSize: 12,
        fontWeight: "400",
    },
    removeButton: {
        marginLeft: 3,
        width: 20,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    clearButton: {
        marginLeft: 2,
    },
    clearText: {
        fontSize: 12,
        fontWeight: "500",
    },
})
