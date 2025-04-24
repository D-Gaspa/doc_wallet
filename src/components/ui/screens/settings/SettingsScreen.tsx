import React, { useState } from "react"
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Switch,
    Platform,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { Toast } from "../../feedback"
import InfoIcon from "../../assets/svg/info.svg"
import BellIcon from "../../assets/svg/bell.svg"
import LanguageIcon from "../../assets/svg/language.svg"
import ThemeIcon from "../../assets/svg/theme.svg"

export function SettingsScreen() {
    const { colors, toggleTheme } = useTheme()
    const [toastVisible, setToastVisible] = useState(false)
    const [notificationsEnabled, setNotificationsEnabled] = useState(true)

    const handleToggleTheme = () => {
        toggleTheme()
        setToastVisible(true)
    }

    const handleToggleNotifications = () => {
        setNotificationsEnabled((prev) => !prev)
    }

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Text style={[styles.header, { color: colors.text }]}>
                Configuraciones
            </Text>

            {/* Cambiar tema */}
            <TouchableOpacity onPress={handleToggleTheme} style={styles.item}>
                <ThemeIcon width={22} height={22} stroke={colors.text} />
                <Text style={[styles.label, { color: colors.text }]}>
                    Cambiar tema
                </Text>
            </TouchableOpacity>

            {/* Notificaciones */}
            <View style={styles.item}>
                <BellIcon width={22} height={22} stroke={colors.text} />
                <Text style={[styles.label, { color: colors.text }]}>
                    Notificaciones
                </Text>
                <View style={styles.switchWrapper}>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={handleToggleNotifications}
                        thumbColor={
                            Platform.OS === "android"
                                ? colors.primary
                                : undefined
                        }
                        trackColor={{
                            true: colors.primary,
                            false: colors.border,
                        }}
                    />
                </View>
            </View>

            {/* Cambiar idioma (futuro) */}
            <TouchableOpacity style={styles.item}>
                <LanguageIcon width={22} height={22} stroke={colors.text} />
                <Text style={[styles.label, { color: colors.text }]}>
                    Idioma
                </Text>
            </TouchableOpacity>

            {/* Acerca de */}
            <TouchableOpacity style={styles.item}>
                <InfoIcon width={22} height={22} stroke={colors.text} />
                <Text style={[styles.label, { color: colors.text }]}>
                    Acerca de
                </Text>
            </TouchableOpacity>

            {toastVisible && (
                <Toast
                    message="Tema actualizado correctamente"
                    visible={toastVisible}
                    onDismiss={() => setToastVisible(false)}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 24,
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        gap: 12,
    },
    label: {
        fontSize: 16,
        flex: 1,
    },
    switchWrapper: {
        marginLeft: "auto",
    },
})
