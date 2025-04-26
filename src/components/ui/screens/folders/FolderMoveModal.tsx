import React, { useState, useEffect, useRef } from "react"
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ScrollView,
    ActivityIndicator,
    Modal,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    Platform,
    KeyboardAvoidingView,
    PanResponder,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme" // Adjust path
import { Text } from "../../typography" // Adjust path
import { Button } from "../../button" // Adjust path
import { Spacer, Row } from "../../layout" // Adjust path
import type { Folder } from "./types" // Adjust path
import { FolderCard } from "../../cards" // Adjust path
import RightChevronIcon from "../../assets/svg/chevron-right.svg" // Example path
import { useSafeAreaInsets } from "react-native-safe-area-context"

// --- Constants ---
const screenHeight = Dimensions.get("window").height
const sheetHeight = screenHeight * 0.75
const dragThreshold = sheetHeight * 0.3

interface FolderMoveModalProps {
    isVisible: boolean
    onClose: () => void
    folders: Folder[]
    selectedFolderIds: string[]
    onMove: (targetFolderId: string | null) => void
}

export function FolderMoveModal({
    isVisible,
    onClose,
    folders,
    selectedFolderIds,
    onMove,
}: FolderMoveModalProps) {
    const { colors } = useTheme()
    const insets = useSafeAreaInsets()
    const translateY = useRef(new Animated.Value(screenHeight)).current
    const [targetFolderId, setTargetFolderId] = useState<
        string | null | undefined
    >(undefined)
    const [folderPath, setFolderPath] = useState<Folder[]>([]) // Now used by breadcrumbs
    const [currentViewFolderId, setCurrentViewFolderId] = useState<
        string | null
    >(null)
    const [isLoading, setIsLoading] = useState(false)

    // --- Animation Logic ---
    const animateSheet = (toValue: number, duration: number = 300) => {
        Animated.timing(translateY, {
            toValue,
            duration,
            useNativeDriver: true,
        }).start()
    }

    useEffect(() => {
        if (isVisible) {
            animateSheet(0) // Animate In
            // Reset state
            setTargetFolderId(undefined)
            setCurrentViewFolderId(null)
            setFolderPath([])
            setIsLoading(false)
        } else {
            animateSheet(screenHeight, 250)
        }
    }, [isVisible])

    // --- Gesture Handling ---
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                translateY.setValue(Math.max(0, gestureState.dy))
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > dragThreshold || gestureState.vy > 0.5) {
                    // Animate out fully before calling onClose
                    Animated.timing(translateY, {
                        toValue: screenHeight,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        // Call onClose *after* animation completes
                        onClose()
                    })
                } else {
                    animateSheet(0, 200) // Spring back up
                }
            },
        }),
    ).current

    // --- Navigation Logic (Used by Breadcrumbs) ---
    const navigateToFolder = (folderId: string | null) => {
        // Now used
        if (folderId === currentViewFolderId || isLoading) return
        setIsLoading(true)
        setTargetFolderId(undefined)

        if (folderId === null) {
            setCurrentViewFolderId(null)
            setFolderPath([])
        } else {
            const folder = folders.find((f) => f.id === folderId)
            if (folder) {
                setCurrentViewFolderId(folderId)
                const path: Folder[] = []
                let current: Folder | undefined = folder
                while (current) {
                    path.unshift(current)
                    current = folders.find((f) => f.id === current?.parentId)
                }
                setFolderPath(path) // folderPath is now used here
            }
        }
        setTimeout(() => setIsLoading(false), 50)
    }

    // --- Data Filtering ---
    const getCurrentFolders = () => {
        return folders.filter(
            (folder) =>
                folder.parentId === currentViewFolderId &&
                !selectedFolderIds.includes(folder.id),
        )
    }

    // --- Selection & Move ---
    const handleSelectTarget = (id: string | null) => {
        setTargetFolderId(id)
    }

    const handleMove = () => {
        if (targetFolderId !== undefined) {
            onMove(targetFolderId)
            // Parent should set isVisible=false after move, triggering animation
            // onClose(); // Do not call onClose directly here
        }
    }

    // --- Rendering ---
    const renderFolderItem = ({ item }: { item: Folder }) => (
        <TouchableOpacity onPress={() => handleSelectTarget(item.id)}>
            <FolderCard
                title={item.title}
                type={item.type ?? "custom"}
                selected={targetFolderId === item.id}
                folderId={item.id}
                showAddTagButton={false}
                onPress={() => handleSelectTarget(item.id)}
            />
        </TouchableOpacity>
    )

    const displayedFolders = getCurrentFolders()
    const animatedStyle = { transform: [{ translateY: translateY }] }

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.sheetContainer,
                        animatedStyle,
                        {
                            backgroundColor: colors.background,
                            paddingBottom: insets.bottom,
                        },
                    ]}
                    {...panResponder.panHandlers}
                >
                    <View
                        style={[
                            styles.handleIndicator,
                            { backgroundColor: colors.border + "80" },
                        ]}
                    />

                    {/* Title */}
                    <Text
                        variant="md"
                        weight="bold"
                        style={[styles.title, { color: colors.text }]}
                    >
                        Move To Folder
                    </Text>
                    <Spacer size={5} />

                    {/* --- Breadcrumbs (Re-added) --- */}
                    <View style={styles.navigationRow}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.breadcrumbsScrollView}
                            contentContainerStyle={styles.breadcrumbsContent}
                        >
                            {/* Root Breadcrumb */}
                            <TouchableOpacity
                                style={styles.breadcrumbItem}
                                onPress={() => navigateToFolder(null)} // Uses navigateToFolder
                            >
                                <Text
                                    variant="sm"
                                    style={[
                                        styles.breadcrumbText,
                                        currentViewFolderId === null
                                            ? [
                                                  styles.breadcrumbActive,
                                                  { color: colors.text },
                                              ]
                                            : { color: colors.primary },
                                    ]}
                                >
                                    Choose Destination
                                </Text>
                            </TouchableOpacity>
                            {/* Folder Path Breadcrumbs */}
                            {folderPath.map(
                                (
                                    folder, // Uses folderPath
                                ) => (
                                    <Row key={folder.id} align="center">
                                        <RightChevronIcon
                                            width={12}
                                            height={12}
                                            color={colors.secondaryText}
                                            style={styles.breadcrumbSeparator}
                                        />
                                        <TouchableOpacity
                                            style={styles.breadcrumbItem}
                                            onPress={() =>
                                                navigateToFolder(folder.id)
                                            } // Uses navigateToFolder
                                        >
                                            <Text
                                                variant="sm"
                                                style={[
                                                    styles.breadcrumbText,
                                                    currentViewFolderId ===
                                                    folder.id
                                                        ? [
                                                              styles.breadcrumbActive,
                                                              {
                                                                  color: colors.text,
                                                              },
                                                          ]
                                                        : {
                                                              color: colors.primary,
                                                          },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {folder.title}
                                            </Text>
                                        </TouchableOpacity>
                                    </Row>
                                ),
                            )}
                        </ScrollView>
                    </View>
                    {/* --- End Breadcrumbs --- */}

                    <Spacer size={10} />

                    {/* Selection Buttons */}
                    <Row style={styles.selectionButtonRow}>
                        <Button
                            title="Move to Root"
                            variant="text"
                            onPress={() => handleSelectTarget(null)}
                            style={styles.selectButton}
                        />
                        {currentViewFolderId !== null && (
                            <Button
                                title="Move Here"
                                variant="text"
                                onPress={() =>
                                    handleSelectTarget(currentViewFolderId)
                                }
                                style={styles.selectButton}
                            />
                        )}
                    </Row>
                    <Spacer size={16} />

                    {/* Folder List Title */}
                    <Text
                        variant="sm"
                        weight="medium"
                        style={[
                            styles.subheading,
                            { color: colors.secondaryText },
                        ]}
                    >
                        Or select a subfolder below:
                    </Text>
                    {/* Folder List */}
                    <View
                        style={[
                            styles.folderListContainer,
                            { borderColor: colors.border },
                        ]}
                    >
                        {isLoading ? (
                            <ActivityIndicator
                                style={styles.loadingIndicator}
                                color={colors.primary}
                            />
                        ) : (
                            <FlatList
                                data={displayedFolders}
                                renderItem={renderFolderItem}
                                keyExtractor={(item) => item.id}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Text
                                            variant="sm"
                                            style={{
                                                color: colors.secondaryText,
                                            }}
                                        >
                                            (No subfolders here)
                                        </Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                    <Spacer size={16} />

                    {/* Action Buttons */}
                    <Row justify="space-between" style={styles.actionButtonRow}>
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Cancel"
                                onPress={onClose}
                                variant="outline"
                            />
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Move"
                                onPress={handleMove}
                                disabled={targetFolderId === undefined}
                            />
                        </View>
                    </Row>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    )
}

// --- Styles ---
// Styles remain the same
const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheetContainer: {
        height: sheetHeight,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 15,
        paddingTop: 10,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 10,
        overflow: "hidden",
    },
    handleIndicator: {
        width: 50,
        height: 6,
        borderRadius: 3,
        alignSelf: "center",
        marginBottom: 8,
    },
    title: {
        marginBottom: 5,
        textAlign: "center",
    },
    navigationRow: {
        marginBottom: 8,
        minHeight: 35,
        flexShrink: 1,
    },
    breadcrumbsScrollView: {
        flex: 1,
    },
    breadcrumbsContent: {
        alignItems: "center",
    },
    breadcrumbItem: {
        paddingHorizontal: 4,
        paddingVertical: 4,
        marginRight: 2,
    },
    breadcrumbText: {
        fontSize: 14,
    },
    breadcrumbActive: {
        fontWeight: "bold",
    },
    breadcrumbSeparator: {
        marginHorizontal: 4,
        alignSelf: "center",
    },
    selectionButtonRow: {
        justifyContent: "flex-start",
        gap: 10,
        flexWrap: "wrap",
    },
    selectButton: {
        width: "auto",
        paddingHorizontal: 10,
        paddingVertical: 4,
        minHeight: 0,
        borderWidth: 0,
    },
    folderListContainer: {
        flex: 1,
        minHeight: 100,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingTop: 8,
        marginBottom: 10,
    },
    subheading: {
        marginBottom: 8,
        paddingLeft: 4,
    },
    emptyContainer: {
        height: 80,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingIndicator: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    actionButtonRow: {
        // Style as needed
    },
    buttonContainer: {
        flex: 1,
        marginHorizontal: 5,
    },
})
