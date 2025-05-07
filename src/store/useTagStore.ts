import { create } from "zustand"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type {
    Tag,
    TagAssociation,
} from "../components/ui/tag_functionality/TagContext"
import { LoggingService } from "../services/monitoring/loggingService"

interface TagState {
    tags: Tag[]
    associations: TagAssociation[]
}

interface TagStore extends TagState {
    setTags: (tags: Tag[]) => void
    setAssociations: (associations: TagAssociation[]) => void

    addTag: (tag: Tag) => void
    updateTag: (
        id: string,
        update: Partial<Omit<Tag, "id" | "createdAt">>,
    ) => void
    removeTag: (id: string) => void

    addAssociation: (association: Omit<TagAssociation, "createdAt">) => void
    removeAssociation: (
        tagId: string,
        itemId: string,
        itemType: "document" | "folder",
    ) => void

    addAssociations: (associations: Omit<TagAssociation, "createdAt">[]) => void
    syncItemTags: (
        itemId: string,
        itemType: "document" | "folder",
        tagIds: string[],
    ) => void

    loadData: (userId: string) => Promise<void>
    saveData: (userId: string) => Promise<void>
    reset: () => void
}

const logger = LoggingService.getLogger("TagStore")
const TAG_STORE_PREFIX = "tag-store-"
const INITIAL_STATE: TagState = {
    tags: [],
    associations: [],
}

// eslint-disable-next-line
const rehydrateTag = (tagData: any): Tag => ({
    ...tagData,
    createdAt: new Date(tagData.createdAt),
    updatedAt: new Date(tagData.updatedAt),
})

// eslint-disable-next-line
const rehydrateAssociation = (assocData: any): TagAssociation => ({
    ...assocData,
    createdAt: new Date(assocData.createdAt),
})

export const useTagStore = create<TagStore>()((set, get) => ({
    ...INITIAL_STATE,

    setTags: (tags) => set({ tags }),
    setAssociations: (associations) => set({ associations }),

    addTag: (tag) =>
        set((state) => {
            if (
                state.tags.some(
                    (t) => t.name.toLowerCase() === tag.name.toLowerCase(),
                )
            ) {
                logger.warn(
                    `Tag with name "${tag.name}" already exists. Cannot add duplicate.`,
                )
                return state
            }
            return {
                tags: [
                    ...state.tags,
                    {
                        ...tag,
                        createdAt: new Date(tag.createdAt),
                        updatedAt: new Date(tag.updatedAt),
                    },
                ],
            }
        }),

    updateTag: (id, update) =>
        set((state) => ({
            tags: state.tags.map((tag) =>
                tag.id === id
                    ? { ...tag, ...update, updatedAt: new Date() }
                    : tag,
            ),
        })),

    removeTag: (id) =>
        set((state) => ({
            tags: state.tags.filter((tag) => tag.id !== id),

            associations: state.associations.filter(
                (assoc) => assoc.tagId !== id,
            ),
        })),

    addAssociation: (association) =>
        set((state) => {
            if (
                state.associations.some(
                    (a) =>
                        a.tagId === association.tagId &&
                        a.itemId === association.itemId &&
                        a.itemType === association.itemType,
                )
            ) {
                return state
            }
            return {
                associations: [
                    ...state.associations,
                    { ...association, createdAt: new Date() },
                ],
            }
        }),

    addAssociations: (newAssociations) =>
        set((state) => {
            const now = new Date()
            const filteredNew = newAssociations
                .map((assoc) => ({ ...assoc, createdAt: now }))
                .filter(
                    (newAssoc) =>
                        !state.associations.some(
                            (existing) =>
                                existing.tagId === newAssoc.tagId &&
                                existing.itemId === newAssoc.itemId &&
                                existing.itemType === newAssoc.itemType,
                        ),
                )

            return {
                associations: [...state.associations, ...filteredNew],
            }
        }),

    removeAssociation: (tagId, itemId, itemType) =>
        set((state) => ({
            associations: state.associations.filter(
                (assoc) =>
                    !(
                        assoc.tagId === tagId &&
                        assoc.itemId === itemId &&
                        assoc.itemType === itemType
                    ),
            ),
        })),

    syncItemTags: (itemId, itemType, tagIds) =>
        set((state) => {
            const filteredAssociations = state.associations.filter(
                (assoc) =>
                    !(assoc.itemId === itemId && assoc.itemType === itemType),
            )
            const now = new Date()
            const newAssociations: TagAssociation[] = tagIds.map((tagId) => ({
                tagId,
                itemId,
                itemType,
                createdAt: now,
            }))
            return {
                associations: [...filteredAssociations, ...newAssociations],
            }
        }),

    loadData: async (userId: string) => {
        if (!userId) {
            logger.warn("loadData called without userId, resetting state.")
            get().reset()
            return
        }
        const key = `${TAG_STORE_PREFIX}${userId}`
        logger.debug(
            `Loading tags/associations for user ${userId} from key: ${key}`,
        )
        try {
            const storedData = await AsyncStorage.getItem(key)
            if (storedData) {
                const parsedData = JSON.parse(storedData)

                const tagsToLoad = (
                    Array.isArray(parsedData?.tags) ? parsedData.tags : []
                ).map(rehydrateTag)
                const associationsToLoad = (
                    Array.isArray(parsedData?.associations)
                        ? parsedData.associations
                        : []
                ).map(rehydrateAssociation)

                set({ tags: tagsToLoad, associations: associationsToLoad })
                logger.info(
                    `Loaded ${tagsToLoad.length} tags and ${associationsToLoad.length} associations for user ${userId}`,
                )
            } else {
                logger.info(
                    `No persisted tag data found for user ${userId}, using initial state.`,
                )
                set(INITIAL_STATE)
            }
        } catch (error) {
            logger.error(
                `Failed to load tags/associations for user ${userId} from key ${key}:`,
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
        const key = `${TAG_STORE_PREFIX}${userId}`
        logger.debug(
            `Saving tags/associations for user ${userId} to key: ${key}`,
        )
        try {
            const stateToPersist = {
                tags: get().tags,
                associations: get().associations,
            }

            await AsyncStorage.setItem(key, JSON.stringify(stateToPersist))
            logger.info(
                `Saved ${stateToPersist.tags.length} tags and ${stateToPersist.associations.length} associations for user ${userId}`,
            )
        } catch (error) {
            logger.error(
                `Failed to save tags/associations for user ${userId} to key ${key}:`,
                error,
            )
        }
    },

    reset: () => {
        logger.info("Resetting TagStore in-memory state")
        set(INITIAL_STATE)
    },
}))
