import React, { useEffect, useMemo, useRef, useState } from "react"
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { Text } from "../../typography"
import { Button } from "../../button"
import { Row, Spacer } from "../../layout"
import type { Folder, ListItem } from "./types"
import { ItemsList } from "./ItemsList"
import RightChevronIcon from "../../assets/svg/chevron-right.svg"
import { useSafeAreaInsets } from "react-native-safe-area-context"

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
    const [folderPath, setFolderPath] = useState<Folder[]>([])
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

    // --- Data Filtering and Preparation for ItemsList ---
    const folderItemsForList = useMemo((): ListItem[] => {
        // 1. Filter folders: belonging to current view AND not one of the selected folders being moved
        const availableFolders = folders.filter(
            (folder) =>
                folder.parentId === currentViewFolderId &&
                !selectedFolderIds.includes(folder.id),
        )

        // 2. Sort alphabetically
        availableFolders.sort((a, b) => a.title.localeCompare(b.title))

        // 3. Map to ListItem structure
        return availableFolders.map(
            (folder): ListItem => ({ type: "folder", data: folder }),
        )
    }, [folders, currentViewFolderId, selectedFolderIds])

    // --- Selection & Move ---
    const handleSelectTarget = (id: string | null) => {
        setTargetFolderId(id)
    }

    const handleMove = () => {
        if (targetFolderId !== undefined) {
            onMove(targetFolderId)
        }
    }

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
                    <View
                        style={[
                            styles.backdrop,
                            { backgroundColor: colors.shadow + "60" },
                        ]}
                    />
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
                    {/* Handle Indicator */}
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

                    {/* --- Breadcrumbs --- */}
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
                                onPress={() => navigateToFolder(null)}
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
                            {folderPath.map((folder) => (
                                <Row key={folder.id} align="center">
                                    <RightChevronIcon
                                        width={12}
                                        height={12}
                                        stroke={colors.secondaryText}
                                        style={styles.breadcrumbSeparator}
                                    />
                                    <TouchableOpacity
                                        style={styles.breadcrumbItem}
                                        onPress={() =>
                                            navigateToFolder(folder.id)
                                        }
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
                                                    : { color: colors.primary },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {folder.title}
                                        </Text>
                                    </TouchableOpacity>
                                </Row>
                            ))}
                        </ScrollView>
                    </View>
                    <Spacer size={10} />

                    {/* Selection Buttons */}
                    <Row style={styles.selectionButtonRow}>
                        <Button
                            title="Move to Root"
                            variant="text"
                            onPress={() => handleSelectTarget(null)}
                            style={styles.selectButton}
                            textStyle={
                                targetFolderId === null
                                    ? styles.activeSelectButtonText
                                    : { color: colors.primary }
                            }
                        />
                        {currentViewFolderId !== null && (
                            <Button
                                title="Move Here"
                                variant="text"
                                onPress={() =>
                                    handleSelectTarget(currentViewFolderId)
                                }
                                style={styles.selectButton}
                                textStyle={
                                    targetFolderId === currentViewFolderId
                                        ? styles.activeSelectButtonText
                                        : { color: colors.primary }
                                }
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
                            <ItemsList
                                items={folderItemsForList}
                                isSelectionList={true}
                                selectedItemId={targetFolderId}
                                onSelectItem={handleSelectTarget}
                                selectionMode={false}
                                selectedFolderIds={[]}
                                emptyListMessage="No subfolders here"
                                testID="move-folder-dest-list"
                            />
                        )}
                    </View>

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
const styles = StyleSheet.create({
    keyboardAvoidingView: { flex: 1, justifyContent: "flex-end" },
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
    title: { marginBottom: 5, textAlign: "center" },
    navigationRow: { marginBottom: 8, minHeight: 35, flexShrink: 1 },
    breadcrumbsScrollView: { flex: 1 },
    breadcrumbsContent: { alignItems: "center" },
    breadcrumbItem: {
        paddingHorizontal: 4,
        paddingVertical: 4,
        marginRight: 2,
    },
    breadcrumbText: { fontSize: 14 },
    breadcrumbActive: { fontWeight: "bold" },
    breadcrumbSeparator: { marginHorizontal: 4, alignSelf: "center" },
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
    activeSelectButtonText: { fontWeight: "bold" },
    folderListContainer: {
        flex: 1,
        minHeight: 100,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingTop: 8,
        marginBottom: 10,
    },
    subheading: { marginBottom: 8, paddingLeft: 4 },
    loadingIndicator: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    actionButtonRow: { marginTop: 10 },
    buttonContainer: { flex: 1, marginHorizontal: 5 },
})
