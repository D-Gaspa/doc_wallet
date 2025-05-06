import React, { useEffect, useMemo, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { Button } from "../../button"
import { IDocument } from "../../../../types/document.ts"
import { useTagContext } from "../../tag_functionality/TagContext.tsx"
import { TagList } from "../../tag_functionality/TagList.tsx"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFolderStore } from "../../../../store/useFolderStore.ts"
import { ListItem } from "../folders/types.ts"
import { ItemsList } from "../folders/ItemsList"
import { useTheme } from "../../../../hooks/useTheme.ts"
import { Row, Spacer } from "../../layout"
import {
    BreadcrumbItem,
    BreadcrumbNavigation,
} from "../folders/BreadcrumbNavigation"

interface Props {
    visible: boolean
    document: IDocument | null
    onClose: () => void
    onSave: (doc: IDocument, folderId: string, tagIds: string[]) => void
}

export const AddDocumentDetailsSheet = ({
    visible,
    document,
    onClose,
    onSave,
}: Props) => {
    const { colors } = useTheme()
    const tagContext = useTagContext()
    const allFolders = useFolderStore((s) => s.folders)
    const tags = tagContext?.tags
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
        null,
    )
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
    const [currentViewFolderId, setCurrentViewFolderId] = useState<
        string | null
    >(null)
    const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([])
    const [isLoading, setLoading] = useState(false)
    const [isNavigating, setIsNavigating] = useState(false)
    const [hasExpiration, setHasExpiration] = useState(false)
    const [expirationDate, setExpirationDate] = useState<string>("")
    const [notificationTimes, setNotificationTimes] = useState<number[]>([])

    const notificationChoices = [
        { label: "1 day before", value: 1 },
        { label: "3 days before", value: 3 },
        { label: "1 week before", value: 7 },
        { label: "2 weeks before", value: 14 },
        { label: "1 month before", value: 30 },
        { label: "2 months before", value: 60 },
    ]

    const toggleNotification = (val: number) => {
        setNotificationTimes((prev) =>
            prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
        )
    }

    // Reset state on visibility change or document change
    useEffect(() => {
        if (visible && document) {
            setSelectedFolderId(null)
            setSelectedTagIds([])
            setHasExpiration(false)
            setExpirationDate("")
            setNotificationTimes([])
            setCurrentViewFolderId(null)
            setFolderPath([])
            setLoading(false)
            setIsNavigating(false)
        } else if (!visible) {
            setCurrentViewFolderId(null)
            setFolderPath([])
        }
    }, [visible, document])

    // Path and Navigation Logic
    const buildFolderPath = (
        targetFolderId: string | null,
    ): BreadcrumbItem[] => {
        if (targetFolderId === null) return []

        const path: BreadcrumbItem[] = []
        let currentFolder = allFolders.find((f) => f.id === targetFolderId)

        while (currentFolder) {
            path.unshift({ id: currentFolder.id, title: currentFolder.title })
            currentFolder = allFolders.find(
                (f) => f.id === currentFolder?.parentId,
            )
        }
        return path
    }

    const handleNavigate = (folderId: string | null) => {
        if (folderId === currentViewFolderId || isNavigating) return
        setIsNavigating(true)
        setSelectedFolderId(null)

        setCurrentViewFolderId(folderId)
        setFolderPath(buildFolderPath(folderId))

        // Short delay to allow UI update before list re-renders
        setTimeout(() => setIsNavigating(false), 50)
    }

    // Tag Selection Logic
    const handleTagToggle = (tagId: string) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId)
                ? prev.filter((t) => t !== tagId)
                : [...prev, tagId],
        )
    }

    // Save Logic
    const handleSave = async () => {
        if (!document || selectedFolderId === null) {
            Alert.alert(
                "Missing Selection",
                "Please select a destination folder.",
            )
            return
        }

        if (hasExpiration && !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
            Alert.alert(
                "Invalid Date",
                "Please use YYYY-MM-DD format for the expiration date.",
            )
            return
        }

        setLoading(true)

        try {
            const updatedDoc = {
                ...document,
                parameters: [
                    ...(document.parameters || []),
                    ...(hasExpiration
                        ? [
                              {
                                  key: "expiration_date",
                                  value: expirationDate,
                                  id: "expiration_date",
                                  documentId: document.id,
                                  type: "date",
                                  isSearchable: true,
                                  isSystem: false,
                              },
                              {
                                  key: "expiration_notifications",
                                  value: JSON.stringify(notificationTimes),
                                  id: "expiration_notifications",
                                  documentId: document.id,
                                  type: "json",
                                  isSearchable: false,
                                  isSystem: false,
                              },
                          ]
                        : []),
                ],
            }
            onSave(updatedDoc, selectedFolderId, selectedTagIds)
        } catch (error) {
            console.error("Error in handleSave:", error)
            Alert.alert("Save Error", "Could not save document details.")
            setLoading(false)
        }
    }

    // Data Filtering for ItemsList
    const folderItemsForList = useMemo((): ListItem[] => {
        const childFolders = allFolders.filter(
            (folder) => folder.parentId === currentViewFolderId,
        )
        childFolders.sort((a, b) => a.title.localeCompare(b.title))

        return childFolders.map(
            (folder): ListItem => ({ type: "folder", data: folder }),
        )
    }, [allFolders, currentViewFolderId])

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView
                style={[styles.sheet, { backgroundColor: colors.background }]}
                edges={["bottom", "left", "right"]}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.kavContainer}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                >
                    {/* Header */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        Add Document Details
                    </Text>

                    {/* Folder Selection */}
                    <Text style={[styles.subtitle, { color: colors.text }]}>
                        Choose Destination Folder:
                    </Text>

                    {/* Breadcrumbs */}
                    <BreadcrumbNavigation
                        path={folderPath}
                        onNavigate={handleNavigate}
                    />

                    {/* Select Current Folder Button */}
                    <Row style={styles.selectionButtonRow}>
                        <Button
                            title="Select Root Folder"
                            variant="text"
                            onPress={() => setSelectedFolderId(null)}
                            style={styles.selectButton}
                            textStyle={
                                selectedFolderId === null
                                    ? styles.activeSelectButtonText
                                    : { color: colors.primary }
                            }
                        />
                        {currentViewFolderId !== null && (
                            <Button
                                title="Select Current Folder"
                                variant="text"
                                onPress={() =>
                                    setSelectedFolderId(currentViewFolderId)
                                }
                                style={styles.selectButton}
                                textStyle={
                                    selectedFolderId === currentViewFolderId
                                        ? styles.activeSelectButtonText
                                        : { color: colors.primary }
                                }
                            />
                        )}
                    </Row>
                    <Spacer size={8} />

                    {/* Folder List */}
                    <View
                        style={[
                            styles.listContainer,
                            { borderColor: colors.border },
                        ]}
                    >
                        {isNavigating ? (
                            <ActivityIndicator
                                style={styles.loadingIndicator}
                                color={colors.primary}
                            />
                        ) : (
                            <ItemsList
                                items={folderItemsForList}
                                onFolderPress={handleNavigate}
                                selectionMode={false}
                                selectedItems={[]}
                                emptyListMessage="No subfolders here"
                                testID="add-doc-folder-select-list"
                            />
                        )}
                    </View>

                    {/* Tag Selection */}
                    <Text style={[styles.subtitle, { color: colors.text }]}>
                        Select Tags (Optional):
                    </Text>
                    <TagList
                        tags={tags || []}
                        selectedTags={selectedTagIds}
                        onTagPress={handleTagToggle}
                        showAddTagButton={false}
                        horizontal={false}
                        testID="add-doc-tag-select-list"
                        size="default"
                    />

                    {/* Expiration Section */}
                    <View
                        style={[
                            styles.expirationContainer,
                            { borderColor: colors.border },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => setHasExpiration(!hasExpiration)}
                            style={styles.expirationToggle}
                        >
                            <Text style={styles.expirationToggleIcon}>
                                {hasExpiration ? "☑️" : "⬜️"}
                            </Text>
                            <Text style={{ color: colors.text }}>
                                This document has an expiration date
                            </Text>
                        </TouchableOpacity>
                        {hasExpiration && (
                            <View style={styles.expirationDetails}>
                                <Text
                                    style={[
                                        styles.subtitleSmall,
                                        { color: colors.text },
                                    ]}
                                >
                                    Expiration Date (YYYY-MM-DD):
                                </Text>
                                <TextInput
                                    style={[
                                        styles.expirationDateInput,
                                        {
                                            borderColor: colors.border,
                                            color: colors.text,
                                            backgroundColor: colors.card,
                                        },
                                    ]}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={colors.text + "99"}
                                    value={expirationDate}
                                    onChangeText={setExpirationDate}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />

                                <Text
                                    style={[
                                        styles.subtitleSmall,
                                        // eslint-disable-next-line react-native/no-inline-styles
                                        { color: colors.text, marginTop: 12 },
                                    ]}
                                >
                                    When do you want to be notified?
                                </Text>
                                <View style={styles.notifyContainer}>
                                    {notificationChoices.map((opt) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            onPress={() =>
                                                toggleNotification(opt.value)
                                            }
                                            style={styles.notifyItem}
                                        >
                                            <Text style={styles.notifyCheckbox}>
                                                {notificationTimes.includes(
                                                    opt.value,
                                                )
                                                    ? "☑️"
                                                    : "⬜️"}
                                            </Text>
                                            <Text
                                                style={{
                                                    color: colors.text,
                                                }}
                                            >
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    <Spacer size={16} />

                    {/* Action Buttons at the bottom */}
                    <View style={styles.buttonContainer}>
                        <Button
                            title="Save Document"
                            onPress={handleSave}
                            disabled={selectedFolderId === null || isLoading}
                            style={styles.saveBtn}
                            loading={isLoading}
                        />
                        <Button
                            title="Cancel"
                            variant="outline"
                            onPress={onClose}
                            disabled={isLoading}
                        />
                    </View>
                    {/* Spacer at the very bottom for padding */}
                    <Spacer size={10} />
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    sheet: {
        flex: 1,
    },
    kavContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 10,
        marginBottom: 8,
    },
    subtitleSmall: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
    },
    selectionButtonRow: {
        justifyContent: "flex-start",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 0,
    },
    selectButton: {
        width: "auto",
        paddingHorizontal: 10,
        paddingVertical: 4,
        minHeight: 0,
        borderWidth: 0,
    },
    activeSelectButtonText: {
        fontWeight: "bold",
    },
    listContainer: {
        flexGrow: 1,
        flexShrink: 1,
        minHeight: 120,
        maxHeight: 200,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 10,
        overflow: "hidden",
    },
    loadingIndicator: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    expirationContainer: {
        marginVertical: 10,
        paddingVertical: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    expirationToggle: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
    },
    expirationDetails: {
        marginTop: 16,
        paddingHorizontal: 10,
    },
    expirationToggleIcon: {
        fontSize: 22,
        marginRight: 8,
    },
    expirationDateInput: {
        borderWidth: 1,
        padding: 10,
        borderRadius: 8,
        marginTop: 6,
        height: 44,
    },
    notifyContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
    },
    notifyItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 16,
        marginBottom: 10,
    },
    notifyCheckbox: {
        fontSize: 18,
        marginRight: 5,
    },
    buttonContainer: {
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        // borderColor: "#e0e0e0",
    },
    saveBtn: {
        marginBottom: 12,
    },
})
