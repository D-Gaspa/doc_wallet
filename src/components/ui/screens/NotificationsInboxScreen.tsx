import React from "react"
import {
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import type { NavigationProp } from "@react-navigation/native"
import { useNavigation } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNotificationStore } from "../../../store/useNotificationStore"
import { NotificationCard } from "../notifications/NotificationCard"
import { useThemeContext } from "../../../context/ThemeContext"
import { Container, Row } from "../layout"
import type { TabParamList } from "../../../App" // Assuming TabParamList includes 'Notifications'

export const NotificationsInboxScreen = () => {
    const { notifications, clearNotifications } = useNotificationStore()
    const { colors } = useThemeContext()
    const navigation = useNavigation<NavigationProp<TabParamList>>()
    const insets = useSafeAreaInsets()

    const handleGoBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("Profile")
        }
    }

    const renderReceived = ({
        item,
    }: {
        item: { id: string; title: string; body: string; sentAt: string }
    }) => (
        <NotificationCard
            title={item.title}
            body={item.body}
            sentAt={item.sentAt}
        />
    )

    return (
        <Container style={styles.screenContainer}>
            {/* Custom Header */}
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
                    accessibilityLabel="Regresar"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <FontAwesome6
                        name="chevron-left"
                        size={18}
                        color={colors.primary}
                        iconStyle="solid"
                    />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Notificaciones
                </Text>
                <View style={styles.headerPlaceholder} />
            </Row>

            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <FontAwesome6
                        name="envelope-open"
                        size={60}
                        color={colors.secondaryText}
                        iconStyle="solid"
                        style={styles.emptyIcon}
                    />
                    <Text
                        style={[
                            styles.emptyText,
                            { color: colors.secondaryText },
                        ]}
                    >
                        📭 No hay notificaciones.
                    </Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.id}
                        renderItem={renderReceived}
                        contentContainerStyle={[
                            styles.listContentContainer,
                            { paddingBottom: insets.bottom + 20 },
                        ]}
                        style={styles.listStyle}
                    />
                    <View
                        style={[
                            styles.clearButtonContainer,
                            // eslint-disable-next-line react-native/no-inline-styles
                            {
                                paddingBottom:
                                    insets.bottom > 0 ? insets.bottom : 20,
                                borderTopColor: colors.border,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={[
                                styles.clearButton,
                                {
                                    backgroundColor: colors.error + "20",
                                    borderColor: colors.error,
                                },
                            ]}
                            onPress={clearNotifications}
                            activeOpacity={0.7}
                        >
                            <FontAwesome6
                                name="trash"
                                size={16}
                                color={colors.error}
                                iconStyle="solid"
                            />
                            <Text
                                style={[
                                    styles.clearButtonText,
                                    { color: colors.error },
                                ]}
                            >
                                Limpiar Notificaciones
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </Container>
    )
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        paddingHorizontal: 0,
        paddingVertical: 0,
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
        fontWeight: "bold",
    },
    headerPlaceholder: {
        width: 28,
    },
    listStyle: {
        flex: 1,
        paddingHorizontal: 16,
    },
    listContentContainer: {
        paddingTop: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    emptyIcon: {
        marginBottom: 16,
        opacity: 0.7,
    },
    emptyText: {
        textAlign: "center",
        fontSize: 16,
        opacity: 0.8,
    },
    clearButtonContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    clearButton: {
        flexDirection: "row",
        borderWidth: 1.5,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    clearButtonText: {
        textAlign: "center",
        fontWeight: "bold",
        marginLeft: 8,
        fontSize: 15,
    },
})
