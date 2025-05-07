import { create } from "zustand"
import { LoggingService } from "../services/monitoring/loggingService.ts"
import AsyncStorage from "@react-native-async-storage/async-storage"

type NotificationEntry = {
    id: string
    title: string
    body: string
    sentAt: string
}

interface NotificationStoreState {
    notifications: NotificationEntry[]
    scheduledMap: Record<string, string[]>
}

interface NotificationStore extends NotificationStoreState {
    logNotification: (n: NotificationEntry) => void
    clearNotifications: () => void
    registerScheduled: (docId: string, ids: string[]) => void
    unregisterScheduled: (docId: string) => void
    getScheduledForDoc: (docId: string) => string[]

    loadData: (userId: string) => Promise<void>
    saveData: (userId: string) => Promise<void>
    reset: () => void
}

const logger = LoggingService.getLogger("NotificationStore")
const NOTIFICATION_STORE_PREFIX = "notification-store-"
const INITIAL_STATE: NotificationStoreState = {
    notifications: [],
    scheduledMap: {},
}

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
    ...INITIAL_STATE,

    logNotification: (n) =>
        set((state) => ({
            notifications: [n, ...state.notifications].slice(0, 100),
        })),
    clearNotifications: () => set({ notifications: [] }),

    registerScheduled: (docId, ids) =>
        set((state) => ({
            scheduledMap: { ...state.scheduledMap, [docId]: ids },
        })),
    unregisterScheduled: (docId) =>
        set((state) => {
            const updated = { ...state.scheduledMap }
            delete updated[docId]
            return { scheduledMap: updated }
        }),
    getScheduledForDoc: (docId) => get().scheduledMap[docId] ?? [],

    loadData: async (userId: string) => {
        if (!userId) {
            logger.warn("loadData called without userId, resetting state.")
            get().reset()
            return
        }
        const key = `${NOTIFICATION_STORE_PREFIX}${userId}`
        logger.debug(
            `Loading notifications for user ${userId} from key: ${key}`,
        )
        try {
            const storedData = await AsyncStorage.getItem(key)
            if (storedData) {
                const parsedData = JSON.parse(storedData)

                const notificationsToLoad = Array.isArray(
                    parsedData?.notifications,
                )
                    ? parsedData.notifications
                    : []
                const scheduledMapToLoad =
                    typeof parsedData?.scheduledMap === "object" &&
                    parsedData?.scheduledMap !== null
                        ? parsedData.scheduledMap
                        : {}

                set({
                    notifications: notificationsToLoad,
                    scheduledMap: scheduledMapToLoad,
                })
                logger.info(
                    `Loaded ${notificationsToLoad.length} notifications and ${
                        Object.keys(scheduledMapToLoad).length
                    } scheduled mappings for user ${userId}`,
                )
            } else {
                logger.info(
                    `No persisted notification data found for user ${userId}, using initial state.`,
                )
                set(INITIAL_STATE)
            }
        } catch (error) {
            logger.error(
                `Failed to load notifications for user ${userId} from key ${key}:`,
                error,
            )
            set(INITIAL_STATE)
        }
    },

    saveData: async (userId: string) => {
        if (!userId) {
            logger.warn("saveData called without userId.")
            return
        }
        const key = `${NOTIFICATION_STORE_PREFIX}${userId}`
        logger.debug(`Saving notifications for user ${userId} to key: ${key}`)
        try {
            const stateToPersist = {
                notifications: get().notifications,
                scheduledMap: get().scheduledMap,
            }
            await AsyncStorage.setItem(key, JSON.stringify(stateToPersist))
            logger.info(
                `Saved ${
                    stateToPersist.notifications.length
                } notifications and ${
                    Object.keys(stateToPersist.scheduledMap).length
                } scheduled mappings for user ${userId}`,
            )
        } catch (error) {
            logger.error(
                `Failed to save notifications for user ${userId} to key ${key}:`,
                error,
            )
        }
    },

    reset: () => {
        logger.info("Resetting NotificationStore in-memory state")
        set(INITIAL_STATE)
    },
}))
