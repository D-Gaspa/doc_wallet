import React, { useEffect, useMemo, useState } from "react"
import DateTimePicker from "@react-native-community/datetimepicker"
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import LinearGradient from "react-native-linear-gradient"
import { Button } from "../../button"
import { IDocument } from "../../../../types/document.ts"
import { useTagContext } from "../../tag_functionality/TagContext.tsx"
import { TagList } from "../../tag_functionality/TagList.tsx"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFolderStore } from "../../../../store/useFolderStore.ts"
import { ListItem } from "../folders/types.ts"
import { ItemsList } from "../folders/ItemsList"
import { useTheme } from "../../../../hooks/useTheme.ts"
import { Spacer } from "../../layout"
import {
    BreadcrumbItem,
    BreadcrumbNavigation,
} from "../folders/BreadcrumbNavigation"

interface Props {
    visible: boolean
    document: IDocument | null
    onClose: () => void
    onSave: (doc: IDocument, folderId: string, tagIds: string[]) => void
    initialFolderId?: string | null
}

export const AddDocumentDetailsSheet = ({
    visible,
    document,
    onClose,
    onSave,
    initialFolderId = null,
}: Props) => {
    const { colors } = useTheme()
    const tagContext = useTagContext()
    const allFolders = useFolderStore((s) => s.folders)
    const tags = tagContext?.tags

    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
    const [currentViewFolderId, setCurrentViewFolderId] = useState<
        string | null
    >(null)
    const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([])
    const [isLoading, setLoading] = useState(false)
    const [isNavigating, setIsNavigating] = useState(false)
    const [hasExpiration, setHasExpiration] = useState(false)
    const [expirationDate, setExpirationDate] = useState<string>("")
    const [notificationTimes, setNotificationTimes] = useState<number[]>([])
    const [showDatePicker, setShowDatePicker] = useState(false)

    const notificationChoices = [
        { label: "1 día antes", value: 1 },
        { label: "3 días antes", value: 3 },
        { label: "1 semana antes", value: 7 },
        { label: "2 semanas antes", value: 14 },
        { label: "1 mes antes", value: 30 },
        { label: "2 meses antes", value: 60 },
    ]
    const toggleNotification = (val: number) => {
        setNotificationTimes((prev) =>
            prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
        )
    }

    useEffect(() => {
        if (visible) {
            const startFolderId = initialFolderId ?? null
            setCurrentViewFolderId(startFolderId)
            setFolderPath(buildFolderPath(startFolderId))
            setSelectedTagIds([])
            setHasExpiration(false)
            setExpirationDate("")
            setNotificationTimes([])
            setLoading(false)
            setIsNavigating(false)
        }
    }, [visible, document, initialFolderId])

    const buildFolderPath = (
        targetFolderId: string | null,
    ): BreadcrumbItem[] => {
        if (targetFolderId === null) return []
        const path: BreadcrumbItem[] = []
        let currentFolder = allFolders.find((f) => f.id === targetFolderId)
        while (currentFolder) {
            path.unshift({ id: currentFolder.id, title: currentFolder.title })
            currentFolder = allFolders.find(
                (f) => f.id === currentFolder?.parentId,
            )
        }
        return path
    }

    const handleNavigate = (folderId: string | null) => {
        if (folderId === currentViewFolderId || isNavigating) return

        setIsNavigating(true)
        setCurrentViewFolderId(folderId)
        setFolderPath(buildFolderPath(folderId))

        setTimeout(() => setIsNavigating(false), 50)
    }

    const handleTagToggle = (tagId: string) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId)
                ? prev.filter((t) => t !== tagId)
                : [...prev, tagId],
        )
    }

    const handleSave = async () => {
        if (!document) {
            Alert.alert("Error", "Document data is missing.")
            return
        }

        if (currentViewFolderId === null) {
            Alert.alert(
                "Cannot Save to Root",
                "Please select a specific folder to save the document. Documents cannot be added to the root directory.",
            )
            return
        }

        const folderName =
            allFolders.find((f) => f.id === currentViewFolderId)?.title ||
            "the selected folder"
        Alert.alert("Confirm Save", `Save document to "${folderName}"?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: `Save to ${folderName}`,
                onPress: () =>
                    proceedWithSave(
                        document,
                        currentViewFolderId,
                        selectedTagIds,
                    ),
            },
        ])
    }

    const proceedWithSave = async (
        docToSave: IDocument,
        targetFolderId: string,
        tagIds: string[],
    ) => {
        if (hasExpiration && !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
            Alert.alert(
                "Invalid Date",
                "Please use YYYY-MM-DD format for the expiration date.",
            )
            return
        }

        setLoading(true)

        try {
            const updatedDoc = {
                ...docToSave,
                parameters: [
                    ...(docToSave.parameters || []).filter(
                        (p) =>
                            p.key !== "expiration_date" &&
                            p.key !== "expiration_notifications",
                    ),
                    ...(hasExpiration
                        ? [
                              {
                                  key: "expiration_date",
                                  value: expirationDate,
                                  id: `exp_date_${docToSave.id}`,
                                  documentId: docToSave.id,
                                  type: "date",
                                  isSearchable: true,
                                  isSystem: false,
                              },
                              {
                                  key: "expiration_notifications",
                                  value: JSON.stringify(notificationTimes),
                                  id: `exp_notify_${docToSave.id}`,
                                  documentId: docToSave.id,
                                  type: "json",
                                  isSearchable: false,
                                  isSystem: false,
                              },
                          ]
                        : []),
                ],
            }

            onSave(updatedDoc, targetFolderId, tagIds)
        } catch (error) {
            console.error("Error in proceedWithSave:", error)
            Alert.alert("Save Error", "Could not save document details.")
        } finally {
            setLoading(false)
        }
    }

    const folderItemsForList = useMemo((): ListItem[] => {
        const childFolders = allFolders.filter(
            (folder) => folder.parentId === currentViewFolderId,
        )
        childFolders.sort((a, b) => a.title.localeCompare(b.title))

        return childFolders.map(
            (folder): ListItem => ({ type: "folder", data: folder }),
        )
    }, [allFolders, currentViewFolderId])

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView
                style={[styles.sheet, { backgroundColor: colors.background }]}
                edges={["bottom", "left", "right"]}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.kavContainer}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                >
                    {/* Header */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        Agregar Detalles del Documento
                    </Text>

                    {/* Folder Selection */}
                    <Text style={[styles.subtitle, { color: colors.text }]}>
                        Seleccionar Carpeta de Destino:
                    </Text>

                    {/* Breadcrumbs */}
                    <BreadcrumbNavigation
                        path={folderPath}
                        onNavigate={handleNavigate}
                    />

                    <Spacer size={8} />

                    {/* Folder List */}
                    <View
                        style={[
                            styles.listContainer,
                            // eslint-disable-next-line react-native/no-inline-styles
                            {
                                borderTopWidth: 0,
                                borderBottomWidth: 0,
                            },
                        ]}
                    >
                        {isNavigating ? (
                            <ActivityIndicator
                                style={styles.loadingIndicator}
                                color={colors.primary}
                            />
                        ) : (
                            <ItemsList
                                items={folderItemsForList}
                                onFolderPress={handleNavigate}
                                selectionMode={false}
                                selectedItems={[]}
                                emptyListMessage="No subfolders here"
                                testID="add-doc-folder-select-list"
                                folderCardItemManagerShowAddTagButton={false}
                                contentContainerStyle={
                                    styles.listContentPadding
                                }
                            />
                        )}
                        <LinearGradient
                            colors={[
                                `${colors.background}00`,
                                `${colors.background}FF`,
                            ]}
                            style={styles.fadeOverlay}
                            pointerEvents="none"
                        />
                    </View>

                    {/* Spacer between folder and tag selection */}
                    <Spacer size={18} />

                    {/* Document Name */}
                    {/* TODO: Add ability to change document name*/}
                    {/* Tag Selection */}
                    <Text
                        style={[
                            styles.subtitle,
                            // eslint-disable-next-line react-native/no-inline-styles
                            { color: colors.text, marginTop: 15 },
                        ]}
                    >
                        Seleccionar Tags (Opcional):
                    </Text>
                    <TagList
                        tags={tags || []}
                        selectedTags={selectedTagIds}
                        onTagPress={handleTagToggle}
                        showAddTagButton={false}
                        horizontal={true}
                        testID="add-doc-tag-select-list"
                        size="small"
                    />

                    {/* Expiration Section */}
                    <View
                        style={[
                            styles.expirationContainer,
                            {
                                borderTopColor: colors.border,
                                borderBottomColor: colors.border,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => setHasExpiration(!hasExpiration)}
                            style={styles.expirationToggle}
                        >
                            <View
                                style={[
                                    styles.checkboxPlaceholder,
                                    { borderColor: colors.border },
                                ]}
                            >
                                {hasExpiration && (
                                    <Text
                                        style={
                                            /* eslint-disable-next-line react-native/no-inline-styles */
                                            {
                                                fontSize: 14,
                                                fontWeight: "bold",
                                                color: colors.primary,
                                            }
                                        }
                                    >
                                        ✓
                                    </Text>
                                )}
                            </View>
                            <Text style={{ color: colors.text }}>
                                Agregar fecha de expiración
                            </Text>
                        </TouchableOpacity>

                        {hasExpiration && (
                            <View style={styles.expirationDetails}>
                                <Text
                                    style={[
                                        styles.subtitleSmall,
                                        { color: colors.text },
                                    ]}
                                >
                                    Fecha de Expiración (YYYY-MM-DD):
                                </Text>
                                {Platform.OS === "android" ? (
                                    <>
                                        <TouchableOpacity
                                            onPress={() =>
                                                setShowDatePicker(true)
                                            }
                                            style={[
                                                styles.expirationDateInput,
                                                // eslint-disable-next-line react-native/no-inline-styles
                                                {
                                                    borderColor: colors.border,
                                                    backgroundColor:
                                                        colors.card,
                                                    justifyContent: "center",
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={{
                                                    color: expirationDate
                                                        ? colors.text
                                                        : colors.text + "99",
                                                }}
                                            >
                                                {expirationDate ||
                                                    "Selecciona una fecha"}
                                            </Text>
                                        </TouchableOpacity>

                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={
                                                    expirationDate
                                                        ? new Date(
                                                              expirationDate,
                                                          )
                                                        : new Date()
                                                }
                                                mode="date"
                                                display="default"
                                                onChange={(
                                                    _event,
                                                    selectedDate,
                                                ) => {
                                                    setShowDatePicker(false)
                                                    if (selectedDate) {
                                                        const year =
                                                            selectedDate.getFullYear()
                                                        const month = String(
                                                            selectedDate.getMonth() +
                                                                1,
                                                        ).padStart(2, "0")
                                                        const day = String(
                                                            selectedDate.getDate(),
                                                        ).padStart(2, "0")
                                                        setExpirationDate(
                                                            `${year}-${month}-${day}`,
                                                        )
                                                    }
                                                }}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <TextInput
                                        value={expirationDate}
                                        onChangeText={setExpirationDate}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={
                                            colors.text + "99"
                                        }
                                        keyboardType="numbers-and-punctuation"
                                        style={[
                                            styles.expirationDateInput,
                                            {
                                                borderColor: colors.border,
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                            },
                                        ]}
                                    />
                                )}

                                <Text
                                    style={[
                                        styles.subtitleSmall,
                                        // eslint-disable-next-line react-native/no-inline-styles
                                        { color: colors.text, marginTop: 12 },
                                    ]}
                                >
                                    ¿Cuándo quieres ser notificado?
                                </Text>
                                <View style={styles.notifyContainer}>
                                    {notificationChoices.map((opt) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            onPress={() =>
                                                toggleNotification(opt.value)
                                            }
                                            style={styles.notifyItem}
                                        >
                                            <View
                                                style={[
                                                    styles.checkboxPlaceholder,
                                                    {
                                                        borderColor:
                                                            colors.border,
                                                    },
                                                ]}
                                            >
                                                {notificationTimes.includes(
                                                    opt.value,
                                                ) && (
                                                    <Text
                                                        /* eslint-disable-next-line react-native/no-inline-styles */
                                                        style={{
                                                            fontSize: 14,
                                                            fontWeight: "bold",
                                                            color: colors.primary,
                                                        }}
                                                    >
                                                        ✓
                                                    </Text>
                                                )}
                                            </View>
                                            <Text
                                                style={{ color: colors.text }}
                                            >
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    <Spacer size={16} />

                    {/* Action Buttons at the bottom */}
                    <View style={styles.buttonContainer}>
                        <Button
                            title="Guardar"
                            onPress={handleSave}
                            disabled={isLoading || currentViewFolderId === null}
                            style={styles.saveBtn}
                            loading={isLoading}
                        />
                        <Button
                            title="Cancelar"
                            variant="outline"
                            onPress={onClose}
                            disabled={isLoading}
                        />
                    </View>
                    {/* Spacer at the very bottom for padding */}
                    <Spacer size={10} />
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    sheet: {
        flex: 1,
    },
    kavContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 10,
        marginBottom: 8,
    },
    subtitleSmall: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
    },
    listContainer: {
        flexGrow: 1,
        flexShrink: 1,
        minHeight: 100,
        maxHeight: 250,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        marginBottom: 10,
        overflow: "hidden",
        marginHorizontal: -20,
        position: "relative",
    },
    listContentPadding: {
        paddingBottom: 30,
    },
    loadingIndicator: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        paddingBottom: 50,
    },
    fadeOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 30,
    },
    expirationContainer: {
        marginVertical: 10,
        paddingVertical: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    expirationToggle: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 5,
        paddingVertical: 5,
    },
    checkboxPlaceholder: {
        width: 20,
        height: 20,
        borderWidth: 1.5,
        borderRadius: 4,
        marginRight: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    expirationDetails: {
        marginTop: 16,
        paddingHorizontal: 5,
    },
    expirationDateInput: {
        borderWidth: 1,
        padding: 10,
        borderRadius: 8,
        marginTop: 6,
        height: 44,
    },
    notifyContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
    },
    notifyItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 16,
        marginBottom: 10,
    },
    buttonContainer: {
        paddingTop: 10,
    },
    saveBtn: {
        marginBottom: 12,
    },
})
