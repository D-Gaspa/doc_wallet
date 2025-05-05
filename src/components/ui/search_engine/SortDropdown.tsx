import React, { useState, useRef } from "react"
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    StyleSheet,
    FlatList,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import ChevronIcon from "../assets/svg/chevron-right.svg"

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

export function SortDropdown({
    sortOption,
    onSelect,
    testID,
}: SortDropdownProps) {
    const { colors } = useTheme()
    const [open, setOpen] = useState(false)
    const btnRef = useRef<View>(null)
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

    const toggle = () => {
        if (!btnRef.current) return setOpen(!open)
        btnRef.current.measureInWindow((x, y, w, h) => {
            setMenuPos({ top: y + h + 4, left: x })
            setOpen(!open)
        })
    }

    return (
        <>
            <TouchableOpacity
                ref={btnRef}
                style={styles.button}
                onPress={toggle}
                testID={testID ?? "sort-dropdown-button"}
            >
                <Text style={{ color: colors.text }}>{`Ordenar: ${
                    OPTIONS.find((o) => o.value === sortOption)!.label
                }`}</Text>
                <ChevronIcon width={16} height={16} stroke={colors.text} />
            </TouchableOpacity>

            <Modal
                transparent
                visible={open}
                onRequestClose={() => setOpen(false)}
            >
                <TouchableWithoutFeedback onPress={() => setOpen(false)}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback>
                            <View
                                style={[
                                    styles.menu,
                                    {
                                        top: menuPos.top,
                                        left: menuPos.left,
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                    },
                                ]}
                            >
                                <FlatList
                                    data={OPTIONS}
                                    keyExtractor={(i) => i.value}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.item}
                                            onPress={() => {
                                                onSelect(item.value)
                                                setOpen(false)
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color:
                                                        item.value ===
                                                        sortOption
                                                            ? colors.primary
                                                            : colors.text,
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 8,
    },
    overlay: {
        flex: 1,
    },
    menu: {
        position: "absolute",
        width: 140,
        borderRadius: 6,
        borderWidth: 1,
        elevation: 5,
    },
    item: {
        padding: 12,
    },
})
