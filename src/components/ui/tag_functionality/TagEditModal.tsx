import React, { useEffect, useRef, useState, useCallback } from "react"
import {
    StyleSheet,
    View,
    Animated,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Dimensions,
    Modal,
    TouchableWithoutFeedback,
    ScrollView,
    TouchableOpacity,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { Stack } from "../layout"
import { Text } from "../typography"
import { TextField } from "../form"
import { Button } from "../button"

const TAG_COLORS = [
    "#E74C3C",
    "#F39C12",
    "#2ECC71",
    "#3498DB",
    "#9B59B6",
    "#1ABC9C",
    "#34495E",
    "#7F8C8D",
    "#F1C40F",
    "#006400",
    "#D2691E",
    "#8B0000",
    "#8FBC8F",
    "#ADD8E6",
    "#20B2AA",
    "#C71585",
]

const screenHeight = Dimensions.get("window").height

interface TagEditModalProps {
    isVisible: boolean
    onClose: () => void
    onSave: (name: string, color: string, id?: string) => void
    onDelete?: (id: string) => void
    initialName?: string
    initialColor?: string
    tagId?: string
    title?: string
}

export function TagEditModal({
    isVisible,
    onClose,
    onSave,
    onDelete,
    initialName = "",
    initialColor = TAG_COLORS[0],
    tagId,
    title: incomingTitle,
}: TagEditModalProps) {
    const { colors } = useTheme()

    const [name, setName] = useState(initialName)
    const [selectedColor, setSelectedColor] = useState(initialColor)

    const translateY = useRef(new Animated.Value(screenHeight)).current

    useEffect(() => {
        if (isVisible) {
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start()
        } else {
            Animated.timing(translateY, {
                toValue: screenHeight,
                duration: 250,
                useNativeDriver: true,
            }).start()
        }
    }, [isVisible, translateY])

    useEffect(() => {
        if (isVisible) {
            setName(initialName)
            setSelectedColor(initialColor)
        }
    }, [isVisible, initialName, initialColor])

    const handleSave = useCallback(() => {
        if (name.trim() === "") return
        onSave(name.trim(), selectedColor, tagId)
    }, [name, selectedColor, tagId, onSave])

    const handleDelete = useCallback(() => {
        if (tagId && onDelete) {
            onDelete(tagId)
        }
    }, [tagId, onDelete])

    const isEditMode = !!tagId
    const modalTitle =
        incomingTitle ??
        (isEditMode ? "Editar Etiqueta" : "Crear Nueva Etiqueta")
    const saveButtonText = isEditMode ? "Actualizar" : "Crear Etiqueta"

    return (
        <Modal
            transparent
            animationType="none"
            visible={isVisible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.kavContainer}
            >
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            backgroundColor: colors.background,
                            transform: [{ translateY }],
                        },
                    ]}
                >
                    {/* Wrap content in SafeAreaView */}
                    <SafeAreaView style={styles.safeAreaContent}>
                        <View
                            style={[
                                styles.handle,
                                { backgroundColor: colors.border },
                            ]}
                        />
                        <Text
                            weight="medium"
                            style={[styles.title, { color: colors.text }]}
                        >
                            {modalTitle}
                        </Text>

                        {/* Scrollable main content */}
                        <ScrollView
                            contentContainerStyle={
                                styles.contentScrollContainer
                            }
                            keyboardShouldPersistTaps="handled"
                        >
                            <Stack spacing={20}>
                                {/* Tag Name */}
                                <Stack spacing={6}>
                                    <Text
                                        weight="medium"
                                        style={{ color: colors.text }}
                                    >
                                        Nombre de Etiqueta
                                    </Text>
                                    <TextField
                                        placeholder="Ingresa nombre de etiqueta"
                                        value={name}
                                        onChangeText={setName}
                                        testID="tag-name-input"
                                        returnKeyType="done"
                                    />
                                </Stack>

                                {/* Tag Color */}
                                <Stack spacing={6}>
                                    <Text
                                        weight="medium"
                                        style={{ color: colors.text }}
                                    >
                                        Color de Etiqueta
                                    </Text>
                                    <View style={styles.colorsContainer}>
                                        {TAG_COLORS.map((color) => (
                                            <TouchableOpacity
                                                key={color}
                                                style={[
                                                    styles.colorOption,
                                                    {
                                                        backgroundColor: color,
                                                        borderColor:
                                                            colors.border +
                                                            "50",
                                                    },
                                                    selectedColor === color && [
                                                        styles.selectedColor,
                                                        {
                                                            borderColor:
                                                                colors.primary,
                                                        },
                                                    ],
                                                ]}
                                                onPress={() =>
                                                    setSelectedColor(color)
                                                }
                                                testID={`color-${color.replace(
                                                    "#",
                                                    "",
                                                )}`}
                                            />
                                        ))}
                                    </View>
                                </Stack>

                                {/* Preview */}
                                <Stack spacing={6}>
                                    <Text
                                        weight="medium"
                                        style={{ color: colors.text }}
                                    >
                                        Vista Previa
                                    </Text>
                                    <View style={styles.previewContainer}>
                                        <View
                                            style={[
                                                styles.tagPreview,
                                                {
                                                    backgroundColor:
                                                        selectedColor + "20",
                                                    borderColor: selectedColor,
                                                },
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.dot,
                                                    {
                                                        backgroundColor:
                                                            selectedColor,
                                                    },
                                                ]}
                                            />
                                            <Text
                                                style={{ color: colors.text }}
                                            >
                                                {name.trim() ||
                                                    "Vista Previa Etiqueta"}
                                            </Text>
                                        </View>
                                    </View>
                                </Stack>
                            </Stack>
                        </ScrollView>

                        {/* Action Buttons Footer */}
                        <View
                            style={[
                                styles.footer,
                                { borderTopColor: colors.border },
                            ]}
                        >
                            <Button
                                title={saveButtonText}
                                onPress={handleSave}
                                style={styles.actionButton} // Takes full width
                                disabled={name.trim() === ""}
                                testID="save-button"
                            />
                            <Button
                                title="Cancelar"
                                onPress={onClose}
                                variant="outline"
                                style={styles.actionButton}
                                testID="cancel-button"
                            />
                            {isEditMode && onDelete && (
                                <Button
                                    title="Eliminar Etiqueta"
                                    onPress={handleDelete}
                                    style={styles.deleteButton}
                                    textStyle={styles.deleteButtonText}
                                    variant="text"
                                    testID="delete-button"
                                />
                            )}
                        </View>
                    </SafeAreaView>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    )
}

// Styles
const styles = StyleSheet.create({
    kavContainer: {
        flex: 1,
        justifyContent: "flex-end",
    },
    // eslint-disable-next-line react-native/no-color-literals
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    modalContainer: {
        flex: 1,
        width: "100%",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    safeAreaContent: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        alignSelf: "center",
        marginTop: 8,
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        textAlign: "center",
        marginBottom: 16,
        marginTop: 4,
        paddingHorizontal: 20,
    },
    contentScrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexGrow: 1,
    },
    colorsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        paddingVertical: 5,
    },
    colorOption: {
        width: 38,
        height: 38,
        borderRadius: 19,
        margin: 4,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    // eslint-disable-next-line react-native/no-color-literals
    selectedColor: {
        borderWidth: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 4,
    },
    previewContainer: { alignItems: "center", marginTop: 10, marginBottom: 20 }, // Increased bottom margin
    tagPreview: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        alignSelf: "center",
    },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    footer: {
        padding: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingBottom: Platform.OS === "ios" ? 30 : 20,
        width: "100%",
    },
    actionButton: {
        width: "100%",
        marginBottom: 12,
    },
    // eslint-disable-next-line react-native/no-color-literals
    deleteButton: {
        backgroundColor: "transparent",
        borderColor: "transparent",
        marginBottom: 0,
    },
    deleteButtonText: {
        fontWeight: "500",
    },
})
