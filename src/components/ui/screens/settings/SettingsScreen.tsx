import React, { useState } from "react"
import {
    Alert as RNAlert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from "react-native"
import type { NavigationProp } from "@react-navigation/native"
import { useNavigation } from "@react-navigation/native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../../hooks/useTheme"
import { Toast } from "../../feedback"
import { Container, Row, Spacer, Stack } from "../../layout"
import { Text } from "../../typography"
import { useAuthStore } from "../../../../store"
import { SettingItem } from "./SettingsItem"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { TabParamList } from "../../../../App"

const iconSize = 22

export function SettingsScreen() {
    const { colors, themeType, toggleTheme } = useTheme()
    const navigation = useNavigation<NavigationProp<TabParamList>>()
    const insets = useSafeAreaInsets()
    const [toastVisible, setToastVisible] = useState(false)
    const [notificationsEnabled, setNotificationsEnabled] = useState(true)
    const { logout } = useAuthStore()

    const handleToggleTheme = () => {
        toggleTheme()
        setToastVisible(true)
    }

    const handleToggleNotifications = (value: boolean) => {
        setNotificationsEnabled(value)
        console.log("Notifications enabled:", value)
    }

    const handleLanguagePress = () => {
        RNAlert.alert(
            "Idioma",
            "La selección de idioma aún no está implementada.",
        )
    }

    const handleAboutPress = () => {
        RNAlert.alert("Acerca de", "Versión de la aplicación: 0.0.1")
    }

    const handleLogout = () => {
        RNAlert.alert(
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

    const handleGoBack = () => {
        navigation.navigate("Profile")
    }

    return (
        <Container style={styles.screenContainer}>
            <Row
                align="center"
                style={[
                    styles.headerRow,
                    {
                        borderBottomColor: colors.border,
                        paddingTop:
                            insets.top + (Platform.OS === "ios" ? 5 : 10),
                    },
                ]}
            >
                <TouchableOpacity
                    onPress={handleGoBack}
                    style={styles.backButton}
                    accessibilityLabel="Regresar a Perfil"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <FontAwesome6
                        name="chevron-left"
                        size={18}
                        color={colors.primary}
                        iconStyle="solid"
                    />
                </TouchableOpacity>
                <Text
                    variant="md"
                    weight="bold"
                    style={[styles.headerTitle, { color: colors.text }]}
                >
                    Configuración
                </Text>
                <View style={styles.headerPlaceholder} />
            </Row>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Stack spacing={0}>
                    <Text
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
                            {
                                backgroundColor: colors.card,
                                shadowColor: colors.shadow,
                            },
                        ]}
                    >
                        <SettingItem
                            label="Modo Oscuro"
                            icon={
                                <FontAwesome6
                                    name="palette"
                                    size={iconSize}
                                    color={colors.primary}
                                    iconStyle="solid"
                                />
                            }
                            rightContent={
                                <Switch
                                    value={themeType === "dark"}
                                    onValueChange={handleToggleTheme}
                                    thumbColor={
                                        Platform.OS === "android"
                                            ? colors.background
                                            : undefined
                                    }
                                    trackColor={{
                                        true: colors.primary,
                                        false: colors.border + "80",
                                    }}
                                    ios_backgroundColor={colors.border + "80"}
                                    testID="dark-mode-switch"
                                />
                            }
                            isLastItem
                            testID="setting-dark-mode"
                        />
                    </View>
                    <Spacer size={20} />
                    <Text
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
                            {
                                backgroundColor: colors.card,
                                shadowColor: colors.shadow,
                            },
                        ]}
                    >
                        <SettingItem
                            label="Habilitar Notificaciones"
                            icon={
                                <FontAwesome6
                                    name="bell"
                                    size={iconSize}
                                    color={colors.primary}
                                    iconStyle="solid"
                                />
                            }
                            rightContent={
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={handleToggleNotifications}
                                    thumbColor={
                                        Platform.OS === "android"
                                            ? colors.background
                                            : undefined
                                    }
                                    trackColor={{
                                        true: colors.primary,
                                        false: colors.border + "80",
                                    }}
                                    ios_backgroundColor={colors.border + "80"}
                                    testID="notifications-switch"
                                />
                            }
                            isLastItem
                            testID="setting-notifications"
                        />
                    </View>
                    <Spacer size={20} />
                    <Text
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
                            {
                                backgroundColor: colors.card,
                                shadowColor: colors.shadow,
                            },
                        ]}
                    >
                        <SettingItem
                            label="Idioma"
                            icon={
                                <FontAwesome6
                                    name="language"
                                    size={iconSize}
                                    color={colors.primary}
                                    iconStyle="solid"
                                />
                            }
                            onPress={handleLanguagePress}
                            isLastItem
                            testID="setting-language"
                        />
                    </View>
                    <Spacer size={20} />
                    <Text
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
                            {
                                backgroundColor: colors.card,
                                shadowColor: colors.shadow,
                            },
                        ]}
                    >
                        <SettingItem
                            label="Acerca de"
                            icon={
                                <FontAwesome6
                                    name="circle-info"
                                    size={iconSize}
                                    color={colors.primary}
                                    iconStyle="solid"
                                />
                            }
                            onPress={handleAboutPress}
                            isLastItem
                            testID="setting-about"
                        />
                    </View>
                    <Spacer size={20} />
                    <Text
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
                            {
                                backgroundColor: colors.card,
                                shadowColor: colors.shadow,
                            },
                        ]}
                    >
                        <SettingItem
                            label="Cerrar Sesión"
                            labelStyle={{ color: colors.error }}
                            icon={
                                <FontAwesome6
                                    name="right-from-bracket"
                                    size={iconSize}
                                    color={colors.error}
                                    iconStyle="solid"
                                />
                            }
                            onPress={handleLogout}
                            isLastItem
                            testID="setting-logout"
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
    screenContainer: {
        flex: 1,
        paddingHorizontal: 0,
        paddingTop: 0,
    },
    headerRow: {
        paddingBottom: 10,
        paddingHorizontal: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 5,
        paddingRight: 10,
    },
    headerTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 18,
    },
    headerPlaceholder: {
        width: 28,
    },
    scrollView: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    sectionHeaderText: {
        marginBottom: 10,
        marginLeft: 0,
        textTransform: "uppercase",
        fontSize: 12,
        fontWeight: "600",
    },
    sectionContainer: {
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 10,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
})
