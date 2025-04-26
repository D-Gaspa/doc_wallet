import React, { useState } from "react"
import {
    View,
    StyleSheet,
    Switch,
    Platform,
    Alert,
    ScrollView,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { Toast } from "../../feedback"
import { Container, Spacer, Stack } from "../../layout"
import { Text } from "../../typography"
import { useAuthStore } from "../../../../store"

// Icons
import InfoIcon from "../../assets/svg/info.svg"
import BellIcon from "../../assets/svg/bell.svg"
import LanguageIcon from "../../assets/svg/language.svg"
import ThemeIcon from "../../assets/svg/theme.svg"
import LogoutIcon from "../../assets/svg/logout.svg"
import { SettingItem } from "./SettingsItem"

export function SettingsScreen() {
    const { colors, themeType, toggleTheme } = useTheme()
    const [toastVisible, setToastVisible] = useState(false)
    const [notificationsEnabled, setNotificationsEnabled] = useState(true)
    const { logout } = useAuthStore()

    const handleToggleTheme = () => {
        toggleTheme()
        setToastVisible(true)
    }

    const handleToggleNotifications = (value: boolean) => {
        setNotificationsEnabled(value)
    }

    const handleLanguagePress = () => {
        console.log("Language setting pressed")
    }

    const handleAboutPress = () => {
        console.log("About setting pressed")
    }

    const handleLogout = () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro de que quieres cerrar sesión?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Cerrar Sesión",
                    style: "destructive",
                    onPress: logout,
                },
            ],
        )
    }

    return (
        <Container style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                <Stack>
                    <Text variant="md" weight="bold" style={styles.header}>
                        Configuración
                    </Text>
                    <Spacer size={16} />

                    {/* Apariencia */}
                    <Text
                        variant="sm"
                        weight="medium"
                        style={[
                            styles.sectionHeaderText,
                            { color: colors.secondaryText },
                        ]}
                    >
                        Apariencia
                    </Text>
                    <View
                        style={[
                            styles.sectionContainer,
                            { backgroundColor: colors.card },
                        ]}
                    >
                        <SettingItem
                            label="Modo Oscuro"
                            icon={
                                <ThemeIcon
                                    width={22}
                                    height={22}
                                    color={colors.primary}
                                />
                            }
                            rightContent={
                                <Switch
                                    value={themeType === "dark"}
                                    onValueChange={handleToggleTheme}
                                    thumbColor={
                                        Platform.OS === "android"
                                            ? colors.background
                                            : ""
                                    }
                                    trackColor={{
                                        true: colors.primary,
                                        false: colors.border + "80",
                                    }}
                                    ios_backgroundColor={colors.border + "80"}
                                />
                            }
                            isLastItem
                        />
                    </View>

                    <Spacer size={20} />

                    {/* Notificaciones */}
                    <Text
                        variant="sm"
                        weight="medium"
                        style={[
                            styles.sectionHeaderText,
                            { color: colors.secondaryText },
                        ]}
                    >
                        Notificaciones
                    </Text>
                    <View
                        style={[
                            styles.sectionContainer,
                            { backgroundColor: colors.card },
                        ]}
                    >
                        <SettingItem
                            label="Habilitar Notificaciones"
                            icon={
                                <BellIcon
                                    width={22}
                                    height={22}
                                    color={colors.primary}
                                />
                            }
                            rightContent={
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={handleToggleNotifications}
                                    thumbColor={
                                        Platform.OS === "android"
                                            ? colors.background
                                            : ""
                                    }
                                    trackColor={{
                                        true: colors.primary,
                                        false: colors.border + "80",
                                    }}
                                    ios_backgroundColor={colors.border + "80"}
                                />
                            }
                            isLastItem
                        />
                    </View>

                    <Spacer size={20} />

                    {/* Preferencias */}
                    <Text
                        variant="sm"
                        weight="medium"
                        style={[
                            styles.sectionHeaderText,
                            { color: colors.secondaryText },
                        ]}
                    >
                        Preferencias
                    </Text>
                    <View
                        style={[
                            styles.sectionContainer,
                            { backgroundColor: colors.card },
                        ]}
                    >
                        <SettingItem
                            label="Idioma"
                            icon={
                                <LanguageIcon
                                    width={22}
                                    height={22}
                                    color={colors.primary}
                                />
                            }
                            onPress={handleLanguagePress}
                            isLastItem
                        />
                    </View>

                    <Spacer size={20} />

                    <Spacer size={20} />

                    {/* Información */}
                    <Text
                        variant="sm"
                        weight="medium"
                        style={[
                            styles.sectionHeaderText,
                            { color: colors.secondaryText },
                        ]}
                    >
                        Información
                    </Text>
                    <View
                        style={[
                            styles.sectionContainer,
                            { backgroundColor: colors.card },
                        ]}
                    >
                        <SettingItem
                            label="Acerca de"
                            icon={
                                <InfoIcon
                                    width={22}
                                    height={22}
                                    color={colors.primary}
                                />
                            }
                            onPress={handleAboutPress}
                            isLastItem
                        />
                    </View>

                    {/* Cuenta */}
                    <Text
                        variant="sm"
                        weight="medium"
                        style={[
                            styles.sectionHeaderText,
                            { color: colors.secondaryText },
                        ]}
                    >
                        Cuenta
                    </Text>
                    <View
                        style={[
                            styles.sectionContainer,
                            { backgroundColor: colors.card },
                        ]}
                    >
                        <SettingItem
                            label="Cerrar Sesión"
                            labelStyle={{ color: colors.error }}
                            icon={
                                <LogoutIcon
                                    width={22}
                                    height={22}
                                    color={colors.error}
                                />
                            }
                            onPress={handleLogout}
                            isLastItem
                        />
                    </View>

                    <Spacer size={30} />
                </Stack>
            </ScrollView>

            {toastVisible && (
                <Toast
                    message="Tema actualizado correctamente"
                    visible={toastVisible}
                    onDismiss={() => setToastVisible(false)}
                />
            )}
        </Container>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        paddingBottom: 24,
    },
    header: {
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    sectionHeaderText: {
        marginBottom: 8,
        marginLeft: 5,
        textTransform: "uppercase",
        fontSize: 12,
    },
    sectionContainer: {
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 5,
    },
})
