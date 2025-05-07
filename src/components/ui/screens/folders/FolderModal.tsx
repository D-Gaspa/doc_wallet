import React, { useEffect, useMemo, useRef, useState } from "react"
import {
    Animated,
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
import {
    BASE_ICON_OPTIONS_CONFIG,
    CustomIconSelector,
    resolveColorRef,
    ThemeColors as CustomIconSelectorThemeColors,
} from "./CustomIconSelector"
import { FA6IconName } from "../../../../types/icons"

export type FolderType = "travel" | "medical" | "car" | "education" | "custom"

interface UnifiedFolderModalProps {
    isVisible: boolean
    onClose: () => void
    onSave: (
        name: string,
        type: FolderType,
        customIconId?: FA6IconName,
        customIconColor?: string,
        folderId?: string,
    ) => void
    mode?: "create" | "edit"
    initialData?: {
        id?: string
        name?: string
        type?: FolderType
        customIconId?: FA6IconName
        customIconColor?: string
        favorite?: boolean
    }
}

export function FolderModal({
    isVisible,
    onClose,
    onSave,
    mode = "create",
    initialData = {},
}: UnifiedFolderModalProps) {
    const { colors } = useTheme()
    const isMounted = useRef(false)

    const [folderName, setFolderName] = useState(initialData.name ?? "")
    const [selectedType, setSelectedType] = useState<FolderType>(
        initialData.type ?? "custom",
    )
    const defaultInitialIconName =
        initialData.customIconId ??
        (BASE_ICON_OPTIONS_CONFIG.find((opt) => opt.id === "folder")?.faName ||
            "folder")
    const defaultInitialIconColor =
        initialData.customIconColor ??
        resolveColorRef(
            BASE_ICON_OPTIONS_CONFIG.find(
                (opt) => opt.faName === defaultInitialIconName,
            )?.colorRef || "primary",
            colors as unknown as CustomIconSelectorThemeColors,
        )
    const [selectedCustomIconName, setSelectedCustomIconName] =
        useState<FA6IconName | null>(defaultInitialIconName)
    const [selectedCustomIconColor, setSelectedCustomIconColor] = useState<
        string | null
    >(defaultInitialIconColor)
    const [showCustomSelectorUI, setShowCustomSelectorUI] = useState(
        (initialData.type ?? "custom") === "custom",
    )
    const [iconSelectorHeight, setIconSelectorHeight] = useState(220)
    const fadeAnim = useRef(
        new Animated.Value(showCustomSelectorUI ? 1 : 0),
    ).current

    const animateIconSelector = (visible: boolean) => {
        return new Promise<void>((resolve) => {
            Animated.timing(fadeAnim, {
                toValue: visible ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }).start(() => resolve())
        })
    }

    const folderTypes = useMemo(
        () => [
            {
                type: "travel" as const,
                label: "Viaje",
                defaultIcon: "plane-departure" as FA6IconName,
                defaultColorRef: "#E74C3C",
            },
            {
                type: "medical" as const,
                label: "Médico",
                defaultIcon: "briefcase-medical" as FA6IconName,
                defaultColorRef: "#3498DB",
            },
            {
                type: "car" as const,
                label: "Vehículo",
                defaultIcon: "car" as FA6IconName,
                defaultColorRef: "#9B59B6",
            },
            {
                type: "education" as const,
                label: "Educación",
                defaultIcon: "graduation-cap" as FA6IconName,
                defaultColorRef: "#2ECC71",
            },
            {
                type: "custom" as const,
                label: "Personalizado",
                defaultIcon: "folder" as FA6IconName,
                defaultColorRef: "primary",
            },
        ],
        [],
    )

    const prevIsVisible = useRef(isVisible)
    const prevInitialDataId = useRef(initialData.id)

    useEffect(() => {
        if (
            isVisible &&
            (!prevIsVisible.current ||
                initialData.id !== prevInitialDataId.current)
        ) {
            const currentType = initialData.type ?? "custom"
            let iconForInit: FA6IconName = "folder"
            let colorForInit: string | null = null

            if (currentType === "custom") {
                iconForInit =
                    initialData.customIconId ||
                    BASE_ICON_OPTIONS_CONFIG.find((opt) => opt.id === "folder")
                        ?.faName ||
                    "folder"
                colorForInit =
                    initialData.customIconColor ||
                    resolveColorRef(
                        BASE_ICON_OPTIONS_CONFIG.find(
                            (opt) => opt.faName === iconForInit,
                        )?.colorRef || "primary",
                        colors as unknown as CustomIconSelectorThemeColors,
                    )
            } else {
                const predefinedType = folderTypes.find(
                    (ft) => ft.type === currentType,
                )
                if (predefinedType) {
                    iconForInit = predefinedType.defaultIcon
                    colorForInit = resolveColorRef(
                        predefinedType.defaultColorRef,
                        colors as unknown as CustomIconSelectorThemeColors,
                    )
                }
            }
            const isCustomUIToShow = currentType === "custom"

            setSelectedType(currentType)
            setSelectedCustomIconName(iconForInit)
            setSelectedCustomIconColor(colorForInit)
            setShowCustomSelectorUI(isCustomUIToShow)
            fadeAnim.setValue(isCustomUIToShow ? 1 : 0)

            const mountTimer = setTimeout(() => {
                isMounted.current = true
            }, 10)
            prevIsVisible.current = isVisible
            prevInitialDataId.current = initialData.id
            return () => clearTimeout(mountTimer)
        } else if (!isVisible && prevIsVisible.current) {
            isMounted.current = false
            if (mode === "create") {
                const defaultFolderType = folderTypes.find(
                    (ft) => ft.type === "custom",
                )!
                setFolderName("")
                setSelectedType("custom")
                setSelectedCustomIconName(defaultFolderType.defaultIcon)
                setSelectedCustomIconColor(
                    resolveColorRef(
                        defaultFolderType.defaultColorRef,
                        colors as unknown as CustomIconSelectorThemeColors,
                    ),
                )
                setShowCustomSelectorUI(true)
                fadeAnim.setValue(1)
            }
            prevIsVisible.current = isVisible
            prevInitialDataId.current = undefined
        } else {
            if (isVisible && initialData.id !== prevInitialDataId.current) {
                prevInitialDataId.current = initialData.id
            }
            if (isVisible !== prevIsVisible.current) {
                prevIsVisible.current = isVisible
            }
        }
    }, [isVisible, initialData, mode, fadeAnim, folderTypes, colors])

    const handleTypeSelect = async (type: FolderType) => {
        const isNowCustom = type === "custom"
        setSelectedType(type)

        if (isNowCustom) {
            if (!selectedCustomIconName) {
                const defaultCustomIconConfig = BASE_ICON_OPTIONS_CONFIG.find(
                    (opt) => opt.id === "folder",
                )
                setSelectedCustomIconName(
                    defaultCustomIconConfig?.faName || "folder",
                )
                setSelectedCustomIconColor(
                    resolveColorRef(
                        defaultCustomIconConfig?.colorRef || "primary",
                        colors as unknown as CustomIconSelectorThemeColors,
                    ),
                )
            }
            await animateIconSelector(true)
            setShowCustomSelectorUI(true)
        } else {
            const predefinedType = folderTypes.find((ft) => ft.type === type)
            if (predefinedType) {
                setFolderName(predefinedType.label)
            }
            await animateIconSelector(false)
            setShowCustomSelectorUI(false)
        }
    }

    const handleCustomIconSelectionChange = (selection: {
        iconName: FA6IconName
        iconColor: string
    }) => {
        setSelectedCustomIconName(selection.iconName)
        setSelectedCustomIconColor(selection.iconColor)
        if (selectedType !== "custom") {
            setSelectedType("custom")
        }
        if (!showCustomSelectorUI) {
            setShowCustomSelectorUI(true)
            animateIconSelector(true).then((r) => r)
        }
    }

    const handleSave = () => {
        if (folderName.trim() === "") {
            return
        }

        if (selectedType === "custom") {
            const customIconToSave =
                selectedCustomIconName ||
                BASE_ICON_OPTIONS_CONFIG.find((opt) => opt.id === "folder")
                    ?.faName ||
                "folder"
            const customColorToSave =
                selectedCustomIconColor ||
                resolveColorRef(
                    BASE_ICON_OPTIONS_CONFIG.find(
                        (opt) => opt.faName === customIconToSave,
                    )?.colorRef || "primary",
                    colors as unknown as CustomIconSelectorThemeColors,
                )
            onSave(
                folderName.trim(),
                selectedType,
                customIconToSave,
                customColorToSave,
                initialData.id,
            )
        } else {
            onSave(
                folderName.trim(),
                selectedType,
                undefined,
                undefined,
                initialData.id,
            )
        }
        onClose()
    }
    const handleCancel = () => {
        onClose()
    }

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
                    onSubmitEditing={handleSave}
                />
            </Stack>
            <Text weight="medium" style={{ color: colors.text }}>
                Tipo de Carpeta
            </Text>
        </Stack>
    )
    const listFooter = (
        <>
            {showCustomSelectorUI && (
                <Animated.View
                    style={[
                        styles.iconSelectorContainer,
                        {
                            opacity: fadeAnim,
                        },
                    ]}
                    onLayout={(event) => {
                        const { height } = event.nativeEvent.layout
                        if (
                            height > 0 &&
                            Math.abs(height - iconSelectorHeight) > 1
                        ) {
                            setIconSelectorHeight(height)
                        }
                    }}
                >
                    <CustomIconSelector
                        currentIconName={selectedCustomIconName}
                        currentIconColor={selectedCustomIconColor}
                        onSelectionChange={handleCustomIconSelectionChange}
                    />
                </Animated.View>
            )}
            <View style={styles.emptyFooter} />
        </>
    )

    const buttonStyle: ViewStyle =
        folderName.trim() === "" ? styles.disabledButton : {}
    const modalTitle =
        mode === "create" ? "Crear Nueva Carpeta" : "Editar Carpeta"
    const actionButtonText =
        mode === "create" ? "Crear Carpeta" : "Actualizar Carpeta"

    return (
        <BaseModal
            isVisible={isVisible}
            onClose={handleCancel}
            dismissOnBackdropPress={false}
            containerStyle={{
                ...styles.wideModal,
            }}
        >
            <SafeAreaView
                style={[
                    styles.safeArea,
                    { backgroundColor: colors.background },
                ]}
            >
                {/* Header (Positioned at the top) */}
                <View
                    style={[
                        styles.headerBar,
                        { borderBottomColor: colors.border },
                    ]}
                >
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

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.kavWrapper}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
                >
                    <FlatList
                        data={folderTypes}
                        keyExtractor={(item) => item.type}
                        numColumns={2}
                        ListHeaderComponent={listHeader}
                        ListFooterComponent={listFooter}
                        columnWrapperStyle={styles.columnWrapper}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={true}
                        initialNumToRender={folderTypes.length}
                        windowSize={5}
                        style={styles.flatList}
                        contentContainerStyle={styles.listContentContainer}
                        renderItem={({ item }) => {
                            const isSelectedType = selectedType === item.type
                            let iconToDisplay = item.defaultIcon
                            let colorForDisplayIcon = resolveColorRef(
                                item.defaultColorRef,
                                colors as unknown as CustomIconSelectorThemeColors,
                            )
                            if (item.type === "custom") {
                                iconToDisplay =
                                    selectedCustomIconName || item.defaultIcon
                                colorForDisplayIcon =
                                    selectedCustomIconColor ||
                                    colorForDisplayIcon
                            }
                            return (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={item.label}
                                    onPress={() => handleTypeSelect(item.type)}
                                    style={[
                                        styles.folderCardWrapper,
                                        // eslint-disable-next-line react-native/no-color-literals,react-native/no-inline-styles
                                        {
                                            borderColor: isSelectedType
                                                ? colors.primary
                                                : colors.border + "50",
                                            backgroundColor: isSelectedType
                                                ? item.type === "custom"
                                                    ? (selectedCustomIconColor ||
                                                          colors.primary) + "10"
                                                    : colors.primary + "10"
                                                : "transparent",
                                        },
                                    ]}
                                >
                                    <FolderCard
                                        folderId={`type-card-${item.type}`}
                                        title={item.label}
                                        type={item.type}
                                        customIconId={
                                            item.type === "custom"
                                                ? iconToDisplay
                                                : undefined
                                        }
                                        customIconColor={
                                            item.type === "custom"
                                                ? colorForDisplayIcon
                                                : undefined
                                        }
                                        selected={isSelectedType}
                                        onPress={() =>
                                            handleTypeSelect(item.type)
                                        }
                                        showTags={false}
                                    />
                                </Pressable>
                            )
                        }}
                    />
                </KeyboardAvoidingView>

                {/* Footer (Positioned at the bottom) */}
                <View
                    style={[styles.footer, { borderTopColor: colors.border }]}
                >
                    <Button
                        title="Cancelar"
                        onPress={handleCancel}
                        variant="outline"
                        style={styles.fullWidthBtn}
                        testID="cancel-button"
                    />
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
            </SafeAreaView>
        </BaseModal>
    )
}

const styles = StyleSheet.create({
    wideModal: {
        width: "100%",
        height: "100%",
        padding: 0,
        margin: 0,
        borderRadius: 0,
        justifyContent: "flex-end",
    },
    safeArea: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
    },
    headerBar: {
        paddingTop: 12,
        paddingBottom: 16,
        paddingHorizontal: 20,
        alignItems: "center",
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexShrink: 0,
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
    kavWrapper: {
        flex: 1,
    },
    flatList: {
        flex: 1,
    },
    listContentContainer: {
        paddingHorizontal: 0,
        paddingBottom: 20,
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
        width: "48%",
        overflow: "hidden",
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingBottom: Platform.OS === "ios" ? 30 : 20,
        flexShrink: 0,
    },
    fullWidthBtn: {
        alignSelf: "stretch",
        marginBottom: 12,
    },
    disabledButton: {
        opacity: 0.5,
    },
    emptyFooter: {
        height: 30,
    },
    iconSelectorContainer: {
        paddingHorizontal: 20,
        marginTop: 10,
        width: "100%",
    },
})
