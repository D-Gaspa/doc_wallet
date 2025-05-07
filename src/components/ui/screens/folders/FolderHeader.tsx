import React from "react"
import { StyleSheet, TouchableOpacity } from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { Row, Spacer, Stack } from "../../layout"
import { Text } from "../../typography"
import { SearchBar } from "../../search_bar"
import { TagFilterDropdown } from "../../tag_functionality/TagFilter"
import { Folder } from "./types"
import { ActiveTagFilters } from "../../tag_functionality/ActiveTagFilters"
import { SortDropdown, SortOption } from "../../search_engine/SortDropdown"
import { useTheme } from "../../../../hooks/useTheme"

export type FolderSortOption = "name" | "date" | "type"

interface FolderHeaderProps {
    currentFolderId: string | null
    getCurrentFolderName: () => string
    handleBackPress: () => void
    folders: Folder[]
    selectedTagFilters: string[]
    setSelectedTagFilters: (tagIds: string[]) => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    sortOption?: FolderSortOption
    setSortOption?: (option: FolderSortOption) => void
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
    sortOption = "name",
    setSortOption,
    testID,
}: FolderHeaderProps) {
    const { colors } = useTheme()

    const handleRemoveFilter = (tagId: string) => {
        setSelectedTagFilters(selectedTagFilters.filter((id) => id !== tagId))
    }

    const handleClearFilters = () => {
        setSelectedTagFilters([])
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query)
    }

    const getParentFolderName = () => {
        if (!currentFolderId) return "Carpetas"
        const currentFolder = folders.find(
            (folder) => folder.id === currentFolderId,
        )
        if (!currentFolder?.parentId) return "Carpetas"
        const parentFolder = folders.find(
            (f) => f.id === currentFolder.parentId,
        )
        return parentFolder ? parentFolder.title : "Carpetas"
    }

    return (
        <Stack spacing={8} testID={testID ?? "folder-header"}>
            {/* Breadcrumb navigation - simplified back button */}
            {currentFolderId && (
                <TouchableOpacity
                    onPress={handleBackPress}
                    style={styles.backButtonContainer}
                    accessibilityLabel="Regresar"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <FontAwesome6
                        name="chevron-left"
                        size={18}
                        color={colors.primary}
                        iconStyle="solid"
                    />
                    <Text
                        variant="sm"
                        weight="medium"
                        style={[
                            styles.backButtonText,
                            { color: colors.primary },
                        ]}
                    >
                        Regresar a {getParentFolderName()}
                    </Text>
                </TouchableOpacity>
            )}
            <Spacer size={currentFolderId ? 10 : 20} />
            {/* Current folder title with filter dropdown */}
            <Row justify="space-between" align="center" style={styles.titleRow}>
                <Text
                    variant="md"
                    weight="bold"
                    style={[styles.titleText, { color: colors.text }]}
                >
                    {getCurrentFolderName()}
                </Text>
                <Row spacing={0} align="center">
                    {setSortOption && (
                        <SortDropdown
                            sortOption={sortOption as SortOption}
                            onSelect={(opt) =>
                                setSortOption(opt as FolderSortOption)
                            }
                            testID="folder-sort-dropdown"
                        />
                    )}
                    <TagFilterDropdown
                        selectedTagIds={selectedTagFilters}
                        onSelectTags={setSelectedTagFilters}
                        testID="tag-filter-dropdown"
                    />
                </Row>
            </Row>
            {/* Search bar */}
            <SearchBar
                placeholder="Buscar carpetas o documentos..."
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
    backButtonContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 24,
        paddingVertical: 10,
    },
    backButtonText: {
        marginLeft: 8,
    },
    titleRow: {
        marginBottom: 12,
    },
    titleText: {
        flex: 1,
        marginRight: 8,
    },
})
