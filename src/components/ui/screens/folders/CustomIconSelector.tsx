import React, { useState } from "react"
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../../hooks/useTheme"
import { Text } from "../../typography"
import { FA6IconName } from "../../../../types/icons.ts"

export interface ThemeColors {
    primary: string
    error: string
    warning: string
    success: string
    text: string
    secondaryText: string
    border: string

    [key: string]: string
}

export const BASE_ICON_OPTIONS_CONFIG: {
    id: string
    faName: FA6IconName
    colorRef: string | keyof ThemeColors
}[] = [
    { id: "plane", faName: "plane", colorRef: "#E74C3C" },
    {
        id: "briefcase-medical",
        faName: "briefcase-medical",
        colorRef: "#3498DB",
    },
    { id: "car", faName: "car", colorRef: "#9B59B6" },
    { id: "graduation-cap", faName: "graduation-cap", colorRef: "#2ECC71" },
    { id: "folder", faName: "folder", colorRef: "primary" },
    { id: "star", faName: "star", colorRef: "warning" },
    { id: "heart", faName: "heart", colorRef: "error" },
    { id: "lightbulb", faName: "lightbulb", colorRef: "#F1C40F" },
    { id: "shield-halved", faName: "shield-halved", colorRef: "primary" },
    { id: "book", faName: "book", colorRef: "success" },
    { id: "key", faName: "key", colorRef: "warning" },

    // Work & Productivity
    { id: "briefcase", faName: "briefcase", colorRef: "secondaryText" },
    { id: "building-columns", faName: "building-columns", colorRef: "#4A90E2" },
    {
        id: "file-invoice-dollar",
        faName: "file-invoice-dollar",
        colorRef: "#50E3C2",
    },
    { id: "calculator", faName: "calculator", colorRef: "#7F8C8D" },

    // Home & Personal
    { id: "house-user", faName: "house-user", colorRef: "#F5A623" },
    { id: "shield-heart", faName: "shield-heart", colorRef: "#D0021B" },
    { id: "paw", faName: "paw", colorRef: "#BD10E0" },

    // Tech & Data
    { id: "database", faName: "database", colorRef: "primary" },
    { id: "microchip", faName: "microchip", colorRef: "#4A4A4A" },
    { id: "network-wired", faName: "network-wired", colorRef: "#55DDE0" },

    // Finance & Shopping
    { id: "piggy-bank", faName: "piggy-bank", colorRef: "#F8E71C" },
    { id: "landmark", faName: "landmark", colorRef: "#7B68EE" },
    { id: "wallet", faName: "wallet", colorRef: "#B8E986" },
    { id: "cart-shopping", faName: "cart-shopping", colorRef: "#417505" },

    // Travel & Location
    { id: "earth-americas", faName: "earth-americas", colorRef: "#0077B5" },
    { id: "map-location-dot", faName: "map-location-dot", colorRef: "#FF4136" },

    // Hobbies & Misc
    { id: "camera-retro", faName: "camera-retro", colorRef: "#8E44AD" },
    { id: "music", faName: "music", colorRef: "#2980B9" },
    { id: "palette", faName: "palette", colorRef: "#16A085" },
    { id: "gamepad", faName: "gamepad", colorRef: "#D35400" },

    // Nature & Environment
    { id: "tree", faName: "tree", colorRef: "#27AE60" },
    { id: "leaf", faName: "leaf", colorRef: "#82C91E" },
    { id: "seedling", faName: "seedling", colorRef: "#5C9212" },

    // Other useful generics
    { id: "paperclip", faName: "paperclip", colorRef: "secondaryText" },
    { id: "link", faName: "link", colorRef: "primary" },
    { id: "box-archive", faName: "box-archive", colorRef: "#795548" },
]

export const CUSTOM_ICON_COLOR_PALETTE: string[] = [
    "#E74C3C",
    "#F39C12",
    "#F1C40F",
    "#2ECC71",
    "#1ABC9C",
    "#3498DB",
    "#2980B9",
    "#9B59B6",
    "#8E44AD",
    "#34495E",
    "#7F8C8D",
    "#BDC3C7",
    "#D35400",
    "#C0392B",
    "#0077B5",
]

export function resolveColorRef(
    colorRef: string | keyof ThemeColors,
    themeColors: ThemeColors,
): string {
    if (themeColors[colorRef as string]) {
        return themeColors[colorRef as string]
    }
    return colorRef as string
}

export interface IconOption {
    id: string
    faName: FA6IconName
    color: string
}

interface CustomIconSelectorProps {
    currentIconName: FA6IconName | null
    currentIconColor: string | null
    onSelectionChange: (selection: {
        iconName: FA6IconName
        iconColor: string
    }) => void
}

export function CustomIconSelector({
    currentIconName,
    currentIconColor,
    onSelectionChange,
}: CustomIconSelectorProps) {
    const { colors } = useTheme()
    const iconDisplaySize = 28
    const previewIconSize = 48

    const [activeIconName, setActiveIconName] = useState<FA6IconName | null>(
        currentIconName,
    )
    const [activeColor, setActiveColor] = useState<string | null>(
        currentIconColor,
    )

    React.useEffect(() => {
        setActiveIconName(currentIconName)
        setActiveColor(currentIconColor)
    }, [currentIconName, currentIconColor])

    const iconOptions: IconOption[] = React.useMemo(() => {
        return BASE_ICON_OPTIONS_CONFIG.map((config) => ({
            id: config.id,
            faName: config.faName,
            color: resolveColorRef(config.colorRef, colors),
        }))
    }, [colors])

    const handleIconPress = (iconOpt: IconOption) => {
        const newIconName = iconOpt.faName
        const newColor =
            activeColor && activeIconName === newIconName
                ? activeColor
                : iconOpt.color

        setActiveIconName(newIconName)
        setActiveColor(newColor)
        onSelectionChange({ iconName: newIconName, iconColor: newColor })
    }

    const handleColorPress = (color: string) => {
        if (activeIconName) {
            setActiveColor(color)
            onSelectionChange({ iconName: activeIconName, iconColor: color })
        }
    }

    return (
        <View style={styles.container}>
            <Text
                weight="medium"
                style={[styles.title, { color: colors.text }]}
            >
                Selecciona un icono
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconsRowScrollContent}
            >
                <View style={styles.iconsRow}>
                    {iconOptions.map((iconOpt) => {
                        const isIconSelectedForEditing =
                            activeIconName === iconOpt.faName
                        return (
                            <TouchableOpacity
                                key={iconOpt.id}
                                style={[
                                    styles.iconItem,
                                    { borderColor: colors.border + "50" },
                                    isIconSelectedForEditing && {
                                        borderColor:
                                            activeColor || iconOpt.color,
                                        backgroundColor:
                                            (activeColor || iconOpt.color) +
                                            "20",
                                    },
                                ]}
                                onPress={() => handleIconPress(iconOpt)}
                                accessibilityLabel={`Icono ${iconOpt.faName}`}
                            >
                                <FontAwesome6
                                    name={iconOpt.faName}
                                    size={iconDisplaySize}
                                    color={
                                        isIconSelectedForEditing
                                            ? activeColor || iconOpt.color
                                            : colors.secondaryText
                                    }
                                    iconStyle="solid"
                                />
                            </TouchableOpacity>
                        )
                    })}
                </View>
            </ScrollView>

            {activeIconName && (
                <View style={styles.colorSelectionContainer}>
                    <Text
                        weight="medium"
                        style={[
                            styles.title,
                            styles.colorTitle,
                            { color: colors.text },
                        ]}
                    >
                        Selecciona un color
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.colorsRowScrollContent}
                    >
                        <View style={styles.colorsRow}>
                            {CUSTOM_ICON_COLOR_PALETTE.map((paletteColor) => {
                                const isColorSelected =
                                    activeColor === paletteColor
                                return (
                                    <TouchableOpacity
                                        key={paletteColor}
                                        style={[
                                            styles.colorSwatch,
                                            {
                                                backgroundColor: paletteColor,
                                                borderColor:
                                                    colors.border + "50",
                                            },
                                            isColorSelected && {
                                                borderColor: colors.primary,
                                                transform: [{ scale: 1.1 }],
                                            },
                                        ]}
                                        onPress={() =>
                                            handleColorPress(paletteColor)
                                        }
                                        accessibilityLabel={`Color ${paletteColor}`}
                                    />
                                )
                            })}
                        </View>
                    </ScrollView>
                </View>
            )}

            {/* Preview Area */}
            {activeIconName && activeColor && (
                <View style={styles.previewContainer}>
                    <Text
                        weight="medium"
                        style={[
                            styles.title,
                            styles.previewTitle,
                            { color: colors.text },
                        ]}
                    >
                        Vista Previa
                    </Text>
                    <View
                        style={[
                            styles.previewIconContainer,
                            {
                                backgroundColor: activeColor + "15",
                                borderColor: activeColor,
                            },
                        ]}
                    >
                        <FontAwesome6
                            name={activeIconName}
                            size={previewIconSize}
                            color={activeColor}
                            iconStyle="solid"
                        />
                    </View>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    title: {
        marginBottom: 10,
        fontSize: 16,
        paddingHorizontal: 4,
    },
    iconsRowScrollContent: {
        paddingHorizontal: 2,
    },
    iconsRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
    },
    iconItem: {
        width: 60,
        height: 60,
        marginHorizontal: 6,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 2,
    },
    colorSelectionContainer: {
        marginTop: 20,
    },
    colorTitle: {},
    colorsRowScrollContent: {
        paddingHorizontal: 2,
    },
    colorsRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
    },
    colorSwatch: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginHorizontal: 6,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    previewContainer: {
        marginTop: 25,
        alignItems: "center",
    },
    previewTitle: {
        marginBottom: 12,
    },
    previewIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
    },
})

export function getIconById(
    iconId: string,
    themeColors: ThemeColors,
    size: number = 24,
    colorOverride?: string,
): React.ReactNode {
    let faName: FA6IconName | undefined
    let effectiveColor = colorOverride

    const customIconConfig = BASE_ICON_OPTIONS_CONFIG.find(
        (config) => config.id === iconId,
    )

    if (customIconConfig) {
        faName = customIconConfig.faName
        if (!effectiveColor) {
            effectiveColor = resolveColorRef(
                customIconConfig.colorRef,
                themeColors,
            )
        }
    } else {
        switch (iconId) {
            case "travel":
                faName = "plane-departure"
                if (!effectiveColor) effectiveColor = "#E74C3C"
                break
            case "medical":
                faName = "briefcase-medical"
                if (!effectiveColor) effectiveColor = "#3498DB"
                break
            case "car":
                faName = "car"
                if (!effectiveColor) effectiveColor = "#9B59B6"
                break
            case "education":
                faName = "graduation-cap"
                if (!effectiveColor) effectiveColor = "#2ECC71"
                break
            case "search":
                faName = "magnifying-glass"
                if (!effectiveColor) effectiveColor = themeColors.primary
                break
            case "custom":
                faName = "folder"
                if (!effectiveColor) effectiveColor = themeColors.primary
                break
            default:
                faName = "folder"
                if (!effectiveColor) effectiveColor = themeColors.secondaryText
                break
        }
    }

    if (!faName) faName = "folder"
    if (!effectiveColor) effectiveColor = themeColors.primary

    return (
        <FontAwesome6
            name={faName}
            size={size}
            color={effectiveColor}
            iconStyle="solid"
        />
    )
}
