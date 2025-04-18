import React, { useState, useEffect } from "react"
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ScrollView,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { BaseModal } from "../../../common/modal"
import { Text } from "../../typography"
import { Button } from "../../button"
import { Folder } from "./types"
import { FolderCard } from "../../cards"

interface FolderMoveModalProps {
    isVisible: boolean
    onClose: () => void
    folders: Folder[]
    selectedFolderIds: string[]
    currentFolderId: string | null
    onMove: (targetFolderId: string | null) => void
}

export function FolderMoveModal({
    isVisible,
    onClose,
    folders,
    selectedFolderIds,
    currentFolderId,
    onMove,
}: FolderMoveModalProps) {
    const { colors } = useTheme()
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(
        null,
    )
    const [folderPath, setFolderPath] = useState<Folder[]>([])
    const [currentViewFolderId, setCurrentViewFolderId] = useState<
        string | null
    >(null)

    // Reset state when modal opens
    useEffect(() => {
        if (isVisible) {
            setSelectedTargetId(null)
            setCurrentViewFolderId(null)
            setFolderPath([])
        }
    }, [isVisible])

    // Handle navigation within the folders
    const navigateToFolder = (folderId: string | null) => {
        if (folderId === null) {
            // Navigate to root
            setCurrentViewFolderId(null)
            setFolderPath([])
        } else {
            // Navigate to specific folder
            const folder = folders.find((f) => f.id === folderId)
            if (folder) {
                setCurrentViewFolderId(folderId)

                // Build path
                const buildPath = (
                    id: string | null,
                    path: Folder[] = [],
                ): Folder[] => {
                    if (id === null) return path

                    const folder = folders.find((f) => f.id === id)
                    if (!folder) return path

                    return buildPath(folder.parentId, [folder, ...path])
                }

                setFolderPath(buildPath(folderId))
            }
        }
    }

    // Get folders for current view
    const getCurrentFolders = () => {
        // Filter out folders that are being moved
        return folders.filter(
            (folder) =>
                folder.parentId === currentViewFolderId &&
                !selectedFolderIds.includes(folder.id) &&
                folder.id !== currentFolderId,
        )
    }

    // Render folder item
    const renderFolderItem = ({ item }: { item: Folder }) => (
        <TouchableOpacity
            onPress={() => navigateToFolder(item.id)}
            style={styles.folderItem}
        >
            <FolderCard
                title={item.title}
                type={item.type || "custom"}
                onPress={() => handleFolderSelect(item.id)}
                testID={`target-folder-${item.id}`}
                selected={selectedTargetId === item.id}
                folderId={item.id}
            />
        </TouchableOpacity>
    )

    // Handle folder selection
    const handleFolderSelect = (folderId: string | null) => {
        setSelectedTargetId(folderId === selectedTargetId ? null : folderId)
    }

    // Handle move action
    const handleMove = () => {
        onMove(selectedTargetId)
        onClose()
    }

    return (
        <BaseModal isVisible={isVisible} onClose={onClose}>
            <View style={styles.container}>
                <Text variant="md" weight="bold" style={styles.title}>
                    Move Folders
                </Text>

                {/* Breadcrumb path */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.breadcrumbs}
                >
                    <TouchableOpacity
                        style={styles.breadcrumbItem}
                        onPress={() => navigateToFolder(null)}
                    >
                        <Text
                            variant="sm"
                            weight={
                                currentViewFolderId === null
                                    ? "bold"
                                    : "regular"
                            }
                        >
                            Root
                        </Text>
                    </TouchableOpacity>

                    {folderPath.map((folder) => (
                        <View key={folder.id} style={styles.breadcrumbRow}>
                            <Text variant="sm">/</Text>
                            <TouchableOpacity
                                style={styles.breadcrumbItem}
                                onPress={() => navigateToFolder(folder.id)}
                            >
                                <Text
                                    variant="sm"
                                    weight={
                                        currentViewFolderId === folder.id
                                            ? "bold"
                                            : "regular"
                                    }
                                >
                                    {folder.title}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                {/* Selection options */}
                <View
                    style={[
                        styles.selectionOptions,
                        { borderColor: colors.border },
                    ]}
                >
                    <TouchableOpacity
                        style={[
                            styles.rootOption,
                            selectedTargetId === null &&
                                true &&
                                styles.selectedOption,
                            { borderColor: colors.primary },
                        ]}
                        onPress={() => handleFolderSelect(null)}
                    >
                        <Text>Move to Root</Text>
                    </TouchableOpacity>

                    {currentViewFolderId !== null && (
                        <TouchableOpacity
                            style={[
                                styles.currentOption,
                                selectedTargetId === currentViewFolderId &&
                                    styles.selectedOption,
                                { borderColor: colors.primary },
                            ]}
                            onPress={() =>
                                handleFolderSelect(currentViewFolderId)
                            }
                        >
                            <Text>Move Here</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Folder list */}
                <View style={styles.folderListContainer}>
                    <Text
                        variant="sm"
                        weight="medium"
                        style={styles.subheading}
                    >
                        Select destination folder:
                    </Text>

                    <FlatList
                        data={getCurrentFolders()}
                        renderItem={renderFolderItem}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={{ color: colors.secondaryText }}>
                                    No folders available at this location
                                </Text>
                            </View>
                        }
                    />
                </View>

                {/* Action buttons */}
                <View style={styles.actionButtons}>
                    <View style={styles.buttonContainer}>
                        <Button title="Cancel" onPress={onClose} />
                    </View>
                    <View style={styles.buttonContainer}>
                        <Button
                            title="Move"
                            onPress={handleMove}
                            style={
                                selectedTargetId === undefined
                                    ? styles.disabledButton
                                    : {}
                            }
                        />
                    </View>
                </View>
            </View>
        </BaseModal>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        maxHeight: "80%",
    },
    title: {
        marginBottom: 16,
        textAlign: "center",
    },
    breadcrumbs: {
        flexDirection: "row",
        marginBottom: 12,
    },
    breadcrumbRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    breadcrumbItem: {
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    selectionOptions: {
        flexDirection: "row",
        marginBottom: 16,
        padding: 8,
        borderWidth: 1,
        borderRadius: 8,
    },
    rootOption: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
        alignItems: "center",
        borderWidth: 1,
    },
    currentOption: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
        alignItems: "center",
        borderWidth: 1,
    },
    selectedOption: {
        borderWidth: 1,
    },
    folderListContainer: {
        flex: 1,
        maxHeight: 300,
    },
    subheading: {
        marginBottom: 8,
    },
    folderItem: {
        marginBottom: 4,
    },
    emptyContainer: {
        padding: 20,
        alignItems: "center",
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 16,
    },
    buttonContainer: {
        flex: 0.48,
    },
    disabledButton: {
        opacity: 0.5,
    },
})
