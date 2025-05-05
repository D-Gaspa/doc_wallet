import React, { useEffect, useState, useMemo } from "react"
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { DocumentCardCarousel } from "../cards"
import { FavoriteFolderCard } from "../cards/FavoriteFolderCard"
import { IDocument } from "../../../types/document"
import { useFolderStore } from "../../../store/useFolderStore"
import { useAuthStore, useDocStore } from "../../../store"
import { TabParamList } from "../../../App"
import { ProfileHeader } from "../profile_header"
import { getIconById, ThemeColors } from "./folders/CustomIconSelector"
import type { Folder } from "./folders/types.ts"
import { Spacer, Stack } from "../layout"
import { FolderType } from "./folders/FolderModal.tsx"
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
    if (!expirationDateStr) return null

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
        return null
    }
}

export function ProfileScreen({ folderMainViewRef, navigateToTab }: Props) {
    const { colors } = useTheme()
    const [expiringDocs, setExpiringDocs] = useState<IDocument[]>([])
    const documents = useDocStore((state) => state.documents)
    const folders = useFolderStore((s) => s.folders)
    const user = useAuthStore((s) => s.user)
    const favoriteIds = useFavoriteDocumentsStore((s) => s.favoriteIds)
    const [favoritePreviews, setFavoritePreviews] = useState<DocumentItem[]>([])

    const favoriteDocs = useMemo(() => {
        return documents.filter((doc) => favoriteIds.includes(doc.id))
    }, [documents, favoriteIds])

    const documentsWithExpiration = expiringDocs

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
                            title: doc.title ?? "Sin título",
                            image: { uri: preview.sourceUri },
                        })
                    }
                    // --- FIX: Use the 'err' variable ---
                } catch (err) {
                    console.warn(`Failed to fetch preview for ${doc.id}:`, err) // Log the error
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

        // --- FIX: Remove unused 'changed' variable ---
        for (const favId of favoriteIds) {
            if (!docIds.includes(favId)) {
                removeFavorite(favId) // Just call the function
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

    const folderTypeColors: Record<Exclude<FolderType, "custom">, string> = {
        travel: "#E74C3C",
        medical: "#3498DB",
        car: "#9B59B6",
        education: "#2ECC71",
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

    const favoriteFolders = folders.filter(
        (folder): folder is FolderWithFavorite =>
            (folder as FolderWithFavorite).favorite,
    )

    const getFolderIcon = (folder: Folder) => {
        const iconSize = 36
        let iconId: string
        let iconColor: string | undefined
        if (folder.type && folder.type !== "custom") {
            iconColor = folderTypeColors[folder.type]
            iconId = folder.type
        } else if (folder.customIconId) {
            iconColor = undefined
            iconId = folder.customIconId
        } else {
            iconId = "education"
            iconColor = colors.primary
        }
        const themeColors = colors as unknown as ThemeColors
        return getIconById(iconId, themeColors, iconSize, iconColor)
    }

    return (
        <ScrollView
            style={[styles.scrollView, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
        >
            <ProfileHeader
                username={user.name || "Usuario"}
                profileImage={undefined}
                coverImage={undefined}
                onPressEdit={() => {
                    console.log("Edit Profile pressed")
                }}
                onPressNotifications={() => {
                    navigateToTab("Notifications")
                }}
            />

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
                                Próximos a expirar
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
                        </Stack>
                        <Spacer size={16} />
                    </>
                )}

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
                                Documentos Favoritos
                            </Text>
                            <DocumentCardCarousel
                                documents={favoritePreviews}
                                onPress={handleFavoriteCardPress}
                            />
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
                                Carpetas Favoritas
                            </Text>
                            <FlatList
                                data={favoriteFolders}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item: folder }) => (
                                    <FavoriteFolderCard
                                        folder={folder}
                                        icon={getFolderIcon(folder)}
                                        onPress={() =>
                                            handleGoToFolder(folder.id)
                                        }
                                    />
                                )}
                                contentContainerStyle={styles.carouselContainer}
                            />
                        </Stack>
                        <Spacer size={20} />
                    </>
                )}
            </View>
        </ScrollView>
    )
}

// Styles remain the same
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
    carouselContainer: {
        paddingVertical: 10,
    },
})
