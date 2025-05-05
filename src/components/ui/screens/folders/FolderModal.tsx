import React, { useState, useEffect, useRef } from "react"
import {
    StyleSheet,
    View,
    ScrollView,
    ViewStyle,
    Animated,
    TouchableOpacity,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { BaseModal } from "../../../common/modal"
import { Stack } from "../../layout"
import { Row } from "../../layout"
import { Text } from "../../typography"
import { TextField } from "../../form"
import { FolderCard } from "../../cards"
import { Button } from "../../button"
import { LoggingService } from "../../../../services/monitoring/loggingService"
import { useDismissGesture } from "../../gestures/useDismissGesture.ts"
import { CustomIconSelector } from "./CustomIconSelector"

export type FolderType = "travel" | "medical" | "car" | "education" | "custom"

interface UnifiedFolderModalProps {
    isVisible: boolean
    onClose: () => void
    onSave: (
        name: string,
        type: FolderType,
        customIconId?: string,
        folderId?: string,
    ) => void
    mode: "create" | "edit"
    initialData?: {
        id?: string
        name?: string
        type?: FolderType
        customIconId?: string
        favorite?: boolean
    }
    parentFolderId?: string | null
}

export function UnifiedFolderModal({
    isVisible,
    onClose,
    onSave,
    mode = "create",
    initialData = {},
    parentFolderId = null,
}: UnifiedFolderModalProps) {
    const { colors } = useTheme()
    const logger = LoggingService.getLogger
        ? LoggingService.getLogger("UnifiedFolderModal")
        : { debug: console.debug }
    const isMounted = useRef(false)

    const [folderName, setFolderName] = useState(initialData.name || "")
    const [selectedType, setSelectedType] = useState<FolderType>(
        initialData.type || "custom",
    )
    const [customIconId, setCustomIconId] = useState(
        initialData.customIconId || "file", // Default icon if custom
    )
    const [showCustomSelector, setShowCustomSelector] = useState(
        initialData.type === "custom",
    )

    const handleCancelRef = useRef(() => {
        if (mode === "create") {
            setFolderName("")
            setSelectedType("custom")
            setCustomIconId("file")
        }
        onClose()
    })

    const { translateX, panHandlers, resetPosition } = useDismissGesture({
        onDismiss: handleCancelRef.current,
        direction: "horizontal",
    })

    useEffect(() => {
        if (isVisible) {
            setFolderName(initialData.name || "")
            setSelectedType(initialData.type || "custom")
            setCustomIconId(initialData.customIconId || "file")
            setShowCustomSelector(initialData.type === "custom")

            const timer = setTimeout(() => {
                isMounted.current = true
                if (resetPosition) resetPosition()
            }, 100)

            return () => {
                clearTimeout(timer)
                isMounted.current = false
            }
        }
    }, [isVisible, initialData])

    const folderTypes = [
        { type: "travel" as const, label: "Viaje" },
        { type: "medical" as const, label: "Médico" },
        { type: "car" as const, label: "Vehículo" },
        { type: "education" as const, label: "Educación" },
        { type: "custom" as const, label: "Personalizado" },
    ]

    const handleTypeSelect = (type: FolderType) => {
        if (!isMounted.current) return
        setSelectedType(type)
        setShowCustomSelector(type === "custom")
        if (type === "custom" && !customIconId) {
            setCustomIconId("file") // Ensure a default icon if switching to custom
        }
    }

    const handleIconSelect = (iconId: string) => {
        if (!isMounted.current) return
        setCustomIconId(iconId)
    }

    const handleSave = () => {
        if (!isMounted.current || folderName.trim() === "") return
        onSave(
            folderName.trim(),
            selectedType,
            selectedType === "custom" ? customIconId : undefined,
            initialData.id,
        )
        logger.debug(`${mode === "create" ? "Creating" : "Updating"} folder`, {
            name: folderName.trim(),
            type: selectedType,
            customIconId: selectedType === "custom" ? customIconId : undefined,
            parentId: parentFolderId,
            id: initialData.id,
        })
        if (mode === "create") {
            setFolderName("")
            setSelectedType("custom")
            setCustomIconId("file")
        }
        onClose()
    }

    function handleCancel() {
        handleCancelRef.current()
    }

    const buttonStyle: ViewStyle =
        folderName.trim() === "" ? { ...styles.disabledButton } : {}
    const modalTitle =
        mode === "create" ? "Crear Nueva Carpeta" : "Editar Carpeta"
    const actionButtonText =
        mode === "create" ? "Crear Carpeta" : "Actualizar Carpeta"

    return (
        <BaseModal
            isVisible={isVisible}
            onClose={handleCancel}
            dismissOnBackdropPress={false}
        >
            <Animated.View
                style={[
                    styles.modalContent,
                    {
                        backgroundColor: colors.background,
                        transform: [{ translateX }],
                    },
                ]}
                {...panHandlers}
            >
                <View style={styles.headerBar}>
                    <View
                        style={[
                            styles.closeIndicator,
                            { backgroundColor: colors.border }, // Use border color for subtle look
                        ]}
                    />
                    <Text
                        variant="md"
                        weight="bold"
                        style={[styles.title, { color: colors.text }]}
                    >
                        {modalTitle}
                    </Text>
                </View>

                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContentContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View
                        style={styles.container}
                        testID={`folder-${mode}-modal`}
                    >
                        <Stack spacing={20}>
                            <Stack spacing={6}>
                                <Text
                                    weight="medium"
                                    style={{ color: colors.text }}
                                >
                                    Nombre de la Carpeta
                                </Text>
                                <TextField
                                    placeholder="Ingresa el nombre de la carpeta"
                                    value={folderName}
                                    onChangeText={setFolderName}
                                    testID="folder-name-input"
                                    style={styles.textField} // Use specific style if needed
                                />
                            </Stack>

                            <Stack spacing={6}>
                                <Text
                                    weight="medium"
                                    style={{ color: colors.text }}
                                >
                                    Tipo de Carpeta
                                </Text>
                                <View style={styles.typesOuterContainer}>
                                    {folderTypes.map((item) => (
                                        <TouchableOpacity
                                            key={item.type}
                                            onPress={() =>
                                                handleTypeSelect(item.type)
                                            }
                                            activeOpacity={0.7}
                                            style={[
                                                styles.folderCardWrapper,
                                                {
                                                    borderColor:
                                                        selectedType ===
                                                        item.type
                                                            ? colors.primary
                                                            : colors.border,
                                                },
                                            ]}
                                        >
                                            <FolderCard
                                                title={item.label}
                                                type={item.type}
                                                onPress={() =>
                                                    handleTypeSelect(item.type)
                                                }
                                                testID={`folder-type-${item.type}`}
                                                onToggleFavorite={() => {}}
                                                selected={
                                                    selectedType === item.type
                                                }
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </Stack>

                            <View style={styles.iconSelectorContainer}>
                                {showCustomSelector &&
                                    selectedType === "custom" && (
                                        <CustomIconSelector
                                            selectedIconId={customIconId}
                                            onSelectIcon={handleIconSelect}
                                        />
                                    )}
                            </View>
                        </Stack>
                    </View>
                </ScrollView>

                <View
                    style={[styles.footer, { borderTopColor: colors.border }]}
                >
                    <Row
                        justify="space-between"
                        align="center"
                        style={styles.buttonRow}
                        spacing={15} // Add gap between buttons
                    >
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Cancelar"
                                onPress={handleCancel}
                                testID="cancel-button"
                                variant="outline" // Use outline variant for cancel
                            />
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button
                                title={actionButtonText}
                                onPress={handleSave}
                                style={buttonStyle}
                                disabled={folderName.trim() === ""}
                                testID={
                                    mode === "create"
                                        ? "create-button"
                                        : "update-button"
                                }
                            />
                        </View>
                    </Row>
                </View>
            </Animated.View>
        </BaseModal>
    )
}

const styles = StyleSheet.create({
    modalContent: {
        height: "85%", // Take up most of the screen height
        width: "100%",
        borderTopLeftRadius: 20, // Rounded corners at the top
        borderTopRightRadius: 20,
        overflow: "hidden", // Clip content to rounded corners
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingBottom: 30, // Padding at the bottom of scroll content
    },
    container: {
        paddingHorizontal: 20,
        paddingTop: 10, // Reduced top padding inside scroll view
        paddingBottom: 20, // Add padding at the bottom inside scroll view
        flex: 1,
    },
    headerBar: {
        paddingTop: 12, // Adjust top padding for handle
        paddingBottom: 12, // Bottom padding
        paddingHorizontal: 20,
        alignItems: "center",
        borderBottomWidth: StyleSheet.hairlineWidth,
        width: "100%",
    },
    title: {
        marginVertical: 4, // Reduced vertical margin
        textAlign: "center",
        fontSize: 18, // Slightly larger title
    },
    closeIndicator: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        marginBottom: 8, // Space below handle
        alignSelf: "center",
    },
    textField: {
        width: "100%",
    },
    typesOuterContainer: {
        width: "100%",
        marginTop: 4, // Add margin top for spacing
    },
    folderCardWrapper: {
        borderWidth: 1.5, // Slightly thicker border
        borderRadius: 12, // Consistent border radius
        marginBottom: 10, // Increased space between type options
        overflow: "hidden",
    },
    iconSelectorContainer: {
        width: "100%",
        minHeight: 80, // Adjust min height if needed
        marginTop: 10,
        marginBottom: 10,
    },
    footer: {
        padding: 20,
        borderTopWidth: StyleSheet.hairlineWidth, // Separator line
        width: "100%",
    },
    buttonRow: {
        width: "100%",
    },
    buttonContainer: {
        flex: 1, // Make buttons take equal space
    },
    disabledButton: {
        opacity: 0.5,
    },
})
