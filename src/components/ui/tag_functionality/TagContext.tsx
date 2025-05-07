import React, { createContext, ReactNode, useContext, useEffect } from "react"
import { useTagStore } from "../../../store/useTagStore"
import { SelectedItem } from "../screens/folders/useSelectionMode.ts"
import { LoggingService } from "../../../services/monitoring/loggingService.ts"

export interface Tag {
    id: string
    name: string
    color: string
    createdAt: Date
    updatedAt: Date
}

export interface TagAssociation {
    tagId: string
    itemId: string
    itemType: "document" | "folder"
    createdAt: Date
}

interface TagContextType {
    tags: Tag[]
    associations: TagAssociation[]
    createTag: (name: string, color: string) => Tag | null
    updateTag: (id: string, name: string, color: string) => Tag | null
    deleteTag: (id: string) => boolean
    associateTag: (
        tagId: string,
        itemId: string,
        itemType: "folder" | "document",
        newlyCreatedTag?: Tag | null,
    ) => boolean
    disassociateTag: (
        tagId: string,
        itemId: string,
        itemType: "folder" | "document",
    ) => boolean
    getTagsForItem: (itemId: string, itemType: "folder" | "document") => Tag[]
    getItemsWithTag: (
        tagId: string,
        itemType?: "folder" | "document",
    ) => string[]
    getFrequentlyUsedTags: (limit?: number) => Tag[]
    getRecentlyUsedTags: (limit?: number) => Tag[]
    getSuggestedTags: (
        itemType: "folder" | "document",
        itemName: string,
    ) => Tag[]
    batchAssociateTags: (tagIds: string[], items: SelectedItem[]) => boolean
    batchDisassociateTags: (tagIds: string[], items: SelectedItem[]) => boolean
    syncTagsForItem: (
        itemId: string,
        itemType: "folder" | "document",
        newTagIds: string[],
    ) => boolean
}

const TagContext = createContext<TagContextType | undefined>(undefined)

export function TagProvider({ children }: { children: ReactNode }) {
    const logger = LoggingService.getLogger
        ? LoggingService.getLogger("TagContext")
        : {
              debug: console.debug,
              error: console.error,
              info: console.info,
              warn: console.warn,
          }

    const tagStore = useTagStore()
    const {
        tags,
        associations,
        addTag,
        updateTag: updateTagInStore,
        removeTag,
        addAssociation,
        removeAssociation,
        syncItemTags,
        addAssociations,
    } = tagStore

    useEffect(() => {
        if (tags.length === 0 && associations.length === 0) {
            logger.debug("Initializing default tags and associations")

            const defaultTagsData: Omit<
                Tag,
                "id" | "createdAt" | "updatedAt"
            >[] = [
                { name: "Importante", color: "#E74C3C" },
                { name: "Personal", color: "#3498DB" },
                { name: "Trabajo", color: "#2ECC71" },
                { name: "Urgente", color: "#F39C12" },
                { name: "Archivo", color: "#7F8C8D" },
            ]

            const now = new Date()
            const createdTags: Tag[] = defaultTagsData.map((tag, index) => ({
                id: `tag-default-${index + 1}`,
                name: tag.name,
                color: tag.color,
                createdAt: now,
                updatedAt: now,
            }))

            tagStore.setTags(createdTags)
            logger.debug("Created default tags in Spanish", {
                count: createdTags.length,
            })

            const defaultAssociationsData: TagAssociation[] = [
                {
                    tagId: "tag-default-1",
                    itemId: "1",
                    itemType: "folder",
                    createdAt: now,
                }, // Importante -> Documentos de Viaje (ID "1")
                {
                    tagId: "tag-default-2",
                    itemId: "1",
                    itemType: "folder",
                    createdAt: now,
                }, // Personal -> Documentos de Viaje (ID "1")
                {
                    tagId: "tag-default-3",
                    itemId: "2",
                    itemType: "folder",
                    createdAt: now,
                }, // Trabajo -> Registros Médicos (ID "2")
                {
                    tagId: "tag-default-4",
                    itemId: "3",
                    itemType: "folder",
                    createdAt: now,
                }, // Urgente -> Documentos del Vehículo (ID "3")
            ]
            if (createdTags.length > 0) {
                tagStore.setAssociations(defaultAssociationsData)
                logger.debug("Added default associations.", {
                    count: defaultAssociationsData.length,
                })
            }
        }
    }, [])

    const createTag = (name: string, color: string): Tag | null => {
        if (tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase())) {
            logger.error("Tag already exists", { name })
            return null
        }
        const newTag: Tag = {
            id: `tag-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            name,
            color,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        addTag(newTag)
        logger.debug("Created new tag", { id: newTag.id, name })
        return newTag
    }

    const updateTag = (id: string, name: string, color: string): Tag | null => {
        const tagIndex = tags.findIndex((tag) => tag.id === id)
        if (tagIndex === -1) {
            logger.error("Tag not found for update", { id })
            return null
        }
        if (
            tags.some(
                (tag) =>
                    tag.id !== id &&
                    tag.name.toLowerCase() === name.toLowerCase(),
            )
        ) {
            logger.error("Cannot update tag: name already exists", {
                id,
                newName: name,
            })
            return null
        }
        const updatedTagData = { name, color, updatedAt: new Date() }
        updateTagInStore(id, updatedTagData)
        logger.debug("Updated tag", { id, name, color })
        const storeTag = tags.find((t) => t.id === id)
        return storeTag ? { ...storeTag, ...updatedTagData } : null
    }

    const deleteTag = (id: string): boolean => {
        const tagExists = tags.some((tag) => tag.id === id)
        if (!tagExists) {
            logger.error("Tag not found for deletion", { id })
            return false
        }
        removeTag(id)
        logger.debug("Deleted tag", { id })
        return true
    }

    const associateTag = (
        tagId: string,
        itemId: string,
        itemType: "folder" | "document",
        newlyCreatedTag: Tag | null = null,
    ): boolean => {
        const tagExists =
            tags.some((tag) => tag.id === tagId) || newlyCreatedTag !== null
        if (!tagExists) {
            logger.error("Tag not found for association", { tagId })
            return false
        }
        addAssociation({
            tagId,
            itemId,
            itemType,
            createdAt: new Date(),
        })
        logger.debug("Created tag association", { tagId, itemId, itemType })
        return true
    }

    const disassociateTag = (
        tagId: string,
        itemId: string,
        itemType: "folder" | "document",
    ): boolean => {
        const associationExists = associations.some(
            (assoc) =>
                assoc.tagId === tagId &&
                assoc.itemId === itemId &&
                assoc.itemType === itemType,
        )
        if (!associationExists) {
            logger.error("Tag association not found for removal", {
                tagId,
                itemId,
                itemType,
            })
            return false
        }
        removeAssociation(tagId, itemId, itemType)
        logger.debug("Removed tag association", { tagId, itemId, itemType })
        return true
    }

    const syncTagsForItem = (
        itemId: string,
        itemType: "folder" | "document",
        newTagIds: string[],
    ): boolean => {
        logger.debug("Syncing tags for item", {
            itemId,
            itemType,
            tagCount: newTagIds.length,
        })
        syncItemTags(itemId, itemType, newTagIds)
        return true
    }

    const getTagsForItem = (
        itemId: string,
        itemType: "folder" | "document",
    ): Tag[] => {
        const associatedTagIds = associations
            .filter(
                (assoc) =>
                    assoc.itemId === itemId && assoc.itemType === itemType,
            )
            .map((assoc) => assoc.tagId)
        return tags.filter((tag) => associatedTagIds.includes(tag.id))
    }

    const getItemsWithTag = (
        tagId: string,
        itemType?: "folder" | "document",
    ): string[] => {
        return associations
            .filter(
                (assoc) =>
                    assoc.tagId === tagId &&
                    (itemType ? assoc.itemType === itemType : true),
            )
            .map((assoc) => assoc.itemId)
    }

    const getFrequentlyUsedTags = (limit = 5): Tag[] => {
        const tagCounts: Record<string, number> = {}
        associations.forEach((assoc) => {
            tagCounts[assoc.tagId] = (tagCounts[assoc.tagId] || 0) + 1
        })
        const sortedTagIds = Object.keys(tagCounts).sort(
            (a, b) => tagCounts[b] - tagCounts[a],
        )
        return sortedTagIds
            .slice(0, limit)
            .map((id) => tags.find((tag) => tag.id === id))
            .filter((tag): tag is Tag => tag !== undefined)
    }

    const getRecentlyUsedTags = (limit = 5): Tag[] => {
        const sortedAssociations = [...associations].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )
        const recentTagIds: string[] = []
        sortedAssociations.forEach((assoc) => {
            if (!recentTagIds.includes(assoc.tagId)) {
                recentTagIds.push(assoc.tagId)
            }
        })
        return recentTagIds
            .slice(0, limit)
            .map((id) => tags.find((tag) => tag.id === id))
            .filter((tag): tag is Tag => tag !== undefined)
    }

    const getSuggestedTags = (
        itemType: "folder" | "document",
        itemName: string,
    ): Tag[] => {
        const nameLower = itemName.toLowerCase()
        const matchedTags = tags.filter((tag) => {
            return (
                nameLower.includes(tag.name.toLowerCase()) ||
                tag.name.toLowerCase().includes(nameLower)
            )
        })
        const frequentTagsForType = getFrequentlyUsedTags(3).filter((tag) => {
            return associations.some(
                (assoc) =>
                    assoc.tagId === tag.id && assoc.itemType === itemType,
            )
        })
        const suggestedTagIds = new Set([
            ...matchedTags.map((tag) => tag.id),
            ...frequentTagsForType.map((tag) => tag.id),
        ])
        return Array.from(suggestedTagIds)
            .map((id) => tags.find((tag) => tag.id === id))
            .filter((tag): tag is Tag => tag !== undefined)
            .slice(0, 5)
    }

    const batchAssociateTags = (
        tagIds: string[],
        items: SelectedItem[],
    ): boolean => {
        if (tagIds.length === 0 || items.length === 0) return true
        const allTagsExist = tagIds.every((tagId) =>
            tags.some((tag) => tag.id === tagId),
        )
        if (!allTagsExist) {
            logger.error("Batch associate failed: One or more tags not found")
            return false
        }
        const newAssociationsToAdd: TagAssociation[] = []
        const now = new Date()
        tagIds.forEach((tagId) => {
            items.forEach((item) => {
                const exists = associations.some(
                    (assoc) =>
                        assoc.tagId === tagId &&
                        assoc.itemId === item.id &&
                        assoc.itemType === item.type,
                )
                if (!exists) {
                    newAssociationsToAdd.push({
                        tagId,
                        itemId: item.id,
                        itemType: item.type,
                        createdAt: now,
                    })
                }
            })
        })
        if (newAssociationsToAdd.length === 0) {
            logger.debug("Batch associate: No new associations to create")
            return true
        }
        addAssociations(newAssociationsToAdd)
        logger.debug("Batch associated tags", {
            tagCount: tagIds.length,
            itemCount: items.length,
            newAssociations: newAssociationsToAdd.length,
        })
        return true
    }

    const batchDisassociateTags = (
        tagIds: string[],
        items: SelectedItem[],
    ): boolean => {
        if (tagIds.length === 0 || items.length === 0) return true
        let associationsRemovedCount = 0
        tagIds.forEach((tagId) => {
            items.forEach((item) => {
                const exists = associations.some(
                    (assoc) =>
                        assoc.tagId === tagId &&
                        assoc.itemId === item.id &&
                        assoc.itemType === item.type,
                )
                if (exists) {
                    removeAssociation(tagId, item.id, item.type)
                    associationsRemovedCount++
                }
            })
        })
        if (associationsRemovedCount === 0) {
            logger.debug(
                "Batch disassociate: No matching associations found to remove",
            )
            return true
        }
        logger.debug("Batch disassociated tags", {
            tagCount: tagIds.length,
            itemCount: items.length,
            removedCount: associationsRemovedCount,
        })
        return true
    }

    return (
        <TagContext.Provider
            value={{
                tags,
                associations,
                createTag,
                updateTag,
                deleteTag,
                associateTag,
                disassociateTag,
                getTagsForItem,
                getItemsWithTag,
                getFrequentlyUsedTags,
                getRecentlyUsedTags,
                getSuggestedTags,
                batchAssociateTags,
                batchDisassociateTags,
                syncTagsForItem,
            }}
        >
            {children}
        </TagContext.Provider>
    )
}

export function useTagContext() {
    const context = useContext(TagContext)
    if (context === undefined) {
        throw new Error("useTagContext must be used within a TagProvider")
    }
    return context
}
