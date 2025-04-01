// src/context/TagContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react"
import { LoggingService } from "../../../services/monitoring/loggingService.ts"

// Tag type definition
export interface Tag {
    id: string
    name: string
    color: string
    createdAt: Date
    updatedAt: Date
}

// Tag association with items
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
    // Tag suggestion related functions
    getFrequentlyUsedTags: (limit?: number) => Tag[]
    getRecentlyUsedTags: (limit?: number) => Tag[]
    getSuggestedTags: (
        itemType: "folder" | "document",
        itemName: string,
    ) => Tag[]
    // Batch operations
    batchAssociateTags: (
        tagIds: string[],
        itemIds: string[],
        itemType: "folder" | "document",
    ) => boolean
    batchDisassociateTags: (
        tagIds: string[],
        itemIds: string[],
        itemType: "folder" | "document",
    ) => boolean
    syncTagsForItem: (
        itemId: string,
        itemType: "folder" | "document",
        newTagIds: string[],
    ) => void
}

const TagContext = createContext<TagContextType | undefined>(undefined)

export function TagProvider({ children }: { children: ReactNode }) {
    const logger = LoggingService.getLogger
        ? LoggingService.getLogger("TagContext")
        : { debug: console.debug, error: console.error }

    // State for tags and associations
    const [tags, setTags] = useState<Tag[]>([])
    const [associations, setAssociations] = useState<TagAssociation[]>([])

    // Load initial mock data
    useEffect(() => {
        // Mock tags
        const mockTags: Tag[] = [
            {
                id: "tag-1",
                name: "Important",
                color: "#E74C3C",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tag-2",
                name: "Personal",
                color: "#3498DB",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tag-3",
                name: "Work",
                color: "#2ECC71",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tag-4",
                name: "Urgent",
                color: "#F39C12",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tag-5",
                name: "Archive",
                color: "#7F8C8D",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]

        // Mock associations
        const mockAssociations: TagAssociation[] = [
            {
                tagId: "tag-1",
                itemId: "1", // Travel Documents folder
                itemType: "folder",
                createdAt: new Date(),
            },
            {
                tagId: "tag-2",
                itemId: "1", // Travel Documents folder
                itemType: "folder",
                createdAt: new Date(),
            },
            {
                tagId: "tag-3",
                itemId: "2", // Medical Records folder
                itemType: "folder",
                createdAt: new Date(),
            },
            {
                tagId: "tag-4",
                itemId: "3", // Vehicle Documents folder
                itemType: "folder",
                createdAt: new Date(),
            },
        ]

        setTags(mockTags)
        setAssociations(mockAssociations)
        logger.debug("Initialized mock tags and associations", {
            tagCount: mockTags.length,
            associationCount: mockAssociations.length,
        })
    }, [])

    // CRUD operations
    const createTag = (name: string, color: string): Tag | null => {
        if (tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase())) {
            logger.error("Tag already exists", { name })
            return null
        }

        const newTag: Tag = {
            id: `tag-${Date.now()}`,
            name,
            color,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        setTags((prevTags) => [...prevTags, newTag])
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

        const updatedTag = {
            ...tags[tagIndex],
            name,
            color,
            updatedAt: new Date(),
        }

        setTags((prevTags) => {
            const newTags = [...prevTags]
            newTags[tagIndex] = updatedTag
            return newTags
        })

        logger.debug("Updated tag", { id, name, color })
        return updatedTag
    }

    const deleteTag = (id: string): boolean => {
        const tagExists = tags.some((tag) => tag.id === id)

        if (!tagExists) {
            logger.error("Tag not found for deletion", { id })
            return false
        }

        setTags((prevTags) => prevTags.filter((tag) => tag.id !== id))
        setAssociations((prevAssociations) =>
            prevAssociations.filter((assoc) => assoc.tagId !== id),
        )

        logger.debug("Deleted tag", { id })
        return true
    }

    // Association operations - Modified to handle newly created tags
    const associateTag = (
        tagId: string,
        itemId: string,
        itemType: "folder" | "document",
        newlyCreatedTag: Tag | null = null,
    ): boolean => {
        // If full tag metadata is provided and missing, inject it
        if (newlyCreatedTag && !tags.some((tag) => tag.id === tagId)) {
            setTags((prev) => [...prev, newlyCreatedTag])
            logger.debug("Injected newly created tag into tag list", { tagId })
        }

        // Check if tag exists in current state OR is the newly created tag passed in
        const tagExists =
            tags.some((tag) => tag.id === tagId) ||
            (newlyCreatedTag && newlyCreatedTag.id === tagId)

        if (!tagExists) {
            logger.error("Cannot associate: Tag not found", { tagId })
            return false
        }

        const associationExists = associations.some(
            (assoc) =>
                assoc.tagId === tagId &&
                assoc.itemId === itemId &&
                assoc.itemType === itemType,
        )

        if (associationExists) {
            logger.debug("Tag association already exists", {
                tagId,
                itemId,
                itemType,
            })
            return false
        }

        const newAssociation: TagAssociation = {
            tagId,
            itemId,
            itemType,
            createdAt: new Date(),
        }

        setAssociations((prevAssociations) => [
            ...prevAssociations,
            newAssociation,
        ])
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

        setAssociations((prevAssociations) =>
            prevAssociations.filter(
                (assoc) =>
                    !(
                        assoc.tagId === tagId &&
                        assoc.itemId === itemId &&
                        assoc.itemType === itemType
                    ),
            ),
        )

        logger.debug("Removed tag association", { tagId, itemId, itemType })
        return true
    }

    // Query operations
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

        const foundTags: Tag[] = []
        const missingTagIds: string[] = []

        associatedTagIds.forEach((tagId) => {
            const tag = tags.find((t) => t.id === tagId)
            if (tag) {
                foundTags.push(tag)
            } else {
                missingTagIds.push(tagId)
            }
        })

        if (missingTagIds.length > 0) {
            logger.debug?.(
                "⚠️ Some associated tag IDs were not found in `tags[]`",
                {
                    itemId,
                    itemType,
                    missingTagIds,
                },
            )
        }

        return foundTags
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

    // Tag suggestion system
    const getFrequentlyUsedTags = (limit = 5): Tag[] => {
        // Count occurrences of each tag
        const tagCounts: Record<string, number> = {}
        associations.forEach((assoc) => {
            tagCounts[assoc.tagId] = (tagCounts[assoc.tagId] || 0) + 1
        })

        // Sort by count (frequency)
        const sortedTagIds = Object.keys(tagCounts).sort(
            (a, b) => tagCounts[b] - tagCounts[a],
        )

        // Get the top tags (limited by the parameter)
        return sortedTagIds
            .slice(0, limit)
            .map((id) => tags.find((tag) => tag.id === id))
            .filter((tag): tag is Tag => tag !== undefined)
    }

    const getRecentlyUsedTags = (limit = 5): Tag[] => {
        // Sort associations by creation date (newest first)
        const sortedAssociations = [...associations].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )

        // Get unique tag IDs in order of recency
        const recentTagIds: string[] = []
        sortedAssociations.forEach((assoc) => {
            if (!recentTagIds.includes(assoc.tagId)) {
                recentTagIds.push(assoc.tagId)
            }
        })

        // Get the most recent tags (limited by the parameter)
        return recentTagIds
            .slice(0, limit)
            .map((id) => tags.find((tag) => tag.id === id))
            .filter((tag): tag is Tag => tag !== undefined)
    }

    // Suggest tags based on content (simple implementation - in a real app this would be more sophisticated)
    const getSuggestedTags = (
        itemType: "folder" | "document",
        itemName: string,
    ): Tag[] => {
        const nameLower = itemName.toLowerCase()

        // Simple keyword matching
        const matchedTags = tags.filter((tag) => {
            // If the item name contains the tag name or vice versa
            return (
                nameLower.includes(tag.name.toLowerCase()) ||
                tag.name.toLowerCase().includes(nameLower)
            )
        })

        // Add frequently used tags for this item type
        const frequentTagsForType = getFrequentlyUsedTags(3).filter((tag) => {
            // Only include if there's at least one association with this item type
            return associations.some(
                (assoc) =>
                    assoc.tagId === tag.id && assoc.itemType === itemType,
            )
        })

        // Combine and deduplicate
        const suggestedTagIds = new Set([
            ...matchedTags.map((tag) => tag.id),
            ...frequentTagsForType.map((tag) => tag.id),
        ])

        return Array.from(suggestedTagIds)
            .map((id) => tags.find((tag) => tag.id === id))
            .filter((tag): tag is Tag => tag !== undefined)
            .slice(0, 5) // Limit to 5 suggestions
    }

    // Batch operations
    const batchAssociateTags = (
        tagIds: string[],
        itemIds: string[],
        itemType: "folder" | "document",
    ): boolean => {
        // Validate all tags exist
        const allTagsExist = tagIds.every((tagId) =>
            tags.some((tag) => tag.id === tagId),
        )
        if (!allTagsExist) {
            logger.error("Batch associate failed: One or more tags not found")
            return false
        }

        // Create new associations (filtering out existing ones)
        const newAssociations: TagAssociation[] = []

        tagIds.forEach((tagId) => {
            itemIds.forEach((itemId) => {
                // Check if association already exists
                const exists = associations.some(
                    (assoc) =>
                        assoc.tagId === tagId &&
                        assoc.itemId === itemId &&
                        assoc.itemType === itemType,
                )

                if (!exists) {
                    newAssociations.push({
                        tagId,
                        itemId,
                        itemType,
                        createdAt: new Date(),
                    })
                }
            })
        })

        if (newAssociations.length === 0) {
            logger.debug("Batch associate: No new associations to create")
            return true // Consider this a success (nothing to do)
        }

        setAssociations((prev) => [...prev, ...newAssociations])
        logger.debug("Batch associated tags", {
            tagCount: tagIds.length,
            itemCount: itemIds.length,
            newAssociations: newAssociations.length,
        })

        return true
    }

    const syncTagsForItem = (
        itemId: string,
        itemType: "folder" | "document",
        newTagIds: string[],
    ) => {
        const currentTagIds = associations
            .filter((a) => a.itemId === itemId && a.itemType === itemType)
            .map((a) => a.tagId)

        const toAdd = newTagIds.filter((id) => !currentTagIds.includes(id))
        const toRemove = currentTagIds.filter((id) => !newTagIds.includes(id))

        toAdd.forEach((tagId) => associateTag(tagId, itemId, itemType))
        toRemove.forEach((tagId) => disassociateTag(tagId, itemId, itemType))
    }

    const batchDisassociateTags = (
        tagIds: string[],
        itemIds: string[],
        itemType: "folder" | "document",
    ): boolean => {
        // Check if any associations exist
        const hasAssociations = associations.some(
            (assoc) =>
                tagIds.includes(assoc.tagId) &&
                itemIds.includes(assoc.itemId) &&
                assoc.itemType === itemType,
        )

        if (!hasAssociations) {
            logger.debug("Batch disassociate: No matching associations found")
            return false
        }

        // Filter out the specified associations
        setAssociations((prev) =>
            prev.filter(
                (assoc) =>
                    !(
                        tagIds.includes(assoc.tagId) &&
                        itemIds.includes(assoc.itemId) &&
                        assoc.itemType === itemType
                    ),
            ),
        )

        logger.debug("Batch disassociated tags", {
            tagCount: tagIds.length,
            itemCount: itemIds.length,
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

// Custom hook for using tag context
export function useTagContext() {
    const context = useContext(TagContext)
    if (context === undefined) {
        throw new Error("useTagContext must be used within a TagProvider")
    }
    return context
}
