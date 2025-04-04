import React, { useEffect, useState } from "react"
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"
import ArrowIcon from "../assets/svg/Arrow 1.svg"
import { IDocument } from "../../../types/document.ts"
import { Tag, useTagContext } from "../tag_functionality/TagContext.tsx"
import { ItemTagsManager } from "../tag_functionality/ItemTagsManager.tsx"
import { documentPreview } from "../../../services/document/preview.ts"
import { documentStorage } from "../../../services/document/storage"
import { DocumentType } from "../../../types/document"
import { useDocStore } from "../../../store"
import { LoadingOverlay } from "../feedback/LoadingOverlay.tsx"
import * as FileSystem from "expo-file-system"

export interface DocumentCardProps {
    document: IDocument
    onPress: () => void
    onLongPress?: () => void
    testID?: string
    showAddTagButton?: boolean
    maxTags?: number
    tags?: Tag[]
}

export function DocumentCard({
    document,
    onPress,
    onLongPress,
    testID,
    maxTags = 3,
    showAddTagButton = true,
    tags: incomingTags,
}: DocumentCardProps) {
    const { colors } = useTheme()
    const tagContext = useTagContext()
    //const tags = tagContext.getTagsForItem(document.id, "document")
    const [isLoading, setLoading] = useState(false)
    const [tags, setTags] = useState<Tag[]>([])
    const [previewUri, setPreviewUri] = useState<string | null>(null)

    console.log("💡 DocumentCard rendering with tags:", tags)

    useEffect(() => {
        let isMounted = true

        const fetchPreview = async () => {
            try {
                const docStore = useDocStore.getState()
                const preview = await docStore.getDocumentPreview(document.id)

                if (preview?.sourceUri && isMounted) {
                    const fileInfo = await FileSystem.getInfoAsync(
                        preview.sourceUri,
                    )
                    if (fileInfo.exists && fileInfo.size > 0) {
                        setPreviewUri(preview.sourceUri)
                    }
                }
            } catch (err) {
                console.warn("Failed to load preview", err)
            }
        }

        fetchPreview()
        return () => {
            isMounted = false
        }
    }, [document.id])

    useEffect(() => {
        if (incomingTags) {
            setTags(incomingTags)
        } else {
            const fetchedTags = tagContext.getTagsForItem(
                document.id,
                "document",
            )
            console.log(
                "[DocumentCard] Fetched tags for",
                document.id,
                fetchedTags,
            )
            setTags(fetchedTags)
        }
    }, [incomingTags, tagContext.associations.length, document.id])

    const handleOpenPreview = async () => {
        if (onPress) {
            onPress()
            return
        }

        setLoading(true)
        try {
            const docStore = useDocStore.getState()
            await new Promise((resolve) => setTimeout(resolve, 200))

            const previewResult = await docStore.getDocumentPreview(document.id)
            if (!previewResult || !previewResult.sourceUri) {
                console.error("Preview failed")
                return
            }

            const mimeType = documentPreview.getMimeTypeForDocumentType(
                previewResult.metadata?.type ?? DocumentType.PDF,
            )

            const fileInfo = await FileSystem.getInfoAsync(
                previewResult.sourceUri,
            )
            if (!fileInfo.exists || fileInfo.size === 0) {
                console.error("Preview file is missing or empty")
            }

            await documentPreview.viewDocumentByUri(
                previewResult.sourceUri,
                mimeType,
                async () => {
                    const storage = await documentStorage
                    await storage.deletePreviewFile(previewResult.sourceUri)
                },
            )
        } catch (err) {
            console.warn("Document preview failed", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <TouchableOpacity
            onLongPress={onLongPress}
            style={[
                styles.container,
                {
                    borderBottomColor: colors.secondaryText,
                    shadowColor: colors.shadow,
                },
            ]}
            onPress={handleOpenPreview}
            testID={testID}
        >
            <Image
                source={{ uri: previewUri ?? document.sourceUri }}
                style={styles.image}
                resizeMode="cover"
            />

            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {document.title ?? "Untitled document"}
                </Text>
                <ItemTagsManager
                    itemId={document.id}
                    itemType="document"
                    tags={tags}
                    allTags={tagContext.tags}
                    showAddTagButton={showAddTagButton}
                    maxTags={maxTags}
                    horizontal={true}
                />

                <View style={styles.viewContainer}>
                    <Text style={[styles.viewText, { color: colors.primary }]}>
                        Visualizar documento
                    </Text>
                    <ArrowIcon width={16} height={16} stroke={colors.primary} />
                </View>

                <LoadingOverlay visible={isLoading} />
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        marginHorizontal: 5,
        borderBottomWidth: 1,
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 5,
        marginRight: 15,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
    },
    viewContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
    },
    viewText: {
        fontSize: 16,
        marginRight: 5,
    },
})
