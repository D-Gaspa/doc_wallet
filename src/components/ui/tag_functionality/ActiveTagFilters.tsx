import React from "react"
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
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
                    Filtrado por:
                </Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tagsScrollContainer}
                    style={styles.scrollViewFlex}
                >
                    {filterTags.map((tag) => (
                        <View
                            key={tag.id}
                            style={[
                                styles.tagItem,
                                {
                                    backgroundColor: tag.color + "25",
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
                                style={[styles.tagText, { color: tag.color }]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {tag.name}
                            </Text>
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => onRemoveFilter(tag.id)}
                                hitSlop={{
                                    top: 8,
                                    right: 8,
                                    bottom: 8,
                                    left: 8,
                                }}
                                accessibilityLabel={`Quitar filtro ${tag.name}`}
                            >
                                <FontAwesome6
                                    name="xmark"
                                    size={10}
                                    color={tag.color}
                                    iconStyle="solid"
                                />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                {selectedTagFilters.length > 0 && (
                    <TouchableOpacity
                        onPress={onClearFilters}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        style={styles.clearButton}
                        accessibilityLabel="Limpiar todos los filtros"
                    >
                        <Text
                            style={[
                                styles.clearText,
                                { color: colors.primary },
                            ]}
                        >
                            Limpiar
                        </Text>
                    </TouchableOpacity>
                )}
            </Row>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        paddingHorizontal: 0,
    },
    rowContainer: {
        flexWrap: "nowrap",
        alignItems: "center",
    },
    label: {
        fontSize: 12,
        fontWeight: "500",
        marginRight: 3,
    },
    scrollViewFlex: {
        flexShrink: 1,
    },
    tagsScrollContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 5,
    },
    tagItem: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 14,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderWidth: 1.5,
        marginRight: 6,
        height: 28,
    },
    tagDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginRight: 5,
    },
    tagText: {
        fontSize: 12,
        fontWeight: "500",
        maxWidth: 100,
    },
    removeButton: {
        marginLeft: 5,
        padding: 3,
        justifyContent: "center",
        alignItems: "center",
    },
    clearButton: {
        marginLeft: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    clearText: {
        fontSize: 12,
        fontWeight: "600",
    },
})
