import { create } from "zustand"
import { persist } from "zustand/middleware"
import { asyncStorageMiddleware } from "./middleware/persist"
import type {
    Tag,
    TagAssociation,
} from "../components/ui/tag_functionality/TagContext"

interface TagState {
    tags: Tag[]
    associations: TagAssociation[]

    setTags: (tags: Tag[]) => void
    setAssociations: (associations: TagAssociation[]) => void

    addTag: (tag: Tag) => void
    updateTag: (id: string, update: Partial<Tag>) => void
    removeTag: (id: string) => void

    addAssociation: (association: TagAssociation) => void
    removeAssociation: (
        tagId: string,
        itemId: string,
        itemType: "document" | "folder",
    ) => void

    // Batch operations
    addAssociations: (associations: TagAssociation[]) => void
    syncItemTags: (
        itemId: string,
        itemType: "document" | "folder",
        tagIds: string[],
    ) => void
}

export const useTagStore = create<TagState>()(
    persist(
        (set) => ({
            tags: [],
            associations: [],

            setTags: (tags) => set({ tags }),
            setAssociations: (associations) => set({ associations }),

            addTag: (tag) =>
                set((state) => ({
                    tags: [...state.tags, tag],
                })),

            updateTag: (id, update) =>
                set((state) => ({
                    tags: state.tags.map((tag) =>
                        tag.id === id ? { ...tag, ...update } : tag,
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
                    // Don't add duplicate associations
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
                        associations: [...state.associations, association],
                    }
                }),

            addAssociations: (newAssociations) =>
                set((state) => {
                    // Filter out duplicates
                    const filtered = newAssociations.filter(
                        (newAssoc) =>
                            !state.associations.some(
                                (existing) =>
                                    existing.tagId === newAssoc.tagId &&
                                    existing.itemId === newAssoc.itemId &&
                                    existing.itemType === newAssoc.itemType,
                            ),
                    )

                    return {
                        associations: [...state.associations, ...filtered],
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
                    // Remove existing associations for this item
                    const filteredAssociations = state.associations.filter(
                        (assoc) =>
                            !(
                                assoc.itemId === itemId &&
                                assoc.itemType === itemType
                            ),
                    )

                    // Create new associations for the provided tagIds
                    const newAssociations: TagAssociation[] = tagIds.map(
                        (tagId) => ({
                            tagId,
                            itemId,
                            itemType, // This is now strictly typed as "document" | "folder"
                            createdAt: new Date(),
                        }),
                    )

                    return {
                        associations: [
                            ...filteredAssociations,
                            ...newAssociations,
                        ],
                    }
                }),
        }),
        {
            name: "doc-wallet-tags",
            storage: asyncStorageMiddleware,
        },
    ),
)
