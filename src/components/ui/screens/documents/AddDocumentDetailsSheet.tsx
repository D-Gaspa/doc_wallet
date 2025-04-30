import React, { JSX, useEffect, useState } from "react"
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native"
import { Button } from "../../button"
import { IDocument } from "../../../../types/document.ts"
import { Tag, useTagContext } from "../../tag_functionality/TagContext.tsx"
import { TagList } from "../../tag_functionality/TagList.tsx"
import { useThemeContext } from "../../../../context/ThemeContext.tsx"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFolderStore } from "../../../../store/useFolderStore.ts"
import { Folder } from "../folders/types.ts"
import { FolderCard } from "../../cards"
import { LoadingOverlay } from "../../feedback/LoadingOverlay.tsx"
import { TouchableOpacity, TextInput, Alert } from "react-native"

interface Props {
    visible: boolean
    document: IDocument | null
    onClose: () => void
    onSave: (doc: IDocument, folderId: string, tagIds: string[]) => void
    folders: Folder[]
    setFolders: (folders: Folder[]) => void
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
    const { colors } = useThemeContext()
    const folders = useFolderStore((s) => s.folders)
    const [isLoading, setLoading] = useState(false)

    const [, setHydratedTags] = useState<Tag[]>([])

    const [hasExpiration, setHasExpiration] = useState(false)
    const [expirationDate, setExpirationDate] = useState<string>("")
    const [notificationTimes, setNotificationTimes] = useState<number[]>([]) // days before

    const notificationChoices = [
        { label: "1 day before", value: 1 },
        { label: "3 days before", value: 3 },
        { label: "1 week before", value: 7 },
        { label: "2 weeks before", value: 14 },
        { label: "1 month before", value: 30 },
        { label: "2 months before", value: 60 },
    ]

    // Notification toggle
    const toggleNotification = (val: number) => {
        setNotificationTimes((prev) =>
            prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
        )
    }

    useEffect(() => {
        if (!visible) {
            setSelectedFolderId(null)
            setSelectedTagIds([])
            setHasExpiration(false)
            setExpirationDate("")
            setNotificationTimes([])
        }
    }, [visible])

    useEffect(() => {
        if (document?.id) {
            const tags = tagContext.getTagsForItem(document.id, "document")
            console.log("📦 useEffect hydration:", tags)
            setHydratedTags(tags)
        }
    }, [tagContext.associations.length, document?.id])

    const renderFolderTree = (
        folders: Folder[],
        parentId: string | null = null,
        level: number = 0,
    ): JSX.Element[] => {
        return folders
            .filter((f) => f.parentId === parentId)
            .map((folder) => (
                <View key={folder.id} style={{ marginLeft: level * 16 }}>
                    <FolderCard
                        title={folder.title}
                        type={folder.type}
                        folderId={folder.id}
                        selected={selectedFolderId === folder.id}
                        onPress={() => setSelectedFolderId(folder.id)}
                        showAddTagButton={false}
                    />
                    {renderFolderTree(folders, folder.id, level + 1)}
                </View>
            ))
    }

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

    return (
        <Modal visible={visible} animationType="slide">
            <SafeAreaView
                style={[styles.sheet, { backgroundColor: colors.background }]}
            >
                {/* eslint-disable-next-line react-native/no-inline-styles */}
                <ScrollView style={{ flex: 1 }}>
                    <View>
                        <Text style={[styles.title, { color: colors.text }]}>
                            Add Document Details
                        </Text>

                        <Text style={[styles.subtitle, { color: colors.text }]}>
                            Choose a Folder:
                        </Text>
                        <View style={styles.folderTreeContainer}>
                            {renderFolderTree(folders)}
                        </View>
                        {/* Tag List */}
                        <Text style={[styles.subtitle, { color: colors.text }]}>
                            Select Tags:
                        </Text>

                        <TagList
                            tags={tags}
                            selectedTags={selectedTagIds}
                            onTagPress={handleTagToggle}
                            showAddTagButton={false}
                        />

                        <View style={styles.expirationContainer}>
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
                                        placeholderTextColor={
                                            colors.text + "99"
                                        }
                                        value={expirationDate}
                                        onChangeText={setExpirationDate}
                                        keyboardType="numeric"
                                    />

                                    {}
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
                                                    toggleNotification(
                                                        opt.value,
                                                    )
                                                }
                                                style={styles.notifyItem}
                                            >
                                                <Text
                                                    style={
                                                        styles.notifyCheckbox
                                                    }
                                                >
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

                        {/* Save Button */}
                        <Button
                            title="Save Document"
                            onPress={handleSave}
                            style={styles.saveBtn}
                        />
                        <Button title="Cancel" onPress={onClose} />
                    </View>
                </ScrollView>

                <LoadingOverlay visible={isLoading} />
            </SafeAreaView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    sheet: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 16,
    },
    saveBtn: {
        marginTop: 24,
        marginBottom: 12,
    },
    folderTreeContainer: {
        marginTop: 8,
    },
    expirationContainer: {
        marginVertical: 16,
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
        padding: 8,
        borderRadius: 8,
        marginTop: 6,
    },
    notifyContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    notifyItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 12,
        marginBottom: 8,
    },
    notifyCheckbox: {
        fontSize: 18,
        marginRight: 3,
    },
})
