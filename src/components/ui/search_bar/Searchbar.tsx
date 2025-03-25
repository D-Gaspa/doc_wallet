import React, { useState } from "react"
import { TextInput, TouchableOpacity, View, StyleSheet } from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"
import SearchIcon from "../assets/svg/search.svg"

export interface SearchBarProps {
    placeholder?: string
    onSearch?: (query: string) => void
    testID?: string
}

export function SearchBar({
    placeholder = "Search...",
    onSearch,
    testID,
}: SearchBarProps) {
    const { colors } = useTheme()
    const [query, setQuery] = useState("")

    return (
        <View
            style={[styles.container, { backgroundColor: colors.searchbar }]}
            testID={testID ?? "search-bar"}
        >
            {/* Text Input */}
            <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={placeholder}
                placeholderTextColor={colors.primary}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => onSearch?.(query)}
                testID="search-input"
            />

            {/* Search Button */}
            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={() => onSearch?.(query)}
                testID="search-button"
            >
                <SearchIcon width={20} height={20} stroke={"#FFFFFF"} />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 10,
    },
    button: {
        width: 40,
        height: 40,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
    },
})
