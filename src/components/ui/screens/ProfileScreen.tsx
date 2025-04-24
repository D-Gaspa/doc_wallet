import React, { useEffect, useState } from "react"
import { View, StyleSheet, Text, ScrollView } from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { DocumentCardCarousel } from "../cards"
import { useAlertStore } from "../../../store/useAlertStore"
import { IDocument } from "../../../types/document"
import { Button } from "../button"
import { useNavigation, NavigationProp } from "@react-navigation/native"
import { useFolderStore } from "../../../store/useFolderStore"
import { useDocStore } from "../../../store"
import { TabParamList } from "../../../App"
import { ProfileHeader } from "../profile_header"
import { useAuthStore } from "../../../store"

type Props = {
    folderMainViewRef: React.RefObject<{
        resetToRootFolder: () => void
        navigateToFolder: (folderId: string) => void
    }>
}

export function ProfileScreen({ folderMainViewRef }: Props) {
    const { colors } = useTheme()
    const getExpiringDocuments = useAlertStore((s) => s.getExpiringDocuments)
    const [expiringDocs, setExpiringDocs] = useState<IDocument[]>([])
    const documents = useDocStore((state) => state.documents)
    const folders = useFolderStore((s) => s.folders)
    const navigation = useNavigation<NavigationProp<TabParamList>>()
    const user = useAuthStore((s) => s.user)

    useEffect(() => {
        const docs = getExpiringDocuments()
        setExpiringDocs(docs)
    }, [documents])

    const handleCardPress = (title: string) => {
        const doc = expiringDocs.find((d) => d.title === title)
        if (!doc) return

        const folder = folders.find((f) => f.documentIds?.includes(doc.id))

        if (folder && folderMainViewRef.current?.navigateToFolder) {
            folderMainViewRef.current.navigateToFolder(folder.id)
            navigation.navigate("Home")
        } else {
            console.warn("Folder not found for document:", title)
        }
    }

    const handleGoToFolder = (folderId: string) => {
        folderMainViewRef.current?.navigateToFolder(folderId)
        navigation.navigate("Home")
    }

    if (!user) return null

    const favoriteFolders = folders.filter((folder) => folder.favorite)

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ProfileHeader
                username={user.name}
                profileImage={undefined}
                onPressEdit={() => {
                    console.log("Editar perfil presionado")
                }}
            />

            {expiringDocs.length > 0 && (
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
            )}

            {favoriteFolders.length > 0 && (
                <View style={styles.foldersSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Carpetas favoritas
                    </Text>
                    {favoriteFolders.map((folder) => (
                        <Button
                            key={folder.id}
                            title={folder.title}
                            onPress={() => handleGoToFolder(folder.id)}
                            style={styles.folderButton}
                        />
                    ))}
                </View>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    foldersSection: {
        width: "100%",
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 12,
        textAlign: "left",
    },
    folderButton: {
        marginBottom: 12,
    },
})
