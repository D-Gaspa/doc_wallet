import React, { useState, useRef, useCallback, useEffect } from "react"
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Text,
    TouchableWithoutFeedback,
    Keyboard,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"
import SearchIcon from "../assets/svg/search.svg"
import { useSearchHistory } from "../../../hooks/useSearchHistory.ts"
import { useSearchSuggestions } from "../../../hooks/useSearchSuggestions.ts"

export interface SearchBarProps {
    placeholder?: string
    onSearch?: (query: string) => void
    onReset?: () => void // Nueva prop para manejar el retorno a la pantalla inicial
    testID?: string
}

export function SearchBar({
    placeholder = "Search...",
    onSearch,
    onReset,
    testID,
}: SearchBarProps) {
    const { colors } = useTheme()
    const [query, setQuery] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const inputRef = useRef<TextInput>(null)

    // Use our custom hooks
    const { history, addToHistory } = useSearchHistory()
    const suggestions = useSearchSuggestions(query, history)

    // Reset flags after 300ms to prevent any stuck state
    useEffect(() => {
        const timerId = setTimeout(() => {
            // This ensures our buttons become responsive again
            // after any operation, even if there was an error
        }, 300)

        return () => clearTimeout(timerId)
    }, [query])

    // Execute search
    const runSearch = useCallback(
        async (text: string = query) => {
            const trimmed = text.trim()

            // Hide suggestions and dismiss keyboard first
            setShowSuggestions(false)
            Keyboard.dismiss()

            if (!trimmed) {
                // Si la búsqueda está vacía, llamamos a onReset para volver a la pantalla inicial
                onReset?.()
                // También notificamos con una búsqueda vacía por si acaso
                onSearch?.("")
                return
            }

            try {
                // Add to history
                await addToHistory(trimmed)
                // Execute search
                onSearch?.(trimmed)
            } catch (e) {
                console.error("Failed during search operation:", e)
            }
        },
        [query, onSearch, onReset, addToHistory],
    )

    // Handle selection of a suggestion
    const handleSelectSuggestion = useCallback(
        (suggestion: string) => {
            // Hide suggestions first
            setShowSuggestions(false)

            // Set the query
            setQuery(suggestion)

            // Execute the search immediately
            setTimeout(() => {
                runSearch(suggestion)
            }, 50)
        },
        [runSearch],
    )

    // Clear the search
    const clearSearch = useCallback(() => {
        // First hide suggestions
        setShowSuggestions(false)

        // Clear query
        setQuery("")

        // Dismiss keyboard
        Keyboard.dismiss()

        // Volver a la pantalla inicial
        onReset?.()

        // También notificamos con búsqueda vacía por compatibilidad
        onSearch?.("")
    }, [onSearch, onReset])

    return (
        <View style={styles.wrapper}>
            <View
                style={[
                    styles.container,
                    { backgroundColor: colors.searchbar },
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
                    >
                        <Text style={{ color: colors.secondaryText }}>✕</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={() => runSearch()}
                    testID="search-button"
                    activeOpacity={0.8}
                >
                    <SearchIcon width={20} height={20} stroke="#FFF" />
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
                                    <SearchIcon
                                        width={16}
                                        height={16}
                                        stroke={colors.secondaryText}
                                        style={styles.suggestionIcon}
                                    />
                                    <Text style={{ color: colors.text }}>
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
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 10,
    },
    clearButton: {
        padding: 8,
        minWidth: 32,
        minHeight: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    button: {
        width: 40,
        height: 40,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 5,
    },
    suggestions: {
        position: "absolute",
        top: 55,
        left: 0,
        right: 0,
        maxHeight: 200,
        borderWidth: 1,
        borderRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        zIndex: 1000,
    },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderBottomWidth: 1,
    },
    suggestionIcon: {
        marginRight: 10,
    },
})
