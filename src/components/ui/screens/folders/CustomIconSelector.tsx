import React from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { Text } from "../../typography"

// Import all available icons
import TravelIcon from "../../assets/svg/airplane.svg"
import MedicalIcon from "../../assets/svg/medical.svg"
import CarIcon from "../../assets/svg/car.svg"
import EducationIcon from "../../assets/svg/book.svg"
import CheckIcon from "../../assets/svg/Check.svg"
import WarningIcon from "../../assets/svg/warning-outline.svg"
import SuccessIcon from "../../assets/svg/success.svg"
import ErrorIcon from "../../assets/svg/error.svg"
import SearchIcon from "../../assets/svg/search.svg"

// Define a proper type for the colors object
export interface ThemeColors {
    primary: string
    error: string
    warning: string
    success: string
    [key: string]: string // Allow for other color properties
}

// Each icon option with its component and color
export interface IconOption {
    id: string
    component: React.ReactNode
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

    // Define all available icons for custom selection
    const iconOptions: IconOption[] = [
        {
            id: "travel",
            component: <TravelIcon width={28} height={28} fill="#E74C3C" />,
            color: "#E74C3C",
        },
        {
            id: "medical",
            component: <MedicalIcon width={28} height={28} fill="#3498DB" />,
            color: "#3498DB",
        },
        {
            id: "car",
            component: <CarIcon width={28} height={28} fill="#9B59B6" />,
            color: "#9B59B6",
        },
        {
            id: "education",
            component: <EducationIcon width={28} height={28} fill="#2ECC71" />,
            color: "#2ECC71",
        },
        {
            id: "check",
            component: (
                <CheckIcon width={28} height={28} stroke={colors.primary} />
            ),
            color: colors.primary,
        },
        {
            id: "warning",
            component: (
                <WarningIcon width={28} height={28} fill={colors.warning} />
            ),
            color: colors.warning,
        },
        {
            id: "success",
            component: (
                <SuccessIcon width={28} height={28} fill={colors.success} />
            ),
            color: colors.success,
        },
        {
            id: "error",
            component: <ErrorIcon width={28} height={28} fill={colors.error} />,
            color: colors.error,
        },
    ]

    return (
        <View style={styles.container}>
            <Text weight="medium" style={styles.title}>
                Select an Icon
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.iconsRow}>
                    {iconOptions.map((icon) => (
                        <TouchableOpacity
                            key={icon.id}
                            style={[
                                styles.iconItem,
                                selectedIconId === icon.id && {
                                    borderColor: icon.color,
                                    backgroundColor: icon.color + "20", // 20% opacity
                                },
                            ]}
                            onPress={() => onSelectIcon(icon.id)}
                        >
                            {icon.component}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    title: {
        marginBottom: 8,
    },
    iconsRow: {
        flexDirection: "row",
        justifyContent: "flex-start",
        paddingBottom: 8,
    },
    iconItem: {
        width: 60,
        height: 60,
        margin: 4,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        borderWidth: 1,
    },
})

// Function to get icon component by ID for external use with proper typing
export function getIconById(
    iconId: string,
    colors: ThemeColors
): React.ReactNode {
    switch (iconId) {
        case "travel":
            return <TravelIcon width={24} height={24} fill="#E74C3C" />
        case "medical":
            return <MedicalIcon width={24} height={24} fill="#3498DB" />
        case "car":
            return <CarIcon width={24} height={24} fill="#9B59B6" />
        case "education":
            return <EducationIcon width={24} height={24} fill="#2ECC71" />
        case "check":
            return <CheckIcon width={24} height={24} stroke={colors.primary} />
        case "warning":
            return <WarningIcon width={24} height={24} fill={colors.warning} />
        case "success":
            return <SuccessIcon width={24} height={24} fill={colors.success} />
        case "error":
            return <ErrorIcon width={24} height={24} fill={colors.error} />
        case "search":
            return <SearchIcon width={24} height={24} stroke={colors.primary} />
    }
}
