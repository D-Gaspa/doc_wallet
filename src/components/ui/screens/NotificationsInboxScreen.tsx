import React from "react"
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from "react-native"
import { useNotificationStore } from "../../../store/useNotificationStore"
import { NotificationCard } from "../notifications/NotificationCard"
import { useThemeContext } from "../../../context/ThemeContext.tsx"

export const NotificationsInboxScreen = () => {
    const { notifications, clearNotifications } = useNotificationStore()
    const { colors } = useThemeContext()

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
        <View style={[styles.container, { backgroundColor: colors.searchbar }]}>
            <Text style={[styles.header, { color: colors.text }]}>
                Received Notifications
            </Text>

            {notifications.length === 0 ? (
                <Text style={[styles.empty, { color: colors.text }]}>
                    📭 No notifications received.
                </Text>
            ) : (
                <>
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.id}
                        renderItem={renderReceived}
                        contentContainerStyle={styles.list}
                    />
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearNotifications}
                    >
                        <Text style={styles.clearButtonText}>
                            Clear Received
                        </Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    list: { paddingBottom: 40 },
    header: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 16,
    },
    empty: {
        marginTop: 32,
        textAlign: "center",
        fontSize: 16,
    },
    // eslint-disable-next-line react-native/no-color-literals
    clearButton: {
        backgroundColor: "#d00",
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
    },
    // eslint-disable-next-line react-native/no-color-literals
    clearButtonText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "bold",
    },
})
