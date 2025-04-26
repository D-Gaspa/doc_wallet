import React, { useEffect, useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { DocumentCardCarousel, FolderCard } from "../cards"
import { useAlertStore } from "../../../store/useAlertStore"
import { IDocument } from "../../../types/document"
import { useFolderStore } from "../../../store/useFolderStore"
import { useAuthStore, useDocStore } from "../../../store"
import { TabParamList } from "../../../App"
import { ProfileHeader } from "../profile_header"
import { getIconById, ThemeColors } from "./folders/CustomIconSelector"
import type { Folder } from "./folders/types.ts"
import { Spacer, Stack } from "../layout"

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

export function ProfileScreen({ folderMainViewRef, navigateToTab }: Props) {
    const { colors } = useTheme()
    const getExpiringDocuments = useAlertStore((s) => s.getExpiringDocuments)
    const [expiringDocs, setExpiringDocs] = useState<IDocument[]>([])
    const documents = useDocStore((state) => state.documents)
    const folders = useFolderStore((s) => s.folders)
    const user = useAuthStore((s) => s.user)

    useEffect(() => {
        const docs = getExpiringDocuments()
        setExpiringDocs(docs)
    }, [documents, getExpiringDocuments])

    const handleCardPress = (title: string) => {
        const doc = expiringDocs.find((d) => d.title === title)
        if (!doc) return

        const folder = folders.find((f) => f.documentIds?.includes(doc.id))

        if (folder) {
            navigateToTab("Home", { folderId: folder.id })
        } else {
            console.warn("Folder not found for document:", title)
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
                    console.log("Notifications pressed")
                }}
            />

            {/* Wrap content in a View with padding */}
            <View style={styles.contentContainer}>
                {/* Expiring Documents Section - Ensure no raw text/whitespace */}
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
                                documents={expiringDocs.map((doc) => ({
                                    type: "expiring",
                                    title: doc.title ?? "Sin título",
                                    expirationDate:
                                        doc.parameters?.find(
                                            (p) => p.key === "expiration_date",
                                        )?.value ?? "Sin fecha",
                                }))}
                                onPress={handleCardPress}
                            />
                        </Stack>
                        <Spacer size={16} />
                    </>
                )}

                {/* Favorite Folders Section - Ensure no raw text/whitespace */}
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
