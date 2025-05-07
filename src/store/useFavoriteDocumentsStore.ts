import { create } from "zustand"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LoggingService } from "../services/monitoring/loggingService"

interface FavoriteDocumentsState {
    favoriteIds: string[]
}

interface FavoriteDocumentsStore extends FavoriteDocumentsState {
    addFavorite: (id: string) => void
    removeFavorite: (id: string) => void
    isFavorite: (id: string) => boolean
    loadData: (userId: string) => Promise<void>
    saveData: (userId: string) => Promise<void>
    reset: () => void
}

const logger = LoggingService.getLogger("FavoriteDocumentsStore")
const FAVORITE_DOCS_STORE_PREFIX = "favorite-docs-store-"
const INITIAL_STATE: FavoriteDocumentsState = {
    favoriteIds: [],
}

export const useFavoriteDocumentsStore = create<FavoriteDocumentsStore>()(
    (set, get) => ({
        ...INITIAL_STATE,

        addFavorite: (id) =>
            set((state) => ({
                favoriteIds: [...new Set([...state.favoriteIds, id])],
            })),
        removeFavorite: (id) =>
            set((state) => ({
                favoriteIds: state.favoriteIds.filter((favId) => favId !== id),
            })),
        isFavorite: (id) => get().favoriteIds.includes(id),

        loadData: async (userId: string) => {
            if (!userId) {
                logger.warn("loadData called without userId, resetting state.")
                get().reset()
                return
            }
            const key = `${FAVORITE_DOCS_STORE_PREFIX}${userId}`
            logger.debug(
                `Loading favorites for user ${userId} from key: ${key}`,
            )
            try {
                const storedData = await AsyncStorage.getItem(key)
                if (storedData) {
                    const parsedData = JSON.parse(storedData)

                    const favoritesToLoad = Array.isArray(
                        parsedData?.favoriteIds,
                    )
                        ? parsedData.favoriteIds
                        : []
                    set({ favoriteIds: favoritesToLoad })
                    logger.info(
                        `Loaded ${favoritesToLoad.length} favorites for user ${userId}`,
                    )
                } else {
                    logger.info(
                        `No persisted favorite data found for user ${userId}, using initial state.`,
                    )
                    set(INITIAL_STATE)
                }
            } catch (error) {
                logger.error(
                    `Failed to load favorites for user ${userId} from key ${key}:`,
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
            const key = `${FAVORITE_DOCS_STORE_PREFIX}${userId}`
            logger.debug(`Saving favorites for user ${userId} to key: ${key}`)
            try {
                const stateToPersist = {
                    favoriteIds: get().favoriteIds,
                }
                await AsyncStorage.setItem(key, JSON.stringify(stateToPersist))
                logger.info(
                    `Saved ${stateToPersist.favoriteIds.length} favorites for user ${userId}`,
                )
            } catch (error) {
                logger.error(
                    `Failed to save favorites for user ${userId} to key ${key}:`,
                    error,
                )
            }
        },

        reset: () => {
            logger.info("Resetting FavoriteDocumentsStore in-memory state")
            set(INITIAL_STATE)
        },
    }),
)
