import React, { useEffect, useMemo, useRef, useState } from "react"
import {
    Animated,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { BaseModal } from "../../../common/modal"
import { Stack } from "../../layout"
import { Text } from "../../typography"
import { TextField } from "../../form"
import { FolderCard } from "../../cards"
import { Button } from "../../button"
import { useDismissGesture } from "../../gestures/useDismissGesture.ts"
import { LoggingService } from "../../../../services/monitoring/loggingService"
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
    mode?: "create" | "edit"
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
    const logger = LoggingService.getLogger?.("UnifiedFolderModal") ?? {
        debug: console.debug,
    }
    const isMounted = useRef(false)
    const { height: windowHeight, width: windowWidth } =
        Dimensions.get("window")

    const [folderName, setFolderName] = useState(initialData.name ?? "")
    const [selectedType, setSelectedType] = useState<FolderType>(
        initialData.type ?? "custom",
    )
    const [customIconId, setCustomIconId] = useState(
        initialData.customIconId ?? "file",
    )
    const [showCustomSelector, setShowCustomSelector] = useState(
        (initialData.type ?? "custom") === "custom",
    )
    const [iconSelectorHeight, setIconSelectorHeight] = useState(190)

    const fadeAnim = useRef(
        new Animated.Value(showCustomSelector ? 1 : 0),
    ).current
    const animateIconSelector = (visible: boolean) => {
        return new Promise<void>((resolve) => {
            Animated.timing(fadeAnim, {
                toValue: visible ? 1 : 0,
                duration: 180,
                useNativeDriver: true,
            }).start(() => resolve())
        })
    }

    const { translateX, panHandlers, resetPosition } = useDismissGesture({
        onDismiss: () => handleCancel(),
        direction: "horizontal",
    })

    const folderTypes = useMemo(
        () => [
            { type: "travel" as const, label: "Viaje" },
            { type: "medical" as const, label: "Médico" },
            { type: "car" as const, label: "Vehículo" },
            { type: "education" as const, label: "Educación" },
            { type: "custom" as const, label: "Personalizado" },
        ],
        [],
    )

    useEffect(() => {
        if (isVisible) {
            setFolderName(initialData.name ?? "")
            const initialType = initialData.type ?? "custom"
            setSelectedType(initialType)
            setCustomIconId(initialData.customIconId ?? "file")

            const isCustom = initialType === "custom"
            setShowCustomSelector(isCustom)
            fadeAnim.setValue(isCustom ? 1 : 0)

            const t = setTimeout(() => {
                isMounted.current = true
                resetPosition?.()
            }, 50)

            return () => {
                clearTimeout(t)
                isMounted.current = false
            }
        }
    }, [isVisible, initialData, resetPosition, fadeAnim])

    /** Handles selection of a folder type, animating the custom icon selector if needed. */
    const handleTypeSelect = async (type: FolderType) => {
        if (!isMounted.current) return
        const isCustom = type === "custom"
        setSelectedType(type)

        if (isCustom && !showCustomSelector) {
            setShowCustomSelector(true)
            await animateIconSelector(true)
        } else if (!isCustom && showCustomSelector) {
            await animateIconSelector(false)
            setShowCustomSelector(false)
        }

        if (isCustom && !customIconId) setCustomIconId("file")
    }

    /** Handles saving the folder (create or update). */
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

    /** Handles cancelling the modal, resetting state if creating. */
    const handleCancel = () => {
        if (mode === "create") {
            setFolderName("")
            setSelectedType("custom")
            setCustomIconId("file")
        }
        onClose()
    }

    const buttonStyle: ViewStyle =
        folderName.trim() === "" ? styles.disabledButton : {}

    const modalTitle =
        mode === "create" ? "Crear nueva carpeta" : "Editar carpeta"

    const actionButtonText =
        mode === "create" ? "Crear carpeta" : "Actualizar carpeta"

    /** Renders the header section of the FlatList (Name input and Type label). */
    const listHeader = (
        <Stack spacing={20} style={styles.headerContent}>
            <Stack spacing={6}>
                <Text weight="medium" style={{ color: colors.text }}>
                    Nombre de la carpeta
                </Text>
                <TextField
                    placeholder="Ingresa el nombre de la carpeta"
                    value={folderName}
                    onChangeText={setFolderName}
                    testID="folder-name-input"
                    returnKeyType="done"
                />
            </Stack>
            <Text weight="medium" style={{ color: colors.text }}>
                Tipo de Carpeta
            </Text>
        </Stack>
    )

    /** Component to measure the layout height of the CustomIconSelector. */
    const MeasureCustomIconSelector = () => {
        return (
            <View
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout

                    if (height > 0 && height !== iconSelectorHeight) {
                        setIconSelectorHeight(height)
                    }
                }}
            >
                <CustomIconSelector
                    selectedIconId={customIconId}
                    onSelectIcon={setCustomIconId}
                />
            </View>
        )
    }

    /** Renders the footer section of the FlatList (animated icon selector). */
    const listFooter = (
        <>
            <View
                /* eslint-disable-next-line react-native/no-inline-styles */
                style={{
                    position: "relative",
                    height: iconSelectorHeight,
                    width: "100%",
                }}
            >
                {/* Conditionally render the animated icon selector */}
                {showCustomSelector ? (
                    <Animated.View
                        style={[
                            styles.iconSelectorContainer,

                            // eslint-disable-next-line react-native/no-inline-styles
                            {
                                opacity: fadeAnim,
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                            },
                        ]}
                    >
                        <MeasureCustomIconSelector />
                    </Animated.View>
                ) : null}
            </View>
            <View style={styles.emptyFooter} />
        </>
    )

    const wideModal: ViewStyle = {
        width: "100%",
        padding: 0,
        maxWidth: undefined,
        height: "100%",
        borderRadius: 0,
    }

    return (
        <BaseModal
            isVisible={isVisible}
            onClose={handleCancel}
            dismissOnBackdropPress={false}
            containerStyle={wideModal}
        >
            <SafeAreaView style={styles.safeArea}>
                <Animated.View
                    style={[
                        styles.modalContent,
                        {
                            backgroundColor: colors.background,
                            transform: [{ translateX }],
                            maxHeight: windowHeight,
                            maxWidth: windowWidth,
                        },
                    ]}
                    {...panHandlers}
                >
                    {/* Drag handle & title */}
                    <View
                        style={[
                            styles.headerBar,
                            { borderBottomColor: colors.border },
                        ]}
                    >
                        {/* Visual indicator for swiping */}
                        <View
                            style={[
                                styles.closeIndicator,
                                { backgroundColor: colors.border },
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

                    {/* Body */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        style={styles.flex}
                        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
                    >
                        <FlatList
                            data={folderTypes}
                            keyExtractor={(item) => item.type}
                            numColumns={2}
                            ListHeaderComponent={listHeader}
                            ListFooterComponent={listFooter}
                            columnWrapperStyle={styles.columnWrapper}
                            contentContainerStyle={styles.listContentContainer}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={true}
                            initialNumToRender={10}
                            style={styles.flatList}
                            renderItem={({ item }) => (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={item.label}
                                    onPress={() => handleTypeSelect(item.type)}
                                    style={[
                                        styles.folderCardWrapper,

                                        {
                                            borderColor:
                                                selectedType === item.type
                                                    ? colors.primary
                                                    : colors.border + "50",
                                        },
                                    ]}
                                >
                                    <FolderCard
                                        folderId={item.type}
                                        title={item.label}
                                        type={item.type}
                                        selected={selectedType === item.type}
                                        onPress={() =>
                                            handleTypeSelect(item.type)
                                        }
                                        onToggleFavorite={() => {}}
                                        testID={`folder-type-${item.type}`}
                                    />
                                </Pressable>
                            )}
                        />
                    </KeyboardAvoidingView>

                    {/* Footer buttons */}
                    <View
                        style={[
                            styles.footer,
                            { borderTopColor: colors.border },
                        ]}
                    >
                        {/* Cancel Button */}
                        <Button
                            title="Cancelar"
                            onPress={handleCancel}
                            variant="outline"
                            style={styles.fullWidthBtn}
                            testID="cancel-button"
                        />
                        {/* Save/Update Button */}
                        <Button
                            title={actionButtonText}
                            onPress={handleSave}
                            style={[styles.fullWidthBtn, buttonStyle]}
                            disabled={folderName.trim() === ""}
                            testID={
                                mode === "create"
                                    ? "create-button"
                                    : "update-button"
                            }
                        />
                    </View>
                </Animated.View>
            </SafeAreaView>
        </BaseModal>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    flex: {
        flex: 1,
    },
    flatList: {
        flex: 1,
    },
    modalContent: {
        flex: 1,
        width: "100%",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        overflow: "hidden",

        display: "flex",
        flexDirection: "column",
    },
    headerBar: {
        paddingTop: 12,
        paddingBottom: 16,
        paddingHorizontal: 20,
        alignItems: "center",
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    closeIndicator: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        marginBottom: 12,
    },
    title: {
        marginVertical: 4,
        textAlign: "center",
        fontSize: 18,
    },
    listContentContainer: {
        paddingBottom: 80,
        flexGrow: 1,
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    columnWrapper: {
        justifyContent: "space-between",
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    folderCardWrapper: {
        borderWidth: 2,
        borderRadius: 12,
        flex: 0.48,
        overflow: "hidden",
    },
    footer: {
        padding: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingBottom: Platform.OS === "ios" ? 30 : 20,
    },
    fullWidthBtn: {
        alignSelf: "stretch",
        marginBottom: 12,
    },
    disabledButton: {
        opacity: 0.5,
    },
    emptyFooter: {
        height: 50,
    },
    iconSelectorContainer: {
        paddingHorizontal: 20,
        marginTop: 10,
        width: "100%",
    },
})
