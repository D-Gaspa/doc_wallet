import React, { JSX, useEffect, useState } from "react"
import { Modal, StyleSheet, Text, View } from "react-native"
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

    useEffect(() => {
        if (!visible) {
            setSelectedFolderId(null)
            setSelectedTagIds([])
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

        setLoading(true)

        try {
            // Pass the relevant data to the parent component
            onSave(document, selectedFolderId, selectedTagIds)
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
                <View>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Add Document Details
                    </Text>

                    <Text style={[styles.subtitle, { color: colors.text }]}>
                        Choose a Folder:
                    </Text>
                    {/* eslint-disable-next-line react-native/no-inline-styles */}
                    <View style={{ marginTop: 8 }}>
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

                    {/* Save Button */}
                    <Button
                        title="Save Document"
                        onPress={handleSave}
                        style={styles.saveBtn}
                    />
                    <Button title="Cancel" onPress={onClose} />
                </View>
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
})
