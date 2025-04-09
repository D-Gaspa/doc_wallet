import React, { useEffect, useState } from "react"
import { View, StyleSheet, Text } from "react-native"
import { useThemeContext } from "../../../context/ThemeContext.tsx"
import { DocumentCardCarousel } from "../cards"
import { useAlertStore } from "../../../store/useAlertStore.ts"
import { IDocument } from "../../../types/document.ts"
import { Button } from "../button"
import { Toast } from "../feedback"
import { NavigationProp, useNavigation } from "@react-navigation/native"
import { useFolderStore } from "../../../store/useFolderStore"
import { useDocStore } from "../../../store"
import { TabParamList } from "../../../App.tsx"

type Props = {
    folderMainViewRef: React.RefObject<{
        resetToRootFolder: () => void
        navigateToFolder: (folderId: string) => void
    }>
}

export function ProfileScreen({ folderMainViewRef }: Props) {
    const { colors, toggleTheme } = useThemeContext()
    const getExpiringDocuments = useAlertStore((s) => s.getExpiringDocuments)
    const [expiringDocs, setExpiringDocs] = useState<IDocument[]>([])
    const [toastVisible, setToastVisible] = useState<boolean>(false)
    const documents = useDocStore((state) => state.documents)

    const folders = useFolderStore((s) => s.folders)
    const navigation = useNavigation<NavigationProp<TabParamList>>()

    useEffect(() => {
        const docs = getExpiringDocuments()
        setExpiringDocs(docs)
    }, [documents]) // will rerun on every document update

    const handleToggleTheme = () => {
        toggleTheme()
        setToastVisible(true)
    }

    const handleCardPress = (title: string) => {
        const doc = expiringDocs.find((d) => d.title === title)
        if (!doc) return

        // Find folder that contains this document
        const folder = folders.find((f) => f.documentIds?.includes(doc.id))

        if (folder && folderMainViewRef.current?.navigateToFolder) {
            folderMainViewRef.current.navigateToFolder(folder.id)
            navigation.navigate("Home") // tab name
        } else {
            console.warn("Folder not found for document:", title)
        }
    }

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Text style={styles.header}>Tu perfil</Text>

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

            <View style={styles.themeButtonWrapper}>
                <Button
                    title="Toggle Theme"
                    onPress={handleToggleTheme}
                    testID="toggle-theme-button"
                />
            </View>

            {/* Theme toggle button */}

            {toastVisible && (
                <Toast
                    message="Theme updated successfully"
                    visible={toastVisible}
                    onDismiss={() => setToastVisible(false)}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    themeButtonWrapper: {
        position: "absolute",
        bottom: 110,
        left: 20,
        right: 20,
    },
})
