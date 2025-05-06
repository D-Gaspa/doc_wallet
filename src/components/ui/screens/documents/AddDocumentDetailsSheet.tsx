import React, { useEffect, useMemo, useState } from "react"
import DateTimePicker from "@react-native-community/datetimepicker"
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
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
    const [showDatePicker, setShowDatePicker] = useState(false)

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
        if (visible) {
            setSelectedFolderId(null)
            setCurrentViewFolderId(null)
            setFolderPath([])
            setSelectedTagIds([])
            setHasExpiration(false)
            setExpirationDate("")
            setNotificationTimes([])
            setLoading(false)
            setIsNavigating(false)
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
        setSelectedFolderId(null)
        setIsNavigating(true)
        setCurrentViewFolderId(folderId)
        setFolderPath(buildFolderPath(folderId))

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
        if (!document) {
            Alert.alert("Error", "Document data is missing.")
            return
        }
        if (selectedFolderId === null && currentViewFolderId !== null) {
            Alert.alert("Confirm Root", "Save document to the Root folder?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Save to Root",
                    onPress: () =>
                        proceedWithSave(document, null, selectedTagIds),
                },
            ])
        } else if (selectedFolderId !== null) {
            const folderName =
                allFolders.find((f) => f.id === selectedFolderId)?.title ||
                "this folder"
            Alert.alert("Confirm Folder", `Save document to "${folderName}"?`, [
                { text: "Cancel", style: "cancel" },
                {
                    text: `Save to ${folderName}`,
                    onPress: () =>
                        proceedWithSave(
                            document,
                            selectedFolderId,
                            selectedTagIds,
                        ),
                },
            ])
        } else if (currentViewFolderId === null) {
            await proceedWithSave(document, null, selectedTagIds)
        } else {
            Alert.alert(
                "Selection Error",
                "Please select a destination folder (Root or Current).",
            )
        }
    }

    const proceedWithSave = async (
        docToSave: IDocument,
        targetFolderId: string | null,
        tagIds: string[],
    ) => {
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
                ...docToSave,
                parameters: [
                    ...(docToSave.parameters || []).filter(
                        (p) =>
                            p.key !== "expiration_date" &&
                            p.key !== "expiration_notifications",
                    ),
                    ...(hasExpiration
                        ? [
                              {
                                  key: "expiration_date",
                                  value: expirationDate,
                                  id: `exp_date_${docToSave.id}`,
                                  documentId: docToSave.id,
                                  type: "date",
                                  isSearchable: true,
                                  isSystem: false,
                              },
                              {
                                  key: "expiration_notifications",
                                  value: JSON.stringify(notificationTimes),
                                  id: `exp_notify_${docToSave.id}`,
                                  documentId: docToSave.id,
                                  type: "json",
                                  isSearchable: false,
                                  isSystem: false,
                              },
                          ]
                        : []),
                ],
            }
            onSave(
                updatedDoc,
                targetFolderId === null ? "root" : targetFolderId,
                tagIds,
            )
        } catch (error) {
            console.error("Error in proceedWithSave:", error)
            Alert.alert("Save Error", "Could not save document details.")
        } finally {
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

    const getSelectButtonStyle = (isRootButton: boolean): ViewStyle[] => {
        const isActive = isRootButton
            ? selectedFolderId === null
            : selectedFolderId === currentViewFolderId

        const stylesArray: ViewStyle[] = [styles.selectButton]
        if (isActive) {
            stylesArray.push({
                backgroundColor: colors.primary + "35",
                borderColor: colors.primary,
            })
        }
        return stylesArray
    }

    const renderDatePicker = () => {
        if (Platform.OS === "ios") {
            return (
                <Modal
                    visible={showDatePicker}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowDatePicker(false)}
                >
                    <View style={styles.iosPickerOverlay}>
                        <View style={styles.iosPickerContainer}>
                            <DateTimePicker
                                value={
                                    expirationDate
                                        ? new Date(expirationDate)
                                        : new Date()
                                }
                                mode="date"
                                display="spinner"
                                onChange={(_event, selectedDate) => {
                                    if (selectedDate) {
                                        const year = selectedDate.getFullYear()
                                        const month = String(
                                            selectedDate.getMonth() + 1,
                                        ).padStart(2, "0")
                                        const day = String(
                                            selectedDate.getDate(),
                                        ).padStart(2, "0")
                                        setExpirationDate(
                                            `${year}-${month}-${day}`,
                                        )
                                    }
                                }}
                            />
                            <Button
                                title="Done"
                                onPress={() => setShowDatePicker(false)}
                            />
                        </View>
                    </View>
                </Modal>
            )
        }

        // For Android, just return the inline picker
        return (
            showDatePicker && (
                <DateTimePicker
                    value={
                        expirationDate ? new Date(expirationDate) : new Date()
                    }
                    mode="date"
                    display="default"
                    onChange={(_event, selectedDate) => {
                        setShowDatePicker(false)
                        if (selectedDate) {
                            const year = selectedDate.getFullYear()
                            const month = String(
                                selectedDate.getMonth() + 1,
                            ).padStart(2, "0")
                            const day = String(selectedDate.getDate()).padStart(
                                2,
                                "0",
                            )
                            setExpirationDate(`${year}-${month}-${day}`)
                        }
                    }}
                />
            )
        )
    }

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
                            style={getSelectButtonStyle(true)}
                            textStyle={
                                selectedFolderId === null
                                    ? // eslint-disable-next-line react-native/no-inline-styles
                                      {
                                          color: colors.primary,
                                          fontWeight: "bold",
                                      }
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
                                style={getSelectButtonStyle(false)}
                                textStyle={
                                    selectedFolderId === currentViewFolderId
                                        ? // eslint-disable-next-line react-native/no-inline-styles
                                          {
                                              color: colors.primary,
                                              fontWeight: "bold",
                                          }
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
                            {
                                borderTopColor: colors.border,
                                borderBottomColor: colors.border,
                            },
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
                    <Text
                        style={[
                            styles.subtitle,
                            // eslint-disable-next-line react-native/no-inline-styles
                            { color: colors.text, marginTop: 15 },
                        ]}
                    >
                        Select Tags (Optional):
                    </Text>
                    <TagList
                        tags={tags || []}
                        selectedTags={selectedTagIds}
                        onTagPress={handleTagToggle}
                        showAddTagButton={false}
                        horizontal={true}
                        testID="add-doc-tag-select-list"
                        size="small"
                    />

                    {/* Expiration Section */}
                    <View
                        style={[
                            styles.expirationContainer,
                            {
                                borderTopColor: colors.border,
                                borderBottomColor: colors.border,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => setHasExpiration(!hasExpiration)}
                            style={styles.expirationToggle}
                        >
                            <View
                                style={[
                                    styles.checkboxPlaceholder,
                                    { borderColor: colors.border },
                                ]}
                            >
                                {hasExpiration && (
                                    <Text
                                        style={
                                            /* eslint-disable-next-line react-native/no-inline-styles */
                                            {
                                                fontSize: 14,
                                                fontWeight: "bold",
                                                color: colors.primary,
                                            }
                                        }
                                    >
                                        ✓
                                    </Text>
                                )}
                            </View>
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
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={[
                                        styles.expirationDateInput,
                                        // eslint-disable-next-line react-native/no-inline-styles
                                        {
                                            borderColor: colors.border,
                                            backgroundColor: colors.card,
                                            justifyContent: "center",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={{
                                            color: expirationDate
                                                ? colors.text
                                                : colors.text + "99",
                                        }}
                                    >
                                        {expirationDate || "Select date"}
                                    </Text>
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={
                                            expirationDate
                                                ? new Date(expirationDate)
                                                : new Date()
                                        }
                                        mode="date"
                                        display={
                                            Platform.OS === "ios"
                                                ? "spinner"
                                                : "default"
                                        }
                                        onChange={(
                                            _event: unknown,
                                            selectedDate: Date | undefined,
                                        ) => {
                                            setShowDatePicker(false)
                                            if (selectedDate) {
                                                const year =
                                                    selectedDate.getFullYear()
                                                const month = String(
                                                    selectedDate.getMonth() + 1,
                                                ).padStart(2, "0")
                                                const day = String(
                                                    selectedDate.getDate(),
                                                ).padStart(2, "0")
                                                setExpirationDate(
                                                    `${year}-${month}-${day}`,
                                                )
                                            }
                                        }}
                                    />
                                )}

                                {renderDatePicker()}

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
                                            <View
                                                style={[
                                                    styles.checkboxPlaceholder,
                                                    {
                                                        borderColor:
                                                            colors.border,
                                                    },
                                                ]}
                                            >
                                                {notificationTimes.includes(
                                                    opt.value,
                                                ) && (
                                                    <Text
                                                        /* eslint-disable-next-line react-native/no-inline-styles */
                                                        style={{
                                                            fontSize: 14,
                                                            fontWeight: "bold",
                                                            color: colors.primary,
                                                        }}
                                                    >
                                                        ✓
                                                    </Text>
                                                )}
                                            </View>
                                            <Text
                                                style={{ color: colors.text }}
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
                            disabled={isLoading}
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
    // eslint-disable-next-line react-native/no-color-literals
    selectButton: {
        width: "auto",
        paddingHorizontal: 12,
        paddingVertical: 6,
        minHeight: 0,
        borderWidth: 1.5,
        borderRadius: 16,
        backgroundColor: "transparent",
        borderColor: "transparent",
    },
    listContainer: {
        flexGrow: 1,
        flexShrink: 1,
        minHeight: 100,
        maxHeight: 250,

        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,

        marginBottom: 10,
        overflow: "hidden",
        marginHorizontal: -20,
    },
    loadingIndicator: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
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
        paddingHorizontal: 5,
        paddingVertical: 5,
    },
    checkboxPlaceholder: {
        width: 20,
        height: 20,
        borderWidth: 1.5,
        borderRadius: 4,
        marginRight: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    expirationDetails: {
        marginTop: 16,
        paddingHorizontal: 5,
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

    buttonContainer: {
        paddingTop: 10,
    },
    saveBtn: {
        marginBottom: 12,
    },
    // eslint-disable-next-line react-native/no-color-literals
    iosPickerOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    iosPickerContainer: {
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
})
