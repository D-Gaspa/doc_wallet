import React, { useEffect, useMemo, useRef, useState } from "react"
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { Text } from "../../typography"
import { Button } from "../../button"
import { Row, Spacer } from "../../layout"
import type { Folder, ListItem } from "./types"
import { ItemsList } from "./ItemsList"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { SelectedItem } from "./useSelectionMode"
import { BreadcrumbItem, BreadcrumbNavigation } from "./BreadcrumbNavigation"

const screenHeight = Dimensions.get("window").height
const sheetHeight = screenHeight * 0.75
const dragThreshold = sheetHeight * 0.3

interface ItemMoveModalProps {
    isVisible: boolean
    onClose: () => void
    folders: Folder[]
    selectedItemsToMove: SelectedItem[]
    onMove: (targetFolderId: string | null) => void
}

export function ItemMoveModal({
    isVisible,
    onClose,
    folders,
    selectedItemsToMove,
    onMove,
}: ItemMoveModalProps) {
    const { colors } = useTheme()
    const insets = useSafeAreaInsets()
    const translateY = useRef(new Animated.Value(screenHeight)).current
    const [finalTargetFolderId, setFinalTargetFolderId] = useState<
        string | null | undefined
    >(undefined)
    const [currentViewFolderId, setCurrentViewFolderId] = useState<
        string | null
    >(null)
    const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([])
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
            animateSheet(0)
            setFinalTargetFolderId(undefined)
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
                    Animated.timing(translateY, {
                        toValue: screenHeight,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        onClose()
                    })
                } else {
                    animateSheet(0, 200)
                }
            },
        }),
    ).current

    // --- Path and Navigation Logic ---
    const buildFolderPath = (
        targetFolderId: string | null,
    ): BreadcrumbItem[] => {
        if (targetFolderId === null) return []

        const path: BreadcrumbItem[] = []
        let currentFolder = folders.find((f) => f.id === targetFolderId)

        while (currentFolder) {
            path.unshift({ id: currentFolder.id, title: currentFolder.title })
            currentFolder = folders.find(
                (f) => f.id === currentFolder?.parentId,
            )
        }
        return path
    }

    const handleNavigate = (folderId: string | null) => {
        if (folderId === currentViewFolderId || isLoading) return
        setIsLoading(true)
        setFinalTargetFolderId(undefined)

        setCurrentViewFolderId(folderId)
        setFolderPath(buildFolderPath(folderId))

        setTimeout(() => setIsLoading(false), 50)
    }

    // --- Data Filtering for ItemsList ---
    const folderItemsForList = useMemo((): ListItem[] => {
        setIsLoading(true)
        // 1. Filter folders:
        const availableFolders = folders.filter((folder) => {
            // a) Belongs to current view
            const isInCurrentView = folder.parentId === currentViewFolderId
            // b) Is NOT one of the folders being moved
            const isBeingMoved = selectedItemsToMove.some(
                (item) => item.id === folder.id && item.type === "folder",
            )
            // c) Is NOT a descendant of one of the folders being moved (prevent moving into self/child)
            let isDescendantOfMoved = false
            const foldersBeingMovedIds = selectedItemsToMove
                .filter((item) => item.type === "folder")
                .map((item) => item.id)

            if (foldersBeingMovedIds.length > 0) {
                let parentIdToCheck = folder.parentId
                while (parentIdToCheck !== null) {
                    if (foldersBeingMovedIds.includes(parentIdToCheck)) {
                        isDescendantOfMoved = true
                        break
                    }
                    if (foldersBeingMovedIds.includes(folder.id)) {
                        isDescendantOfMoved = true
                        break
                    }
                    const parentFolder = folders.find(
                        (f) => f.id === parentIdToCheck,
                    )
                    parentIdToCheck = parentFolder
                        ? parentFolder.parentId
                        : null
                }
                if (foldersBeingMovedIds.includes(folder.id)) {
                    isDescendantOfMoved = true
                }
            }

            return isInCurrentView && !isBeingMoved && !isDescendantOfMoved
        })

        // 2. Sort alphabetically
        availableFolders.sort((a, b) => a.title.localeCompare(b.title))

        setIsLoading(false)
        // 3. Map to ListItem structure
        return availableFolders.map(
            (folder): ListItem => ({ type: "folder", data: folder }),
        )
    }, [folders, currentViewFolderId, selectedItemsToMove])

    const handleConfirmMove = () => {
        if (finalTargetFolderId !== undefined) {
            onMove(finalTargetFolderId)
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
                {/* Backdrop */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <View
                        style={[
                            styles.backdrop,
                            { backgroundColor: colors.shadow + "60" },
                        ]}
                    />
                </TouchableWithoutFeedback>

                {/* Bottom Sheet */}
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

                    {/* Breadcrumbs */}
                    <BreadcrumbNavigation
                        path={folderPath}
                        onNavigate={handleNavigate}
                    />

                    <Spacer size={10} />

                    {/* --- Selection Buttons --- */}
                    <Row style={styles.selectionButtonRow}>
                        <Button
                            title="Select Root"
                            variant="text"
                            onPress={() => setFinalTargetFolderId(null)}
                            style={
                                finalTargetFolderId === null
                                    ? {
                                          ...styles.selectButton,
                                          backgroundColor:
                                              colors.primary + "20",
                                      }
                                    : styles.selectButton
                            }
                            textStyle={
                                finalTargetFolderId === null
                                    ? // eslint-disable-next-line react-native/no-inline-styles
                                      {
                                          fontWeight: "bold",
                                          color: colors.primary,
                                      }
                                    : { color: colors.primary }
                            }
                        />
                        {currentViewFolderId !== null && (
                            <Button
                                title="Select Current Folder"
                                variant="text"
                                onPress={() =>
                                    setFinalTargetFolderId(currentViewFolderId)
                                }
                                style={
                                    finalTargetFolderId === currentViewFolderId
                                        ? {
                                              ...styles.selectButton,
                                              backgroundColor:
                                                  colors.primary + "20",
                                          }
                                        : styles.selectButton
                                }
                                textStyle={
                                    finalTargetFolderId === currentViewFolderId
                                        ? // eslint-disable-next-line react-native/no-inline-styles
                                          {
                                              fontWeight: "bold",
                                              color: colors.primary,
                                          }
                                        : { color: colors.primary }
                                }
                            />
                        )}
                    </Row>
                    <Spacer size={16} />
                    <Text
                        variant="sm"
                        weight="medium"
                        style={[
                            styles.subheading,
                            { color: colors.secondaryText },
                        ]}
                    >
                        Or click a subfolder below to navigate:
                    </Text>

                    {/* ItemsList for Destination Folders */}
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
                                isSelectionList={false}
                                onFolderPress={handleNavigate}
                                selectionMode={false}
                                selectedItems={[]}
                                emptyListMessage="No subfolders available"
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
                                title="Move Here"
                                onPress={handleConfirmMove}
                                disabled={finalTargetFolderId === undefined}
                            />
                        </View>
                    </Row>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    )
}

// Styles
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
    selectionButtonRow: {
        justifyContent: "flex-start",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 10,
    },
    // eslint-disable-next-line react-native/no-color-literals
    selectButton: {
        width: "auto",
        paddingHorizontal: 12,
        paddingVertical: 6,
        minHeight: 0,
        borderWidth: 0,
        borderRadius: 6,
        backgroundColor: "transparent",
    },
    folderListContainer: {
        flex: 1,
        minHeight: 100,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        marginBottom: 10,
    },
    subheading: { marginBottom: 8, paddingLeft: 4 },
    loadingIndicator: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    actionButtonRow: { marginTop: 10, paddingBottom: 10 },
    buttonContainer: { flex: 1, marginHorizontal: 5 },
})
