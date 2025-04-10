// store/useAlertStore.ts
import { create } from "zustand"
import { useDocStore } from "./useDocStore"
import { IDocument } from "../types/document.ts"

type AlertPreferences = {
    expirationLeadDays: number
}

type AlertStore = {
    preferences: AlertPreferences
    dismissedIds: string[]
    getExpiringDocuments: () => IDocument[]
    dismissAlert: (id: string) => void
    setPreferences: (prefs: Partial<AlertPreferences>) => void
}

export const useAlertStore = create<AlertStore>()((set, get) => ({
    preferences: {
        expirationLeadDays: 14,
    },
    dismissedIds: [],

    setPreferences: (prefs) =>
        set((state) => ({
            preferences: { ...state.preferences, ...prefs },
        })),

    dismissAlert: (id) =>
        set((state) => ({
            dismissedIds: [...state.dismissedIds, id],
        })),

    getExpiringDocuments: () => {
        const { expirationLeadDays } = get().preferences
        const { documents } = useDocStore.getState()
        const now = new Date()
        const threshold = new Date()
        threshold.setDate(now.getDate() + expirationLeadDays)

        return documents.filter((doc) => {
            const param = doc.parameters?.find(
                (p) => p.key === "expiration_date",
            )
            if (!param?.value) return false

            const expDate = new Date(param.value)
            const isDismissed = get().dismissedIds.includes(doc.id)

            return expDate >= now && expDate <= threshold && !isDismissed
        })
    },
}))
