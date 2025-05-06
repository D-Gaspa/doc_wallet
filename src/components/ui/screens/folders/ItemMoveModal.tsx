import React, { useEffect, useMemo, useRef, useState } from "react"
import {
    ActivityIndicator,
    Alert,
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
import { useDocStore } from "../../../../store"

const screenHeight = Dimensions.get("window").height
const sheetHeight = screenHeight * 0.75
const dragThreshold = sheetHeight * 0.3

interface ItemMoveModalProps {
    isVisible: boolean
    onClose: () => void
    folders: Folder[]
    selectedItemsToMove: SelectedItem[]
    onMove: (targetFolderId: string) => void
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

    const [currentViewFolderId, setCurrentViewFolderId] = useState<
        string | null
    >(null)
    const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([])
    const [isLoading, setIsLoading] = useState(false)

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

            const firstItem = selectedItemsToMove[0]
            let initialViewTarget: string | null = null
            if (firstItem) {
                const itemData =
                    folders.find(
                        (f) =>
                            f.id === firstItem.id &&
                            firstItem.type === "folder",
                    ) ||
                    useDocStore
                        .getState()
                        .documents.find(
                            (d) =>
                                d.id === firstItem.id &&
                                firstItem.type === "document",
                        )

                if (itemData && firstItem.type === "folder") {
                    initialViewTarget = (itemData as Folder).parentId
                } else if (itemData && firstItem.type === "document") {
                    const parentFolder = folders.find((f) =>
                        f.documentIds?.includes(firstItem.id),
                    )
                    initialViewTarget = parentFolder ? parentFolder.id : null
                }

                if (initialViewTarget === undefined) initialViewTarget = null
            } else {
                initialViewTarget = null
            }

            setCurrentViewFolderId(initialViewTarget)
            setFolderPath(buildFolderPath(initialViewTarget))
            setIsLoading(false)
        } else {
            animateSheet(screenHeight, 250)
        }
    }, [isVisible, folders, selectedItemsToMove])

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
                    }).start(onClose)
                } else {
                    animateSheet(0, 200)
                }
            },
        }),
    ).current

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
        setCurrentViewFolderId(folderId)
        setFolderPath(buildFolderPath(folderId))

        setTimeout(() => setIsLoading(false), 50)
    }

    const folderItemsForList = useMemo((): ListItem[] => {
        const availableFolders = folders.filter((folder) => {
            const isInCurrentView = folder.parentId === currentViewFolderId
            const isBeingMoved = selectedItemsToMove.some(
                (item) => item.id === folder.id && item.type === "folder",
            )
            let isDescendantOfMoved = false
            const foldersBeingMovedIds = selectedItemsToMove
                .filter((item) => item.type === "folder")
                .map((item) => item.id)

            if (foldersBeingMovedIds.length > 0) {
                if (foldersBeingMovedIds.includes(folder.id)) {
                    isDescendantOfMoved = true
                } else {
                    let parentIdToCheck = folder.parentId
                    while (parentIdToCheck !== null && !isDescendantOfMoved) {
                        if (foldersBeingMovedIds.includes(parentIdToCheck)) {
                            isDescendantOfMoved = true
                        }
                        const parentFolder = folders.find(
                            (f) => f.id === parentIdToCheck,
                        )
                        parentIdToCheck = parentFolder
                            ? parentFolder.parentId
                            : null
                    }
                }
            }
            return isInCurrentView && !isBeingMoved && !isDescendantOfMoved
        })

        availableFolders.sort((a, b) => a.title.localeCompare(b.title))

        return availableFolders.map(
            (folder): ListItem => ({ type: "folder", data: folder }),
        )
    }, [folders, currentViewFolderId, selectedItemsToMove])

    const handleConfirmMove = () => {
        if (currentViewFolderId !== null) {
            onMove(currentViewFolderId)
        } else {
            console.warn(
                "Attempted to move items to root, but this should be disabled.",
            )
            Alert.alert(
                "Cannot Move to Root",
                "Items cannot be moved to the root directory. Please select a folder.",
            )
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
                    <View
                        style={styles.handleArea}
                        {...panResponder.panHandlers}
                    >
                        <View
                            style={[
                                styles.handleIndicator,
                                { backgroundColor: colors.border + "80" },
                            ]}
                        />
                    </View>

                    <Text
                        variant="md"
                        weight="bold"
                        style={[styles.title, { color: colors.text }]}
                    >
                        Move To Folder
                    </Text>
                    <Spacer size={5} />

                    <BreadcrumbNavigation
                        path={folderPath}
                        onNavigate={handleNavigate}
                    />
                    <Spacer size={10} />

                    {/* REMOVED: Selection Buttons (Select Root, Select Current Folder) */}
                    {/* <Row style={styles.selectionButtonRow}> ... </Row> */}
                    <Spacer size={16} />

                    <Text
                        variant="sm"
                        weight="medium"
                        style={[
                            styles.subheading,
                            { color: colors.secondaryText },
                        ]}
                    >
                        {/* Modified instruction text */}
                        Navigate to the desired destination folder:
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
                                isSelectionList={false}
                                onFolderPress={handleNavigate}
                                selectionMode={false}
                                selectedItems={[]}
                                emptyListMessage="No subfolders available here to move to"
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
                                disabled={
                                    currentViewFolderId === null || isLoading
                                }
                            />
                        </View>
                    </Row>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    keyboardAvoidingView: { flex: 1, justifyContent: "flex-end" },
    backdrop: { ...StyleSheet.absoluteFillObject },
    sheetContainer: {
        height: sheetHeight,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 15,
        paddingTop: 0,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 10,
        overflow: "hidden",
    },
    handleArea: {
        paddingTop: 10,
        paddingBottom: 10,
        alignItems: "center",
        width: "100%",
    },
    handleIndicator: {
        width: 50,
        height: 6,
        borderRadius: 3,
        alignSelf: "center",
    },
    title: { marginBottom: 5, textAlign: "center" },
    folderListContainer: {
        flex: 1,
        minHeight: 150,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        marginBottom: 10,
        marginHorizontal: -15,
    },
    subheading: { marginBottom: 8, paddingLeft: 4 },
    loadingIndicator: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    actionButtonRow: {
        marginTop: "auto",
        paddingTop: 10,
        paddingBottom: 10,
    },
    buttonContainer: { flex: 1, marginHorizontal: 5 },
})
