import React, { useState, useRef } from "react"
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native"
import { useTheme } from "../hooks/useTheme.ts"
import PlusIcon from "../../src/components/ui/assets/svg/plus.svg"
import AddFolderIcon from "../../src/components/ui/assets/svg/add_folder.svg" // Reuse existing icon
import AddFileIcon from "../../src/components/ui/assets/svg/add-file-icon.svg" // Or another suitable document icon

interface ExpandingFabProps {
    onAddFolder: () => void
    onAddDocument: () => void
}

const FAB_SIZE = 56
const SECONDARY_FAB_SIZE = 48
const ANIMATION_DURATION = 200

export function ExpandingFab({
    onAddFolder,
    onAddDocument,
}: ExpandingFabProps) {
    const { colors } = useTheme()
    const [isExpanded, setIsExpanded] = useState(false)
    const animation = useRef(new Animated.Value(0)).current // 0 = collapsed, 1 = expanded

    const toggleExpand = () => {
        const toValue = isExpanded ? 0 : 1
        Animated.timing(animation, {
            toValue,
            duration: ANIMATION_DURATION,
            useNativeDriver: true, // More performant
        }).start()
        setIsExpanded(!isExpanded)
    }

    const handleAddFolderPress = () => {
        onAddFolder()
        toggleExpand() // Collapse after action
    }

    const handleAddDocumentPress = () => {
        onAddDocument()
        toggleExpand() // Collapse after action
    }

    // --- Animations ---
    // Rotate main '+' icon
    const rotateInterpolate = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "45deg"],
    })

    // Translate secondary buttons up
    const translateFolderY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -(FAB_SIZE + 15)], // Move up from main FAB
    })

    const translateDocumentY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -(FAB_SIZE * 2 + 30)], // Move up further
    })

    // Fade in secondary buttons
    const opacityInterpolate = animation.interpolate({
        inputRange: [0, 0.5, 1], // Start fading in halfway through expansion
        outputRange: [0, 0, 1],
    })
    // --- End Animations ---

    const mainFabStyle = {
        transform: [{ rotate: rotateInterpolate }],
    }

    const secondaryFabFolderStyle = {
        opacity: opacityInterpolate,
        transform: [{ translateY: translateFolderY }],
    }

    const secondaryFabDocumentStyle = {
        opacity: opacityInterpolate,
        transform: [{ translateY: translateDocumentY }],
    }

    return (
        <View style={styles.container}>
            {/* Secondary Button: Add Document */}
            <Animated.View
                style={[
                    styles.secondaryFabContainer,
                    secondaryFabDocumentStyle,
                    !isExpanded && styles.hidden, // Hide when collapsed for touch events
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.secondaryFab,
                        { backgroundColor: colors.secondary },
                    ]}
                    onPress={handleAddDocumentPress}
                    disabled={!isExpanded} // Disable touch when hidden/animating out
                >
                    <AddFileIcon
                        width={SECONDARY_FAB_SIZE * 0.5}
                        height={SECONDARY_FAB_SIZE * 0.5}
                        color={colors.primary}
                    />
                </TouchableOpacity>
            </Animated.View>

            {/* Secondary Button: Add Folder */}
            <Animated.View
                style={[
                    styles.secondaryFabContainer,
                    secondaryFabFolderStyle,
                    !isExpanded && styles.hidden, // Hide when collapsed for touch events
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.secondaryFab,
                        { backgroundColor: colors.secondary },
                    ]}
                    onPress={handleAddFolderPress}
                    disabled={!isExpanded} // Disable touch when hidden/animating out
                >
                    <AddFolderIcon
                        width={SECONDARY_FAB_SIZE * 0.5}
                        height={SECONDARY_FAB_SIZE * 0.5}
                        color={colors.primary}
                    />
                </TouchableOpacity>
            </Animated.View>

            {/* Main FAB */}
            <TouchableOpacity
                style={[styles.mainFab, { backgroundColor: colors.primary }]}
                onPress={toggleExpand}
                activeOpacity={0.8}
            >
                <Animated.View style={mainFabStyle}>
                    <PlusIcon
                        width={FAB_SIZE * 0.5}
                        height={FAB_SIZE * 0.5}
                        fill={colors.tabbarIcon_active} // Use theme color for active icon
                    />
                </Animated.View>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 30,
        right: 20,
        alignItems: "center",
        zIndex: 10, // Ensure it's above other list content
    },
    mainFab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        alignItems: "center",
        justifyContent: "center",
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    secondaryFabContainer: {
        position: "absolute", // Position relative to the main container
        left: (FAB_SIZE - SECONDARY_FAB_SIZE) / 2, // Center horizontally
        bottom: 0,
    },
    secondaryFab: {
        width: SECONDARY_FAB_SIZE,
        height: SECONDARY_FAB_SIZE,
        borderRadius: SECONDARY_FAB_SIZE / 2,
        alignItems: "center",
        justifyContent: "center",
        elevation: 6,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
    },
    hidden: {
        opacity: 0,
    },
})
