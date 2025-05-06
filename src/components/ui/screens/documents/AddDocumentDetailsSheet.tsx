import React, { useEffect, useMemo, useState } from "react"
import {
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
import { Tag, useTagContext } from "../../tag_functionality/TagContext.tsx"
import { TagList } from "../../tag_functionality/TagList.tsx"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFolderStore } from "../../../../store/useFolderStore.ts"
import { ListItem } from "../folders/types.ts"
import { ItemsList } from "../folders/ItemsList"
import { LoadingOverlay } from "../../feedback/LoadingOverlay.tsx"
import { useTheme } from "../../../../hooks/useTheme.ts"
import { Spacer } from "../../layout"

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
    const tagContext = useTagContext()
    const tags = tagContext?.tags
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
        null,
    )
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
    const { colors } = useTheme()
    const allFolders = useFolderStore((s) => s.folders)
    const [isLoading, setLoading] = useState(false)
    const [, setHydratedTags] = useState<Tag[]>([])
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

    // Reset state on visibility change
    useEffect(() => {
        if (!visible) {
            setSelectedFolderId(null)
            setSelectedTagIds([])
            setHasExpiration(false)
            setExpirationDate("")
            setNotificationTimes([])
        }
    }, [visible])

    // Optional: Keep tag hydration if needed
    useEffect(() => {
        if (document?.id) {
            const docTags = tagContext.getTagsForItem(document.id, "document")
            console.log("📦 AddDocumentDetailsSheet: Hydrating tags", docTags)
            setHydratedTags(docTags)
        }
    }, [tagContext.associations.length, document?.id, visible])

    const handleTagToggle = (tagId: string) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId)
                ? prev.filter((t) => t !== tagId)
                : [...prev, tagId],
        )
    }
    const handleSave = async () => {
        if (!document || !selectedFolderId) return

        if (hasExpiration && !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
            Alert.alert(
                "Invalid date",
                "Please use YYYY-MM-DD format for the expiration date.",
            )
            return
        }

        setLoading(true)

        try {
            // Pass the relevant data to the parent component
            //onSave(document, selectedFolderId, selectedTagIds)
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
        } finally {
            setLoading(false)
        }
    }

    const folderItems = useMemo(() => {
        const sortedFolders = [...allFolders].sort((a, b) =>
            a.title.localeCompare(b.title),
        )
        return sortedFolders.map(
            (folder): ListItem => ({ type: "folder", data: folder }),
        )
    }, [allFolders])

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView
                style={[styles.sheet, { backgroundColor: colors.background }]}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.kavContainer}
                >
                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        Add Document Details
                    </Text>

                    {/* Folder Selection */}
                    <Text style={[styles.subtitle, { color: colors.text }]}>
                        Choose a Folder:
                    </Text>
                    <View
                        style={[
                            styles.listContainer,
                            { borderColor: colors.border },
                        ]}
                    >
                        <ItemsList
                            items={folderItems}
                            isSelectionList={true}
                            selectedItemId={selectedFolderId}
                            onSelectItem={(id) => setSelectedFolderId(id)}
                            selectionMode={false}
                            selectedFolderIds={[]}
                            emptyListMessage="No folders available."
                            testID="add-doc-folder-select-list"
                        />
                    </View>

                    {/* Tag Selection */}
                    <Text style={[styles.subtitle, { color: colors.text }]}>
                        Select Tags:
                    </Text>
                    <TagList
                        tags={tags}
                        selectedTags={selectedTagIds}
                        onTagPress={handleTagToggle}
                        showAddTagButton={false}
                        horizontal={false}
                        testID="add-doc-tag-select-list"
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
                            // eslint-disable-next-line react-native/no-inline-styles
                            <View style={{ marginTop: 16 }}>
                                <Text
                                    style={[
                                        styles.subtitle,
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
                                />

                                <Text
                                    style={[
                                        styles.subtitle,
                                        // eslint-disable-next-line react-native/no-inline-styles
                                        {
                                            color: colors.text,
                                            marginTop: 12,
                                        },
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
                            disabled={!selectedFolderId || isLoading}
                            style={styles.saveBtn}
                            loading={isLoading}
                        />
                        <Button
                            title="Cancel"
                            variant="outline"
                            onPress={onClose}
                        />
                    </View>
                    {/* Spacer at the very bottom for padding */}
                    <Spacer size={10} />
                </KeyboardAvoidingView>
                <LoadingOverlay visible={isLoading && !visible} />
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
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 15,
        marginBottom: 15,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 10,
        marginBottom: 8,
    },
    listContainer: {
        flex: 1,
        minHeight: 150,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 10,
    },
    expirationContainer: {
        marginVertical: 10,
        padding: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    expirationToggle: {
        flexDirection: "row",
        alignItems: "center",
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
        marginTop: "auto",
        paddingTop: 10,
    },
    saveBtn: {
        marginBottom: 12,
    },
})
