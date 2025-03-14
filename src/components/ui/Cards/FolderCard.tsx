import React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useThemeContext } from "../../../context/ThemeContext.tsx"

// Import predefined folder icons
import TravelIcon from "../assets/svg/airplane.svg"
import MedicalIcon from "../assets/svg/medical.svg"
import CarIcon from "../assets/svg/car.svg"
import EducationIcon from "../assets/svg/book.svg"
import AddIcon from "../assets/svg/add-file-icon.svg"

export interface FolderCardProps {
    title: string
    type?: "travel" | "medical" | "car" | "education" | "custom"
    onPress: () => void
    customIcon?: React.ReactNode // Allows any SVG component
    isNewFolder?: boolean // If true, shows "Create New Folder" button
}

export function FolderCard({
    title,
    type = "custom",
    onPress,
    customIcon,
    isNewFolder = false,
}: FolderCardProps) {
    const { colors } = useThemeContext()

    // Map predefined folder types to their respective SVG icons
    const folderIcons = {
        travel: <TravelIcon width={24} height={24} fill={"#E74C3C"} />,
        medical: <MedicalIcon width={24} height={24} fill={"#3498DB"} />,
        car: <CarIcon width={24} height={24} fill={"#9B59B6"} />,
        education: <EducationIcon width={24} height={24} fill={"#2ECC71"} />,
        custom: customIcon ?? (
            <EducationIcon width={24} height={24} fill={colors.primary} />
        ), // Default for custom folders
    }

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { borderBottomColor: colors.secondaryText },
            ]}
            onPress={onPress}
        >
            <View style={styles.iconWrapper}>
                {isNewFolder ? (
                    <AddIcon width={24} height={24} fill={colors.primary} />
                ) : (
                    folderIcons[type]
                )}
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
                {isNewFolder ? "Crear nueva carpeta" : title}
            </Text>
            <Text style={[styles.arrow, { color: colors.secondaryText }]}>
                ›
            </Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1, // Only bottom border for separation
    },
    iconWrapper: {
        marginRight: 12,
    },
    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: "500",
    },
    arrow: {
        fontSize: 18,
    },
})
