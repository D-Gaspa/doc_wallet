import React, { JSX, useEffect, useState } from "react"
import { View, Text, StyleSheet, Modal } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button } from "../../button"
import { FolderCard } from "../../cards"
import { TagList } from "../../tag_functionality/TagList"
import { useThemeContext } from "../../../../context/ThemeContext"
import { useTagContext } from "../../tag_functionality/TagContext"
import { useFolderStore } from "../../../../store/useFolderStore.ts"
import { Folder } from "../folders/types"
import { LoadingOverlay } from "../../feedback/LoadingOverlay"

interface Props {
    visible: boolean
    onClose: () => void
    onComplete: (data: {
        selectedFolderId: string
        selectedTagIds: string[]
    }) => void
}

export const DocumentDetailsSheet = ({
    visible,
    onClose,
    onComplete,
}: Props) => {
    const { colors } = useThemeContext()
    const { tags } = useTagContext()
    const folders = useFolderStore((s) => s.folders)
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
        null,
    )
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
    const [isLoading] = useState(false)

    useEffect(() => {
        if (!visible) {
            setSelectedFolderId(null)
            setSelectedTagIds([])
        }
    }, [visible])

    const renderFolderTree = (
        folders: Folder[],
        parentId: string | null = null,
        level: number = 0,
    ): JSX.Element[] => {
        return folders
            .filter((folder) => folder.parentId === parentId)
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
                ? prev.filter((id) => id !== tagId)
                : [...prev, tagId],
        )
    }

    const handleSave = () => {
        if (!selectedFolderId) return
        onComplete({ selectedFolderId, selectedTagIds })
        onClose()
    }

    return (
        <Modal visible={visible} animationType="slide">
            <SafeAreaView
                style={[styles.sheet, { backgroundColor: colors.background }]}
            >
                <Text style={styles.title}>Selecciona carpeta y etiquetas</Text>

                <Text style={styles.subtitle}>📁 Carpeta:</Text>
                {/* eslint-disable-next-line react-native/no-inline-styles */}
                <View style={{ marginTop: 8 }}>
                    {renderFolderTree(folders)}
                </View>

                <Text style={styles.subtitle}>🏷️ Etiquetas:</Text>
                <TagList
                    tags={tags}
                    selectedTags={selectedTagIds}
                    onTagPress={handleTagToggle}
                />

                <Button
                    title="Guardar y seleccionar archivo"
                    onPress={handleSave}
                    style={styles.saveBtn}
                />
                <Button title="Cancelar" onPress={onClose} />

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
        marginTop: 32,
        marginBottom: 12,
    },
})
