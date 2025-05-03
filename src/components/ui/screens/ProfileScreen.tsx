import React, { useEffect, useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { DocumentCardCarousel, FolderCard } from "../cards"
//import { useAlertStore } from "../../../store/useAlertStore"
import { IDocument } from "../../../types/document"
import { useFolderStore } from "../../../store/useFolderStore"
import { useAuthStore, useDocStore } from "../../../store"
import { TabParamList } from "../../../App"
import { ProfileHeader } from "../profile_header"
import { getIconById, ThemeColors } from "./folders/CustomIconSelector"
import type { Folder } from "./folders/types.ts"
import { Spacer, Stack } from "../layout"
import { DocumentItem } from "../cards/DocumentCardCarousel.tsx"
import { useFavoriteDocumentsStore } from "../../../store/useFavoriteDocumentsStore.ts"
import { documentPreview } from "../../../services/document/preview.ts"
import { documentStorage } from "../../../services/document/storage.ts"
import { useFocusEffect } from "@react-navigation/native"

type FolderWithFavorite = Folder & { favorite?: boolean }

type Props = {
    folderMainViewRef: React.RefObject<{
        resetToRootFolder: () => void
        navigateToFolder: (folderId: string) => void
    }>
    navigateToTab: (
        tabKey: keyof TabParamList,
        params?: TabParamList[keyof TabParamList],
    ) => void
}

function getDocumentType(
    expirationDateStr: string | undefined,
): "expiring" | "expired" | null {
    if (!expirationDateStr) return null // Or "valid" if you want another type

    const expirationDate = new Date(expirationDateStr)
    const now = new Date()

    expirationDate.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)

    const msInDay = 1000 * 60 * 60 * 24
    const diffInDays = Math.ceil(
        (expirationDate.getTime() - now.getTime()) / msInDay,
    )

    if (diffInDays < 0) {
        return "expired"
    } else if (diffInDays <= 30) {
        return "expiring"
    } else {
        return null // Not shown in expiring/expired carousel
    }
}

export function ProfileScreen({ folderMainViewRef, navigateToTab }: Props) {
    const { colors } = useTheme()
    //const getExpiringDocuments = useAlertStore((s) => s.getExpiringDocuments)
    const [expiringDocs, setExpiringDocs] = useState<IDocument[]>([])
    const documents = useDocStore((state) => state.documents)
    const folders = useFolderStore((s) => s.folders)
    const user = useAuthStore((s) => s.user)
    const documentsWithExpiration = expiringDocs

    const favoriteIds = useFavoriteDocumentsStore((s) => s.favoriteIds)
    const favoriteDocs = documents.filter((doc) => favoriteIds.includes(doc.id))
    const [favoritePreviews, setFavoritePreviews] = useState<DocumentItem[]>([])

    useEffect(() => {
        const fetchPreviews = async () => {
            const docStore = useDocStore.getState()
            const previews: DocumentItem[] = []

            for (const doc of favoriteDocs) {
                try {
                    const preview = await docStore.getDocumentPreview(doc.id)
                    if (preview?.sourceUri) {
                        previews.push({
                            type: "favorite",
                            title: doc.title ?? "Untitled",
                            image: { uri: preview.sourceUri }, // ✅ Actual preview image
                        })
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (err) {
                    console.warn("Failed to fetch preview for", doc.id)
                }
            }

            setFavoritePreviews(previews)
        }
        fetchPreviews()
    }, [favoriteDocs])

    useFocusEffect(
        React.useCallback(() => {
            const docs = useDocStore.getState().documents
            const filtered = docs.filter((doc) => {
                const expParam = doc.parameters?.find(
                    (p) => p.key === "expiration_date",
                )?.value
                if (!expParam) return false
                const type = getDocumentType(expParam)
                return type === "expired" || type === "expiring"
            })

            setExpiringDocs(filtered)
        }, []),
    )

    useEffect(() => {
        const { favoriteIds, removeFavorite } =
            useFavoriteDocumentsStore.getState()
        const docIds = documents.map((doc) => doc.id)

        for (const favId of favoriteIds) {
            if (!docIds.includes(favId)) {
                removeFavorite(favId)
            }
        }
    }, [documents])

    const handleCardPress = (title: string) => {
        const doc = documentsWithExpiration.find((d) => d.title === title)
        if (!doc) return

        const folder = folders.find((f) => f.documentIds?.includes(doc.id))
        if (!folder) {
            console.warn("Folder not found for document:", title)
            return
        }

        // Avoid looping by checking if it's already selected
        navigateToTab("Home", { folderId: folder.id })
    }

    const handleFavoriteCardPress = async (title: string) => {
        const doc = favoriteDocs.find((d) => d.title === title)
        if (!doc) return

        try {
            const docStore = useDocStore.getState()
            const previewResult = await docStore.getDocumentPreview(doc.id)

            if (!previewResult?.sourceUri) {
                console.warn("No preview available")
                return
            }

            const mimeType = previewResult.metadata?.type || "application/pdf"

            await documentPreview.viewDocumentByUri(
                previewResult.sourceUri,
                mimeType,
                async () => {
                    const storage = await documentStorage
                    await storage.deletePreviewFile(previewResult.sourceUri)
                },
            )
        } catch (err) {
            console.warn("Failed to preview favorite document", err)
        }
    }

    const handleGoToFolder = (folderId: string) => {
        navigateToTab("Home", { folderId: folderId })

        if (folderMainViewRef.current?.navigateToFolder) {
            setTimeout(() => {
                folderMainViewRef.current?.navigateToFolder(folderId)
            }, 50)
        } else {
            console.warn(
                "Folder reference not available for internal navigation",
            )
        }
    }

    if (!user) return null

    // Filter favorite folders using the local type assertion
    // NOTE: Add 'favorite?: boolean' to the main Folder type for a better long-term solution
    const favoriteFolders = folders.filter(
        (folder): folder is FolderWithFavorite =>
            (folder as FolderWithFavorite).favorite,
    )

    // Get custom icon for folder - Use the imported Folder type
    const getFolderIcon = (folder: Folder) => {
        if (folder.type === "custom" && folder.customIconId) {
            // Cast colors to ThemeColors type expected by getIconById
            return getIconById(
                folder.customIconId,
                colors as unknown as ThemeColors,
            )
        }
        return undefined
    }

    return (
        <ScrollView
            style={[styles.scrollView, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
        >
            <ProfileHeader
                username={user.name || "User"}
                profileImage={undefined}
                coverImage={undefined}
                onPressEdit={() => {
                    console.log("Edit Profile pressed")
                }}
                onPressNotifications={() => {
                    navigateToTab("Notifications")
                }}
            />

            {/* Wrap content in a View with padding */}
            <View style={styles.contentContainer}>
                {/* Expiring Documents Section*/}
                {expiringDocs.length > 0 && (
                    <>
                        <Stack spacing={12}>
                            <Text
                                style={[
                                    styles.sectionTitle,
                                    { color: colors.text },
                                ]}
                            >
                                Expiring Soon
                            </Text>
                            <DocumentCardCarousel
                                documents={documentsWithExpiration
                                    .map((doc): DocumentItem | null => {
                                        const expDate = doc.parameters?.find(
                                            (p) => p.key === "expiration_date",
                                        )?.value
                                        const type = getDocumentType(expDate)
                                        if (!type) return null
                                        return {
                                            type,
                                            title: doc.title ?? "Sin título",
                                            expirationDate:
                                                expDate ?? "Sin fecha",
                                        }
                                    })
                                    .filter(
                                        (item): item is DocumentItem =>
                                            item !== null,
                                    )}
                                onPress={handleCardPress}
                            />

                            {/* Favorite Documents Section */}
                            {favoriteDocs.length > 0 && (
                                <>
                                    <Stack spacing={12}>
                                        <Text
                                            style={[
                                                styles.sectionTitle,
                                                { color: colors.text },
                                            ]}
                                        >
                                            Favorite Documents
                                        </Text>
                                        <DocumentCardCarousel
                                            documents={favoritePreviews}
                                            onPress={handleFavoriteCardPress}
                                        />
                                    </Stack>
                                    <Spacer size={16} />
                                </>
                            )}
                        </Stack>
                        <Spacer size={16} />
                    </>
                )}

                {/* Favorite Folders Section */}
                {favoriteFolders.length > 0 && (
                    <>
                        <Stack spacing={12}>
                            <Text
                                style={[
                                    styles.sectionTitle,
                                    { color: colors.text },
                                ]}
                            >
                                Favorite Folders
                            </Text>
                            {favoriteFolders.map((folder) => (
                                <FolderCard
                                    key={folder.id}
                                    title={folder.title}
                                    folderId={folder.id}
                                    // Use nullish coalescing for optional type [cite: 488]
                                    type={folder.type ?? "custom"}
                                    customIcon={getFolderIcon(folder)}
                                    showAddTagButton={false}
                                    onPress={() => handleGoToFolder(folder.id)}
                                />
                            ))}
                        </Stack>
                        <Spacer size={20} />
                    </>
                )}
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingBottom: 100,
    },
    contentContainer: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 8,
        textAlign: "left",
    },
})
