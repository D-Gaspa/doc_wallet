import React from "react"
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
]

function resolveColorRef(
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
    selectedIconId: string
    onSelectIcon: (iconId: string) => void
}

export function CustomIconSelector({
    selectedIconId,
    onSelectIcon,
}: CustomIconSelectorProps) {
    const { colors } = useTheme()
    const iconDisplaySize = 28

    const iconOptions: IconOption[] = React.useMemo(() => {
        return BASE_ICON_OPTIONS_CONFIG.map((config) => ({
            id: config.id,
            faName: config.faName,
            color: resolveColorRef(config.colorRef, colors),
        }))
    }, [colors])

    return (
        <View style={styles.container}>
            <Text
                weight="medium"
                style={[styles.title, { color: colors.text }]}
            >
                Selecciona un icono
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.iconsRow}>
                    {iconOptions.map((iconOpt) => {
                        const isSelected = selectedIconId === iconOpt.id
                        return (
                            <TouchableOpacity
                                key={iconOpt.id}
                                style={[
                                    styles.iconItem,
                                    { borderColor: colors.border + "50" },
                                    isSelected && {
                                        borderColor: iconOpt.color,
                                        backgroundColor: iconOpt.color + "20",
                                    },
                                ]}
                                onPress={() => onSelectIcon(iconOpt.id)}
                                accessibilityLabel={`Icono ${iconOpt.faName}`}
                            >
                                <FontAwesome6
                                    name={iconOpt.faName}
                                    size={iconDisplaySize}
                                    color={
                                        isSelected
                                            ? iconOpt.color
                                            : colors.secondaryText
                                    }
                                    iconStyle="solid"
                                />
                            </TouchableOpacity>
                        )
                    })}
                </View>
            </ScrollView>
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
    iconsRow: {
        flexDirection: "row",
        paddingVertical: 4,
    },
    iconItem: {
        width: 60,
        height: 60,
        marginHorizontal: 6,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1.5,
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

    if (!faName) {
        faName = "folder"
    }

    if (!effectiveColor) {
        effectiveColor = themeColors.primary
    }

    return (
        <FontAwesome6
            name={faName}
            size={size}
            color={effectiveColor}
            iconStyle="solid"
        />
    )
}
