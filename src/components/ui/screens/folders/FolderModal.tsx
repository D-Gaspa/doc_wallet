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
}

export function UnifiedFolderModal({
    isVisible,
    onClose,
    onSave,
    mode = "create",
    initialData = {},
}: UnifiedFolderModalProps) {
    const { colors } = useTheme()
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
            { type: "travel" as const, label: "Viaje", defaultIcon: "travel" },
            {
                type: "medical" as const,
                label: "Médico",
                defaultIcon: "medical",
            },
            { type: "car" as const, label: "Vehículo", defaultIcon: "car" },
            {
                type: "education" as const,
                label: "Educación",
                defaultIcon: "education",
            },
            {
                type: "custom" as const,
                label: "Propio",
                defaultIcon: "file",
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
            setFolderName(initialData.name ?? "")
            const initialType = initialData.type ?? "custom"
            setSelectedType(initialType)
            const initialCustomIcon =
                initialData.customIconId ??
                folderTypes.find((f) => f.type === initialType)?.defaultIcon ??
                "file"
            setCustomIconId(initialCustomIcon)

            const isCustom = initialType === "custom"
            setShowCustomSelector(isCustom)
            fadeAnim.setValue(isCustom ? 1 : 0)
            resetPosition?.()
            const mountTimer = setTimeout(() => {
                isMounted.current = true
            }, 10)
            prevIsVisible.current = isVisible
            prevInitialDataId.current = initialData.id
            return () => clearTimeout(mountTimer)
        } else if (!isVisible && prevIsVisible.current) {
            isMounted.current = false
            if (mode === "create") {
                setFolderName("")
                setSelectedType("custom")
                setCustomIconId("file")
                setShowCustomSelector(true)
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
    }, [
        isVisible,
        initialData.id,
        initialData.name,
        initialData.type,
        initialData.customIconId,
        mode,
        resetPosition,
        fadeAnim,
        folderTypes,
    ])

    const handleTypeSelect = async (type: FolderType) => {
        if (type === selectedType && mode !== "create") {
            if (type !== "custom") {
                const predefinedType = folderTypes.find(
                    (ft) => ft.type === type,
                )
                if (predefinedType && folderName !== predefinedType.label) {
                    setFolderName(predefinedType.label)
                }
            }
            return
        }

        const isCustom = type === "custom"
        setSelectedType(type)

        if (isCustom) {
            if (
                folderTypes.some(
                    (ft) => ft.label === folderName && ft.type !== "custom",
                )
            ) {
                setFolderName("")
            }

            if (!showCustomSelector) {
                setShowCustomSelector(true)
                await animateIconSelector(true)
            }
            if (!customIconId || customIconId === "file") {
                setCustomIconId("file")
            }
        } else {
            if (showCustomSelector) {
                await animateIconSelector(false)
                setShowCustomSelector(false)
            }
            const predefinedType = folderTypes.find((ft) => ft.type === type)
            if (predefinedType) {
                setFolderName(predefinedType.label)
            }
        }
    }

    const handleSave = () => {
        if (folderName.trim() === "") {
            return
        }
        const finalIconId = selectedType === "custom" ? customIconId : undefined
        onSave(folderName.trim(), selectedType, finalIconId, initialData.id)
        onClose()
    }

    const handleCancel = () => {
        onClose()
    }

    const buttonStyle: ViewStyle =
        folderName.trim() === "" ? styles.disabledButton : {}

    const modalTitle =
        mode === "create" ? "Crear nueva carpeta" : "Editar carpeta"

    const actionButtonText =
        mode === "create" ? "Crear carpeta" : "Actualizar carpeta"

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
                {showCustomSelector && (
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
                )}
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
                            windowSize={5}
                            maxToRenderPerBatch={10}
                            style={styles.flatList}
                            renderItem={({ item }) => {
                                const isCustomTypeCard = item.type === "custom"
                                return (
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={item.label}
                                        onPress={() =>
                                            handleTypeSelect(item.type)
                                        }
                                        style={[
                                            styles.folderCardWrapper,
                                            // eslint-disable-next-line react-native/no-color-literals,react-native/no-inline-styles
                                            {
                                                borderColor:
                                                    selectedType === item.type
                                                        ? colors.primary
                                                        : colors.border + "50",
                                                backgroundColor:
                                                    isCustomTypeCard &&
                                                    selectedType === item.type
                                                        ? colors.primary + "10"
                                                        : "transparent",
                                            },
                                        ]}
                                    >
                                        <FolderCard
                                            folderId={item.type}
                                            title={item.label}
                                            type={item.type}
                                            subtitle={
                                                isCustomTypeCard
                                                    ? "Personalizable"
                                                    : undefined
                                            }
                                            selected={
                                                selectedType === item.type
                                            }
                                            onPress={() =>
                                                handleTypeSelect(item.type)
                                            }
                                            showTags={false}
                                            displayIconId={
                                                isCustomTypeCard
                                                    ? customIconId
                                                    : undefined
                                            }
                                            testID={`folder-type-${item.type}`}
                                        />
                                    </Pressable>
                                )
                            }}
                        />
                    </KeyboardAvoidingView>

                    <View
                        style={[
                            styles.footer,
                            { borderTopColor: colors.border },
                        ]}
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
        paddingHorizontal: 20,
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
    },
    folderCardWrapper: {
        borderWidth: 2,
        borderRadius: 12,
        width: "48%",
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
        marginTop: 0,
        width: "100%",
    },
})
