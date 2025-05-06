import React, { JSX, useEffect, useState } from "react"
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    Alert as RNAlert,
} from "react-native"
import { Button } from "../../button"
import { useTagContext } from "../../tag_functionality/TagContext.tsx"
import { TagList } from "../../tag_functionality/TagList.tsx"
import { SafeAreaView } from "react-native-safe-area-context"
import { FolderCard } from "../../cards"
import { useTheme } from "../../../../hooks/useTheme.ts"
import { Folder } from "../folders/types.ts"

interface CommonDetails {
    folderId: string
    tagIds: string[]
    expirationDate?: string
    notificationTimes?: number[]
}

// 2. Update Props Interface
interface Props {
    visible: boolean
    onClose: () => void
    onSave: (details: CommonDetails) => void
    folders: Folder[]
    setFolders?: (folders: Folder[]) => void
}

export const AddDocumentDetailsSheet = ({
    visible,
    onClose,
    onSave,
    folders,
}: Props) => {
    const tagContext = useTagContext()
    const allTags = tagContext?.tags ?? []
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
        null,
    )
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
    const { colors } = useTheme()
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

    // Reset local state when visibility changes
    useEffect(() => {
        if (!visible) {
            setSelectedFolderId(null)
            setSelectedTagIds([])
            setHasExpiration(false)
            setExpirationDate("")
            setNotificationTimes([])
            // setLoading(false); // REMOVED
        }
    }, [visible])

    const renderFolderTree = (
        foldersToRender: Folder[],
        parentId: string | null = null,
        level: number = 0,
    ): JSX.Element[] => {
        return foldersToRender
            .filter((f) => f.parentId === parentId)
            .map((folder) => (
                <View key={folder.id} style={{ marginLeft: level * 16 }}>
                    <FolderCard
                        title={folder.title}
                        type={folder.type}
                        folderId={folder.id}
                        selected={selectedFolderId === folder.id}
                        onPress={() => setSelectedFolderId(folder.id)}
                        onToggleFavorite={function (): void {
                            throw new Error("Function not implemented.")
                        }}
                    />
                    {renderFolderTree(foldersToRender, folder.id, level + 1)}
                </View>
            ))
    }

    // handleTagToggle remains the same
    const handleTagToggle = (tagId: string) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId)
                ? prev.filter((t) => t !== tagId)
                : [...prev, tagId],
        )
    }

    // 5. Modify handleSave
    const handleSave = () => {
        // Removed async
        // Check only for selectedFolderId (document is gone)
        if (!selectedFolderId) {
            RNAlert.alert("Folder required", "Please select a folder.")
            return
        }

        if (hasExpiration && !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
            RNAlert.alert("Invalid date", "Please use YYYY-MM-DD format.")
            return
        }

        // setLoading(true); // REMOVED

        // Construct the details object from local state
        const details: CommonDetails = {
            folderId: selectedFolderId,
            tagIds: selectedTagIds,
            expirationDate: hasExpiration ? expirationDate : undefined,
            notificationTimes: hasExpiration ? notificationTimes : undefined,
        }

        onSave(details)
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
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
                            Choose a Folder (Required):
                        </Text>
                        <View style={styles.folderTreeContainer}>
                            {renderFolderTree(folders)}
                        </View>

                        <Text style={[styles.subtitle, { color: colors.text }]}>
                            Select Tags (Optional):
                        </Text>
                        <TagList
                            tags={allTags}
                            selectedTags={selectedTagIds}
                            onTagPress={handleTagToggle}
                            showAddTagButton={false}
                        />

                        {/* Expiration Section */}
                        <View style={styles.expirationContainer}>
                            <TouchableOpacity
                                onPress={() => setHasExpiration(!hasExpiration)}
                                style={styles.expirationToggle}
                            >
                                <Text style={styles.expirationToggleIcon}>
                                    {hasExpiration ? "☑️" : "⬜️"}
                                </Text>
                                <Text style={{ color: colors.text }}>
                                    Set expiration date for documents
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
                                    {/* eslint-disable-next-line react-native/no-inline-styles */}
                                    <Text
                                        style={[
                                            styles.subtitle,
                                            {
                                                color: colors.text,
                                                marginTop: 12,
                                            },
                                        ]}
                                    >
                                        Notify:
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

                        {/* Save Button calls modified handleSave */}
                        <Button
                            title="Save Documents"
                            onPress={handleSave}
                            style={styles.saveBtn}
                            disabled={!selectedFolderId}
                        />
                        <Button title="Cancel" onPress={onClose} />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    )
}

// Styles remain the same as the previous multi-doc version
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
