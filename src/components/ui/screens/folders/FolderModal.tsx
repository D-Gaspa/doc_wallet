import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    View,
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
                label: "Propio",
                defaultIcon: "folder" as FA6IconName,
                defaultColorRef: "primary",
            },
        ],
        [],
    )

    const calculateInitialValues = useCallback(() => {
        const type = initialData?.type ?? "custom"
        const name = initialData?.name ?? ""
        let iconName: FA6IconName | null = null
        let iconColor: string | null

        if (type === "custom") {
            iconName =
                initialData?.customIconId ||
                BASE_ICON_OPTIONS_CONFIG.find((opt) => opt.id === "folder")
                    ?.faName ||
                "folder"
            iconColor =
                initialData?.customIconColor ||
                resolveColorRef(
                    BASE_ICON_OPTIONS_CONFIG.find(
                        (opt) => opt.faName === iconName,
                    )?.colorRef || "primary",
                    colors as unknown as CustomIconSelectorThemeColors,
                )
        } else {
            const predefinedType = folderTypes?.find((ft) => ft.type === type)
            if (predefinedType) {
                iconName = predefinedType.defaultIcon
                iconColor = resolveColorRef(
                    predefinedType.defaultColorRef,
                    colors as unknown as CustomIconSelectorThemeColors,
                )
            } else {
                iconName = "folder"
                iconColor = resolveColorRef(
                    "primary",
                    colors as unknown as CustomIconSelectorThemeColors,
                )
            }
        }
        return { name, type, iconName, iconColor }
    }, [initialData, folderTypes, colors]) // Dependencies for recalculation

    // --- Initialize State using the calculated values ---
    const initialValues = useMemo(
        () => calculateInitialValues(),
        [calculateInitialValues],
    )

    const [folderName, setFolderName] = useState<string>(initialValues.name)
    const [selectedType, setSelectedType] = useState<FolderType>(
        initialValues.type,
    )
    const [selectedCustomIconName, setSelectedCustomIconName] =
        useState<FA6IconName | null>(initialValues.iconName)
    const [selectedCustomIconColor, setSelectedCustomIconColor] = useState<
        string | null
    >(initialValues.iconColor)

    // --- Initialize Refs using the calculated values ---
    const initialNameRef = useRef<string>(initialValues.name)
    const initialTypeRef = useRef<FolderType>(initialValues.type)
    const initialIconNameRef = useRef<FA6IconName | null>(
        initialValues.iconName,
    )
    const initialIconColorRef = useRef<string | null>(initialValues.iconColor)

    // --- Other State/Refs ---
    const [showCustomSelectorUI, setShowCustomSelectorUI] = useState(
        initialValues.type === "custom",
    )
    const [iconSelectorHeight, setIconSelectorHeight] = useState(220)
    const fadeAnim = useRef(
        new Animated.Value(showCustomSelectorUI ? 1 : 0),
    ).current
    const prevIsVisible = useRef(isVisible)

    // Animation function
    const animateIconSelector = (visible: boolean) => {
        return new Promise<void>((resolve) => {
            Animated.timing(fadeAnim, {
                toValue: visible ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }).start(() => resolve())
        })
    }

    useEffect(() => {
        const currentInitialVals = calculateInitialValues()

        if (isVisible && !prevIsVisible.current) {
            console.log(
                `FolderModal OPENING - Mode: ${mode}, Initial Name: ${currentInitialVals.name}`,
            )

            const isCustomUIToShow = currentInitialVals.type === "custom"

            setFolderName(currentInitialVals.name)
            setSelectedType(currentInitialVals.type)
            setSelectedCustomIconName(currentInitialVals.iconName)
            setSelectedCustomIconColor(currentInitialVals.iconColor)
            setShowCustomSelectorUI(isCustomUIToShow)
            fadeAnim.setValue(isCustomUIToShow ? 1 : 0)

            initialNameRef.current = currentInitialVals.name
            initialTypeRef.current = currentInitialVals.type
            initialIconNameRef.current = currentInitialVals.iconName
            initialIconColorRef.current = currentInitialVals.iconColor
        } else if (!isVisible && prevIsVisible.current) {
            console.log(`FolderModal CLOSING - Mode was: ${mode}`)
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
            initialNameRef.current = ""
            initialTypeRef.current = "custom"
            initialIconNameRef.current = null
            initialIconColorRef.current = null
        }

        prevIsVisible.current = isVisible
    }, [
        isVisible,
        initialData,
        mode,
        colors,
        fadeAnim,
        folderTypes,
        calculateInitialValues,
    ])

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
            const initialTypeLabel = folderTypes.find(
                (ft) => ft.type === initialTypeRef.current,
            )?.label
            if (
                predefinedType &&
                (folderName.trim() === "" || folderName === initialTypeLabel)
            ) {
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

    const handleSave = useCallback(() => {
        if (folderName.trim() === "") return

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
                initialData?.id,
            )
        } else {
            onSave(
                folderName.trim(),
                selectedType,
                undefined,
                undefined,
                initialData?.id,
            )
        }
        onClose()
    }, [
        folderName,
        selectedType,
        selectedCustomIconName,
        selectedCustomIconColor,
        initialData?.id,
        onSave,
        onClose,
        colors,
    ])

    const handleCancel = useCallback(() => {
        onClose()
    }, [onClose])

    const hasChanges = useMemo(() => {
        if (mode !== "edit") return true

        const currentNameTrimmed = folderName?.trim() ?? ""
        const initialNameTrimmed = initialNameRef.current?.trim() ?? ""
        if (currentNameTrimmed !== initialNameTrimmed) {
            console.log(
                `Change detected: Name ('${initialNameTrimmed}' -> '${currentNameTrimmed}')`,
            )
            return true
        }

        const currentType = selectedType
        const initialType = initialTypeRef.current
        if (currentType !== initialType) {
            console.log(
                `Change detected: Type ('${initialType}' -> '${currentType}')`,
            )
            return true
        }

        if (currentType === "custom") {
            const currentIconName = selectedCustomIconName
            const initialIconName = initialIconNameRef.current
            if (currentIconName !== initialIconName) {
                console.log(
                    `Change detected: Icon Name ('${initialIconName}' -> '${currentIconName}')`,
                )
                return true
            }

            const currentIconColor = selectedCustomIconColor
            const initialIconColor = initialIconColorRef.current
            if (currentIconColor !== initialIconColor) {
                console.log(
                    `Change detected: Icon Color ('${initialIconColor}' -> '${currentIconColor}')`,
                )
                return true
            }
        }

        console.log("No changes detected for edit mode.")
        return false
    }, [
        mode,
        folderName,
        selectedType,
        selectedCustomIconName,
        selectedCustomIconColor,
    ])

    const modalTitle =
        mode === "create" ? "Crear Nueva Carpeta" : "Editar Carpeta"
    const saveButtonText =
        mode === "create" ? "Crear Carpeta" : "Actualizar Carpeta"

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
                        { opacity: fadeAnim },
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

    return (
        <BaseModal
            isVisible={isVisible}
            onClose={handleCancel}
            dismissOnBackdropPress={false}
            containerStyle={styles.wideModal}
        >
            <SafeAreaView
                style={[
                    styles.safeArea,
                    { backgroundColor: colors.background },
                ]}
            >
                {/* Header Bar */}
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

                {/* Keyboard Avoiding View and FlatList */}
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
                                        displayIconId={
                                            item.type !== "custom"
                                                ? iconToDisplay
                                                : undefined
                                        }
                                        selected={isSelectedType}
                                        onPress={() =>
                                            handleTypeSelect(item.type)
                                        }
                                        showTags={false}
                                        itemManagerShowAddTagButton={false}
                                    />
                                </Pressable>
                            )
                        }}
                    />
                </KeyboardAvoidingView>

                {/* Footer with Action Buttons */}
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
                        title={saveButtonText}
                        onPress={handleSave}
                        style={styles.fullWidthBtn}
                        disabled={
                            folderName.trim() === "" ||
                            (mode === "edit" && !hasChanges)
                        }
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
    iconSelectorContainer: {
        paddingHorizontal: 20,
        marginTop: 10,
        width: "100%",
    },
    emptyFooter: {
        height: 30,
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
})
