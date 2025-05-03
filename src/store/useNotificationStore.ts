import { create } from "zustand"
import { persist } from "zustand/middleware"
import { asyncStorageMiddleware } from "./middleware/persist" // If you're using a custom one

type NotificationEntry = {
    id: string
    title: string
    body: string
    sentAt: string
}

interface NotificationStore {
    notifications: NotificationEntry[]
    scheduledMap: Record<string, string[]> // docId → notificationIds

    logNotification: (n: NotificationEntry) => void
    clearNotifications: () => void

    registerScheduled: (docId: string, ids: string[]) => void
    unregisterScheduled: (docId: string) => void
    getScheduledForDoc: (docId: string) => string[]
}

export const useNotificationStore = create<NotificationStore>()(
    persist(
        (set, get) => ({
            notifications: [],
            scheduledMap: {},

            logNotification: (n) =>
                set((state) => ({
                    notifications: [n, ...state.notifications],
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
        }),
        {
            name: "doc-wallet-notifications",
            storage: asyncStorageMiddleware,
        },
    ),
)
