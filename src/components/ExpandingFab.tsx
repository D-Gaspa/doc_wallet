import React, { useRef, useState } from "react"
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../hooks/useTheme"

interface ExpandingFabProps {
    onAddFolder: () => void
    onAddDocument: () => void
    testID?: string
}

const FAB_SIZE = 56
const SECONDARY_FAB_SIZE = 48
const ANIMATION_DURATION = 200

export function ExpandingFab({
    onAddFolder,
    onAddDocument,
    testID,
}: ExpandingFabProps) {
    const { colors } = useTheme()
    const [isExpanded, setIsExpanded] = useState(false)
    const animation = useRef(new Animated.Value(0)).current

    const toggleExpand = () => {
        const toValue = isExpanded ? 0 : 1
        Animated.timing(animation, {
            toValue,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
        }).start()
        setIsExpanded(!isExpanded)
    }

    const handleAddFolderPress = () => {
        onAddFolder()
        toggleExpand()
    }

    const handleAddDocumentPress = () => {
        onAddDocument()
        toggleExpand()
    }

    const rotateInterpolate = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "45deg"],
    })

    const translateFolderY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -(FAB_SIZE + 15)],
    })

    const translateDocumentY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -(FAB_SIZE + SECONDARY_FAB_SIZE + 30)],
    })

    const opacityInterpolate = animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
    })

    const mainFabIconStyle = {
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
        <View style={styles.container} testID={testID ?? "expanding-fab"}>
            {/* Secondary Button: Add Document */}
            <Animated.View
                style={[
                    styles.secondaryFabContainer,
                    secondaryFabDocumentStyle,
                ]}
                pointerEvents={isExpanded ? "auto" : "none"}
            >
                <TouchableOpacity
                    style={[
                        styles.secondaryFab,
                        { backgroundColor: colors.secondary },
                    ]}
                    onPress={handleAddDocumentPress}
                    disabled={!isExpanded}
                    testID="fab-add-document-button"
                    accessibilityLabel="Añadir documento"
                >
                    <FontAwesome6
                        name="file-circle-plus"
                        size={SECONDARY_FAB_SIZE * 0.45}
                        color={colors.primary}
                        iconStyle="solid"
                    />
                </TouchableOpacity>
            </Animated.View>

            {/* Secondary Button: Add Folder */}
            <Animated.View
                style={[styles.secondaryFabContainer, secondaryFabFolderStyle]}
                pointerEvents={isExpanded ? "auto" : "none"}
            >
                <TouchableOpacity
                    style={[
                        styles.secondaryFab,
                        { backgroundColor: colors.secondary },
                    ]}
                    onPress={handleAddFolderPress}
                    disabled={!isExpanded}
                    testID="fab-add-folder-button"
                    accessibilityLabel="Añadir carpeta"
                >
                    <FontAwesome6
                        name="folder-plus"
                        size={SECONDARY_FAB_SIZE * 0.45}
                        color={colors.primary}
                        iconStyle="solid"
                    />
                </TouchableOpacity>
            </Animated.View>

            {/* Main FAB (Toggle Button) */}
            <TouchableOpacity
                style={[styles.mainFab, { backgroundColor: colors.primary }]}
                onPress={toggleExpand}
                activeOpacity={0.8}
                testID="fab-toggle-button"
                accessibilityLabel={
                    isExpanded ? "Cerrar opciones" : "Abrir opciones"
                }
            >
                <Animated.View style={mainFabIconStyle}>
                    <FontAwesome6
                        name="plus"
                        size={FAB_SIZE * 0.5}
                        color={colors.tabbarIcon_active}
                        iconStyle="solid"
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
        zIndex: 10,
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
        position: "absolute",
        left: (FAB_SIZE - SECONDARY_FAB_SIZE) / 2,
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
})
