import { create } from "zustand"
import { persist } from "zustand/middleware"
import { asyncStorageMiddleware } from "./middleware/persist"

interface FavoriteDocumentsState {
    favoriteIds: string[]
    addFavorite: (id: string) => void
    removeFavorite: (id: string) => void
    isFavorite: (id: string) => boolean
}

export const useFavoriteDocumentsStore = create<FavoriteDocumentsState>()(
    persist(
        (set, get) => ({
            favoriteIds: [],
            addFavorite: (id) =>
                set((state) => ({
                    favoriteIds: [...new Set([...state.favoriteIds, id])],
                })),
            removeFavorite: (id) =>
                set((state) => ({
                    favoriteIds: state.favoriteIds.filter(
                        (favId) => favId !== id,
                    ),
                })),
            isFavorite: (id) => get().favoriteIds.includes(id),
        }),
        {
            name: "favorite-documents-storage", // localStorage key
            storage: asyncStorageMiddleware,
        },
    ),
)
