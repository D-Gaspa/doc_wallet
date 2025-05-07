import React, { useRef, useState } from "react"
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

export type SortOption = "name" | "date" | "type"

interface SortDropdownProps {
    sortOption: SortOption
    onSelect: (opt: SortOption) => void
    testID?: string
}

const OPTIONS: { label: string; value: SortOption }[] = [
    { label: "Nombre", value: "name" },
    { label: "Fecha", value: "date" },
    { label: "Tipo", value: "type" },
]

const screenWidth = Dimensions.get("window").width

export function SortDropdown({
    sortOption,
    onSelect,
    testID,
}: SortDropdownProps) {
    const { colors } = useTheme()
    const [open, setOpen] = useState(false)
    const btnRef = useRef<View>(null)
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 140 })

    const toggle = () => {
        if (!btnRef.current) {
            setOpen(!open)
            return
        }
        btnRef.current.measureInWindow(
            (x: number, y: number, _w: number, h: number) => {
                const dropdownWidth = 150
                let calculatedLeft = x
                if (x + dropdownWidth > screenWidth - 10) {
                    calculatedLeft = screenWidth - dropdownWidth - 10
                }

                setMenuPos({
                    top: y + h + 4,
                    left: calculatedLeft,
                    width: dropdownWidth,
                })
                setOpen(!open)
            },
        )
    }

    const currentLabel =
        OPTIONS.find((o) => o.value === sortOption)?.label || "Ordenar"

    return (
        <>
            <TouchableOpacity
                ref={btnRef}
                style={[
                    styles.button,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                    },
                ]}
                onPress={toggle}
                testID={testID ?? "sort-dropdown-button"}
                activeOpacity={0.7}
                accessibilityLabel={`Ordenar por ${currentLabel}, presiona para cambiar`}
            >
                <FontAwesome6
                    name="sort"
                    size={16}
                    color={colors.primary}
                    iconStyle="solid"
                    style={styles.buttonIcon}
                />
                <Text style={[styles.buttonText, { color: colors.text }]}>
                    {currentLabel}
                </Text>
                <FontAwesome6
                    name={open ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={colors.secondaryText}
                    iconStyle="solid"
                />
            </TouchableOpacity>

            <Modal
                transparent
                visible={open}
                onRequestClose={() => setOpen(false)}
                animationType="fade"
            >
                <TouchableWithoutFeedback onPress={() => setOpen(false)}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View
                                style={[
                                    styles.menu,
                                    {
                                        top: menuPos.top,
                                        left: menuPos.left,
                                        width: menuPos.width,
                                        backgroundColor: colors.card,
                                        borderColor: colors.border,
                                    },
                                ]}
                            >
                                <FlatList
                                    data={OPTIONS}
                                    keyExtractor={(i) => i.value}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.item,
                                                {
                                                    borderBottomColor:
                                                        colors.border,
                                                },
                                            ]}
                                            onPress={() => {
                                                onSelect(item.value)
                                                setOpen(false)
                                            }}
                                            accessibilityRole="menuitem"
                                        >
                                            <Text
                                                /* eslint-disable-next-line react-native/no-inline-styles */
                                                style={{
                                                    color:
                                                        item.value ===
                                                        sortOption
                                                            ? colors.primary
                                                            : colors.text,
                                                    fontWeight:
                                                        item.value ===
                                                        sortOption
                                                            ? "bold"
                                                            : "normal",
                                                }}
                                            >
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    )
}

const styles = StyleSheet.create({
    button: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginLeft: 8,
        minHeight: 38,
    },
    buttonIcon: {
        marginRight: 6,
    },
    buttonText: {
        fontSize: 13,
        fontWeight: "500",
        marginRight: 4,
    },
    overlay: {
        flex: 1,
    },
    // eslint-disable-next-line react-native/no-color-literals
    menu: {
        position: "absolute",
        borderRadius: 10,
        borderWidth: 1,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        overflow: "hidden",
    },
    item: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
})
