import React, { useCallback, useEffect, useRef, useState } from "react"
import {
    FlatList,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../hooks/useTheme.ts"

import { useSearchHistory } from "../../../hooks/useSearchHistory.ts"
import { useSearchSuggestions } from "../../../hooks/useSearchSuggestions.ts"

export interface SearchBarProps {
    placeholder?: string
    onSearch?: (query: string) => void
    onReset?: () => void
    testID?: string
}

export function SearchBar({
    placeholder = "Buscar...",
    onSearch,
    onReset,
    testID,
}: SearchBarProps) {
    const { colors } = useTheme()
    const [query, setQuery] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const inputRef = useRef<TextInput>(null)

    const { history, addToHistory } = useSearchHistory()
    const suggestions = useSearchSuggestions(query, history)

    useEffect(() => {
        const timerId = setTimeout(() => {}, 300)

        return () => clearTimeout(timerId)
    }, [query])

    const runSearch = useCallback(
        async (text: string = query) => {
            const trimmed = text.trim()
            setShowSuggestions(false)
            Keyboard.dismiss()

            if (!trimmed) {
                onReset?.()
                onSearch?.("")
                return
            }

            try {
                await addToHistory(trimmed)
                onSearch?.(trimmed)
            } catch (e) {
                console.error("Failed during search operation:", e)
            }
        },
        [query, onSearch, onReset, addToHistory],
    )

    const handleSelectSuggestion = useCallback(
        (suggestion: string) => {
            setShowSuggestions(false)
            setQuery(suggestion)
            setTimeout(() => {
                runSearch(suggestion).then((r) => r)
            }, 50)
        },
        [runSearch],
    )

    const clearSearch = useCallback(() => {
        setShowSuggestions(false)
        setQuery("")
        Keyboard.dismiss()
        onReset?.()
        onSearch?.("")
    }, [onSearch, onReset])

    return (
        <View style={styles.wrapper}>
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: colors.searchbar,
                        borderColor: colors.border,
                    },
                ]}
                testID={testID ?? "search-bar"}
            >
                <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: colors.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.secondaryText}
                    value={query}
                    onChangeText={(t) => {
                        setQuery(t)
                        if (t) {
                            setShowSuggestions(true)
                        } else {
                            setShowSuggestions(false)
                        }
                    }}
                    onSubmitEditing={() => runSearch()}
                    onFocus={() => {
                        if (query) {
                            setShowSuggestions(true)
                        }
                    }}
                    testID="search-input"
                />

                {query.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearSearch}
                        testID="clear-button"
                        activeOpacity={0.6}
                        accessibilityLabel="Limpiar búsqueda"
                    >
                        <FontAwesome6
                            name="xmark"
                            size={18}
                            color={colors.secondaryText}
                            iconStyle="solid"
                        />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={() => runSearch()}
                    testID="search-button"
                    activeOpacity={0.8}
                    accessibilityLabel="Buscar"
                >
                    <FontAwesome6
                        name="magnifying-glass"
                        size={18}
                        color={colors.tabbarIcon_active}
                        iconStyle="solid"
                    />
                </TouchableOpacity>
            </View>

            {showSuggestions && suggestions.length > 0 && (
                <View
                    style={[
                        styles.suggestions,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item, i) => `${item}-${i}`}
                        keyboardShouldPersistTaps="always"
                        renderItem={({ item }) => (
                            <TouchableWithoutFeedback
                                onPress={() => handleSelectSuggestion(item)}
                            >
                                <View
                                    style={[
                                        styles.suggestionItem,
                                        { borderBottomColor: colors.border },
                                    ]}
                                >
                                    <FontAwesome6
                                        name="clock-rotate-left"
                                        size={14}
                                        color={colors.secondaryText}
                                        iconStyle="solid"
                                        style={styles.suggestionIcon}
                                    />
                                    <Text
                                        style={[
                                            styles.suggestionText,
                                            { color: colors.text },
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                </View>
                            </TouchableWithoutFeedback>
                        )}
                    />
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        width: "100%",
        position: "relative",
        zIndex: 10,
    },
    container: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 25,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 10,
        marginRight: 8,
    },
    clearButton: {
        padding: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    button: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 5,
    },
    // eslint-disable-next-line react-native/no-color-literals
    suggestions: {
        position: "absolute",
        top: 52,
        left: 0,
        right: 0,
        maxHeight: 220,
        borderWidth: 1,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
    },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    suggestionIcon: {
        marginRight: 12,
        opacity: 0.7,
    },
    suggestionText: {
        fontSize: 14,
    },
})
