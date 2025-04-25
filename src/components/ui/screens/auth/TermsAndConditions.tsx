import React, { useState, useCallback, useRef } from "react" // Added useRef
import {
    View,
    StyleSheet,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
    SafeAreaView,
    LayoutChangeEvent, // Import LayoutChangeEvent
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme" // Adjust path
import { Stack } from "../../layout" // Adjust path
import { Text } from "../../typography" // Use custom Text
import { Button } from "../../button" // Use custom Button

interface Props {
    onAccept: () => void
    onDecline: () => void
}

export function TermsAndConditionsScreen({ onAccept, onDecline }: Props) {
    const { colors } = useTheme()
    const [canAccept, setCanAccept] = useState(false)
    const scrollViewRef = useRef<ScrollView>(null) // Ref for ScrollView
    const contentHeightRef = useRef<number>(0) // Store content height
    const scrollViewHeightRef = useRef<number>(0) // Store ScrollView height

    // Check if scroll is needed and enable accept button if not
    const checkScrollNeeded = useCallback(() => {
        // Add a small tolerance
        if (contentHeightRef.current <= scrollViewHeightRef.current + 1) {
            console.log("T&C content is short, enabling accept immediately.")
            setCanAccept(true)
        }
    }, []) // No dependencies needed here

    // Get ScrollView height on layout
    const handleScrollViewLayout = (event: LayoutChangeEvent) => {
        scrollViewHeightRef.current = event.nativeEvent.layout.height
        console.log("ScrollView Layout Height:", scrollViewHeightRef.current)
        // Check immediately if scroll is needed after layout
        checkScrollNeeded()
    }

    // Get Content height on layout
    const handleContentLayout = (event: LayoutChangeEvent) => {
        contentHeightRef.current = event.nativeEvent.layout.height
        console.log("Content Layout Height:", contentHeightRef.current)
        // Check immediately if scroll is needed after layout
        checkScrollNeeded()
    }

    // Logic to enable button after scrolling near bottom
    const handleScroll = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            // If already enabled, no need to check further
            if (canAccept) return

            const { layoutMeasurement, contentOffset, contentSize } =
                e.nativeEvent
            const paddingToBottom = 30 // Increased tolerance slightly
            const isScrolledToBottom =
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - paddingToBottom

            // console.log(`Scroll Check: Layout=${layoutMeasurement.height.toFixed(1)}, Offset=${contentOffset.y.toFixed(1)}, Content=${contentSize.height.toFixed(1)}, ReachedBottom=${isScrolledToBottom}`);

            if (isScrolledToBottom) {
                setCanAccept(true)
                console.log("Scrolled near bottom, enabling accept button.")
            }
        },
        [canAccept], // Dependency on canAccept to avoid unnecessary checks
    )

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack spacing={16} style={styles.inner}>
                <Text
                    variant="md"
                    weight="bold"
                    style={[styles.header, { color: colors.text }]}
                >
                    Términos y Condiciones
                </Text>

                {/* Scrollable Terms Content */}
                <View
                    style={[
                        styles.scrollContainer,
                        { borderColor: colors.border },
                    ]}
                >
                    <ScrollView
                        ref={scrollViewRef} // Assign ref
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        onScroll={handleScroll}
                        scrollEventThrottle={160}
                        onLayout={handleScrollViewLayout} // Get ScrollView height
                        showsVerticalScrollIndicator={true} // Show scrollbar
                    >
                        {/* Wrap content in a View to measure its height */}
                        <View onLayout={handleContentLayout}>
                            {/* T&C Text Content */}
                            <Text
                                style={[
                                    styles.textContent,
                                    { color: colors.secondaryText },
                                ]}
                            >
                                {/* ... (Your full T&C text here) ... */}
                                <Text weight="bold">1. Introducción</Text>
                                {"\n"}
                                Bienvenido a DocWallet...
                                {"\n\n"}
                                <Text weight="bold">10. Contacto</Text>
                                {"\n"}
                                Si tiene alguna pregunta...
                                {"\n\n"}
                                Al hacer clic en Acepto, confirma que ha
                                leído...
                            </Text>
                        </View>
                    </ScrollView>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <Button
                        title="Declinar"
                        variant="outline"
                        onPress={onDecline} // This should call the function passed via props
                        style={styles.actionButton}
                    />
                    <Button
                        title="Acepto"
                        onPress={onAccept} // This should call the function passed via props
                        disabled={!canAccept} // Enable based on state
                        style={styles.actionButton}
                    />
                </View>
            </Stack>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 15, // Ensure space for header
        paddingBottom: 10, // Space above buttons
    },
    header: {
        textAlign: "center",
        marginBottom: 10,
    },
    scrollContainer: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 16,
        overflow: "hidden",
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    textContent: {
        lineHeight: 22,
        fontSize: 14,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        gap: 15,
        paddingBottom: 5, // Add padding below buttons if needed
    },
    actionButton: {
        flex: 1,
    },
})
