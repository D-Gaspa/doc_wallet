import React, { useEffect, useState, JSX } from "react"
import { View, Text, StyleSheet } from "react-native"
import { Modal } from "react-native"
import { Button } from "../../button"
import { IDocument } from "../../../../types/document.ts"
import { useDocStore } from "../../../../store"
import {
    Tag,
    TagAssociation,
    useTagContext,
} from "../../tag_functionality/TagContext.tsx"
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
    onSave: (doc: IDocument) => void
    folders: Folder[]
    setFolders: (folders: Folder[]) => void
}

export const AddDocumentDetailsSheet = ({
    visible,
    document,
    onClose,
    onSave,
}: Props) => {
    const docStore = useDocStore((state) => state)
    const tagContext = useTagContext()
    const tags = tagContext?.tags
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
        null,
    )
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
    const { colors } = useThemeContext()
    const folders = useFolderStore((s) => s.folders)
    const setFolders = useFolderStore((s) => s.setFolders)
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
    {
        /*
    const handleSave = async () => {
        if (!document || !selectedFolderId) return

        setLoading(true)

        try {
            console.log("📝 Saving document")
            console.log("Saving document with tags:", selectedTagIds)
            console.log("Saving document to folder:", selectedFolderId)

            // Step 1: First update the document in the store with tags
            const updatedDoc = await docStore.updateDocument(document.id, {
                ...document,
                tags: selectedTagIds,
            })

            if (!updatedDoc) {
                throw new Error("Failed to retrieve updated document")
            }

            // Step 2: Directly update tag associations (skip syncTagsForItem to avoid stale reads)
            tagContext.setAssociations((prev: TagAssociation[]) => {
                const filtered = prev.filter(
                    (a) => !(a.itemId === document.id && a.itemType === "document")
                )

                const newOnes: TagAssociation[] = selectedTagIds.map((tagId) => ({
                    tagId,
                    itemId: document.id,
                    itemType: "document",
                    createdAt: new Date(),
                }))

                return [...filtered, ...newOnes]
            })


            // Step 2.5: Hydrate after associations are flushed
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    const hydratedTags = tagContext.getTagsForItem(document.id, "document")
                    console.log("✅ Hydrated tags after direct set:", hydratedTags)
                    resolve()
                }, 50) // or tweak if needed
            })


            // Step 3: Update folder association
            setFolders(
                folders.map((folder) =>
                    folder.id === selectedFolderId
                        ? {
                            ...folder,
                            documentIds: [
                                ...new Set([
                                    ...(folder.documentIds || []),
                                    document.id,
                                ]),
                            ],
                        }
                        : folder,
                ),
            )

            // Step 4: Notify parent component and close sheet
            onSave(updatedDoc)
            onClose()
        } catch (error) {
            console.error("Error saving document details", error)
        } finally {
            setLoading(false)
        }
    }
*/
    }
    const handleSave = async () => {
        if (!document || !selectedFolderId) return

        setLoading(true)

        try {
            console.log("📝 Saving document")
            console.log("📂 Folder selected:", selectedFolderId)
            console.log("🏷️ Selected tags:", selectedTagIds)

            // Step 1: Update the document in the docStore
            const updatedDoc = await docStore.updateDocument(document.id, {
                ...document,
                tags: selectedTagIds,
            })

            if (!updatedDoc) {
                throw new Error("❌ Failed to update or retrieve document")
            }

            const newAssociations: TagAssociation[] = selectedTagIds.map(
                (tagId) => ({
                    tagId,
                    itemId: document.id,
                    itemType: "document",
                    createdAt: new Date(),
                }),
            )

            console.log("🔁 New tag associations being saved:", newAssociations)

            // Step 3: Replace associations for this document
            tagContext.setAssociations((prev) => [
                ...prev.filter(
                    (a) =>
                        !(
                            a.itemId === document.id &&
                            a.itemType === "document"
                        ),
                ),
                ...newAssociations,
            ])

            // Step 5: Update folder association
            setFolders(
                folders.map((folder) =>
                    folder.id === selectedFolderId
                        ? {
                              ...folder,
                              documentIds: [
                                  ...new Set([
                                      ...(folder.documentIds || []),
                                      document.id,
                                  ]),
                              ],
                          }
                        : folder,
                ),
            )

            // Step 6: Notify parent and close
            onSave(updatedDoc)
            onClose()
        } catch (error) {
            console.error("❌ Error in handleSave:", error)
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
                    <Text style={styles.title}>Add Document Details</Text>

                    {/* Folder List */}
                    <Text style={styles.subtitle}>Choose a Folder:</Text>
                    {/* eslint-disable-next-line react-native/no-inline-styles */}
                    <View style={{ marginTop: 8 }}>
                        {renderFolderTree(folders)}
                    </View>

                    {/* Tag List */}
                    <Text style={styles.subtitle}>Select Tags:</Text>

                    <TagList
                        tags={tags}
                        selectedTags={selectedTagIds}
                        onTagPress={handleTagToggle}
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
