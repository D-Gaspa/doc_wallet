import React from "react"
import { StyleSheet, TouchableOpacity } from "react-native"
import { Row, Stack, Spacer } from "../../layout"
import { Text } from "../../typography"
import { SearchBar } from "../../search_bar"
import { TagFilterDropdown } from "../../tag_functionality/TagFilter"
import { Folder } from "./types"
import { ActiveTagFilters } from "../../tag_functionality/ActiveTagFilters"

interface FolderHeaderProps {
    currentFolderId: string | null
    getCurrentFolderName: () => string
    handleBackPress: () => void
    folders: Folder[]
    selectedTagFilters: string[]
    setSelectedTagFilters: (tagIds: string[]) => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    testID?: string
}

export function FolderHeader({
    currentFolderId,
    getCurrentFolderName,
    handleBackPress,
    folders,
    selectedTagFilters,
    setSelectedTagFilters,

    setSearchQuery,
    testID,
}: FolderHeaderProps) {
    // Handler for removing a single tag filter
    const handleRemoveFilter = (tagId: string) => {
        setSelectedTagFilters(selectedTagFilters.filter((id) => id !== tagId))
    }

    // Handler for clearing all tag filters
    const handleClearFilters = () => {
        setSelectedTagFilters([])
    }

    // Handler for search
    const handleSearch = (query: string) => {
        setSearchQuery(query)
    }

    return (
        <Stack spacing={8} testID={testID ?? "folder-header"}>
            {/* Breadcrumb navigation */}
            {currentFolderId && (
                <Row
                    align="center"
                    justify="flex-start"
                    spacing={4}
                    style={styles.breadcrumb}
                >
                    <TouchableOpacity onPress={handleBackPress}>
                        <Text variant="sm" weight="medium">
                            {"< Back to " +
                                (folders.find(
                                    (f) =>
                                        f.id ===
                                        folders.find(
                                            (folder) =>
                                                folder.id === currentFolderId,
                                        )?.parentId,
                                )?.title || "Folders")}
                        </Text>
                    </TouchableOpacity>
                </Row>
            )}

            <Spacer size={20} />

            {/* Current folder title with filter dropdown */}
            <Row justify="space-between" align="center" style={styles.titleRow}>
                <Text variant="md" weight="bold" style={styles.titleText}>
                    {getCurrentFolderName()}
                </Text>
                <TagFilterDropdown
                    selectedTagIds={selectedTagFilters}
                    onSelectTags={setSelectedTagFilters}
                    testID="tag-filter-dropdown"
                />
            </Row>

            {/* Search bar */}
            <SearchBar
                placeholder="Search folders or documents..."
                onSearch={handleSearch}
                testID="folder-search-bar"
            />

            {/* Active tag filters display */}
            <ActiveTagFilters
                selectedTagFilters={selectedTagFilters}
                onRemoveFilter={handleRemoveFilter}
                onClearFilters={handleClearFilters}
                testID="active-tag-filters"
            />
        </Stack>
    )
}

const styles = StyleSheet.create({
    breadcrumb: {
        paddingVertical: 8,
    },
    titleRow: {
        marginBottom: 12,
    },
    titleText: {
        flex: 1, // This allows the title to take up most of the space but shrink if needed
    },
})
