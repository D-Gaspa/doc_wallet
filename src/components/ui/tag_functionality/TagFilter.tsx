import React, { useEffect, useRef, useState } from "react"
import {
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../hooks/useTheme"
import { Tag, useTagContext } from "./TagContext"
import { Checkbox } from "../form"

export interface TagFilterDropdownProps {
    selectedTagIds: string[]
    onSelectTags: (tagIds: string[]) => void
    itemName?: string
    itemType?: "folder" | "document"
    testID?: string
}

const screenWidth = Dimensions.get("window").width

export function TagFilterDropdown({
    selectedTagIds = [],
    onSelectTags,
    itemName = "",
    itemType = "folder",
    testID,
}: TagFilterDropdownProps) {
    const { colors } = useTheme()
    const { tags, getSuggestedTags } = useTagContext()

    const [isOpen, setIsOpen] = useState(false)
    const buttonRef = useRef<View>(null)
    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        right: 0,
        width: 250,
    })
    const [tempSelectedTags, setTempSelectedTags] = useState<string[]>([
        ...selectedTagIds,
    ])

    const suggestedTags: Tag[] =
        itemName && itemType
            ? getSuggestedTags(itemType, itemName).filter(
                  (tag) => !tempSelectedTags.includes(tag.id),
              )
            : []

    const toggleDropdown = () => {
        if (isOpen) {
            setIsOpen(false)
        } else {
            buttonRef.current?.measureInWindow((x, y, width, height) => {
                const calculatedRight = screenWidth - (x + width)
                setDropdownPosition({
                    top: y + height + 5,
                    right: calculatedRight < 20 ? 20 : calculatedRight,
                    width: 280,
                })
                setTempSelectedTags([...selectedTagIds])
                setIsOpen(true)
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
    }

    useEffect(() => {
        if (!isOpen) {
            setTempSelectedTags([...selectedTagIds])
        }
    }, [selectedTagIds, isOpen])

    const allNonSuggestedTags = tags.filter(
        (tag) => !suggestedTags.find((st) => st.id === tag.id),
    )

    const groupedTags = [
        ...(suggestedTags.length > 0
            ? [{ title: "Etiquetas Sugeridas", data: suggestedTags }]
            : []),
        { title: "Todas las Etiquetas", data: allNonSuggestedTags },
    ]

    return (
        <View testID={testID ?? "tag-filter-dropdown"}>
            <TouchableOpacity
                ref={buttonRef}
                style={styles.filterButton}
                onPress={toggleDropdown}
                accessibilityLabel="Abrir filtro de etiquetas"
                accessibilityHint="Filtra elementos por etiquetas"
            >
                <FontAwesome6
                    name="filter"
                    size={22}
                    color={
                        selectedTagIds.length > 0
                            ? colors.primary
                            : colors.secondaryText
                    }
                    iconStyle="solid"
                />
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
                                { color: colors.tabbarIcon_active },
                            ]}
                        >
                            {selectedTagIds.length}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

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
                                        width: dropdownPosition.width,
                                        backgroundColor: colors.card, // Use card color for dropdown
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
                                    Filtrar por Etiquetas {/* Translated */}
                                </Text>

                                {tags.length > 0 ? (
                                    <FlatList
                                        data={groupedTags}
                                        keyExtractor={(item, index) =>
                                            `group-${item.title}-${index}`
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
                                                        accessibilityLabel={`Etiqueta ${
                                                            tag.name
                                                        }, ${
                                                            tempSelectedTags.includes(
                                                                tag.id,
                                                            )
                                                                ? "seleccionada"
                                                                : "no seleccionada"
                                                        }`}
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
                                                            style={[
                                                                styles.tagName,
                                                                {
                                                                    color: colors.text,
                                                                },
                                                            ]}
                                                        >
                                                            {tag.name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                        style={styles.tagsList}
                                        showsVerticalScrollIndicator={false}
                                    />
                                ) : (
                                    <Text
                                        style={[
                                            styles.emptyText,
                                            { color: colors.secondaryText },
                                        ]}
                                    >
                                        No hay etiquetas disponibles{" "}
                                        {/* Translated */}
                                    </Text>
                                )}

                                <View
                                    style={[
                                        styles.actionButtons,
                                        { borderTopColor: colors.border },
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.actionButton,
                                            { borderColor: colors.border },
                                        ]}
                                        onPress={resetFilters}
                                    >
                                        <Text style={{ color: colors.error }}>
                                            Limpiar
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
                                            style={{
                                                color: colors.tabbarIcon_active,
                                            }}
                                        >
                                            Aplicar
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
        flexDirection: "row",
        alignItems: "center",
    },
    filterBadge: {
        position: "absolute",
        top: 0,
        right: 0,
        width: 18,
        height: 18,
        borderRadius: 9,
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
    // eslint-disable-next-line react-native/no-color-literals
    dropdown: {
        position: "absolute",
        maxHeight: Dimensions.get("window").height * 0.6,
        borderRadius: 8,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 6,
        overflow: "hidden",
    },
    // eslint-disable-next-line react-native/no-color-literals
    dropdownTitle: {
        fontSize: 16,
        fontWeight: "600",
        paddingVertical: 12,
        paddingHorizontal: 16,
        textAlign: "center",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(0,0,0,0.1)",
    },
    tagsList: {
        paddingHorizontal: 16,
    },
    tagGroup: {
        marginVertical: 8,
    },
    groupTitle: {
        fontSize: 13,
        fontWeight: "500",
        marginBottom: 8,
        textTransform: "uppercase",
    },
    tagItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
    },
    tagColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginLeft: 12,
        marginRight: 8,
    },
    tagName: {
        fontSize: 14,
        flex: 1,
    },
    emptyText: {
        textAlign: "center",
        paddingVertical: 20,
        fontStyle: "italic",
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 12,
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    actionButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        borderWidth: 1,
        flex: 1,
        alignItems: "center",
        marginHorizontal: 4,
    },
})
