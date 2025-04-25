import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ScrollView,
    ActivityIndicator,
    ViewStyle, // Import ViewStyle
    StyleProp, // Import StyleProp
} from "react-native";
import { useTheme } from "../../../../hooks/useTheme"; // Adjust path
import { BaseModal } from "../../../common/modal"; // Adjust path
import { Text } from "../../typography"; // Adjust path
import { Button } from "../../button"; // Adjust path
import { Spacer, Row } from "../../layout"; // Adjust path
import type { Folder } from "./types"; // Adjust path
import { FolderCard } from "../../cards"; // Adjust path
// Assuming you have a chevron icon
import RightChevronIcon from "../../assets/svg/chevron-right.svg"; // Example path

interface FolderMoveModalProps {
    isVisible: boolean;
    onClose: () => void;
    folders: Folder[];
    selectedFolderIds: string[];
    // currentFolderId: string | null; // Removed as not directly used for filtering logic here
    onMove: (targetFolderId: string | null) => void;
}

export function FolderMoveModal({
                                    isVisible,
                                    onClose,
                                    folders,
                                    selectedFolderIds,
                                    onMove,
                                }: FolderMoveModalProps) {
    const { colors } = useTheme();
    const [targetFolderId, setTargetFolderId] = useState<string | null | undefined>(undefined);
    const [folderPath, setFolderPath] = useState<Folder[]>([]);
    const [currentViewFolderId, setCurrentViewFolderId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- State Reset ---
    useEffect(() => {
        if (isVisible) {
            setTargetFolderId(undefined);
            setCurrentViewFolderId(null);
            setFolderPath([]);
            setIsLoading(false);
        }
    }, [isVisible]);

    // --- Navigation Logic ---
    const navigateToFolder = (folderId: string | null) => {
        setIsLoading(true);
        if (folderId === null) {
            setCurrentViewFolderId(null);
            setFolderPath([]);
        } else {
            const folder = folders.find((f) => f.id === folderId);
            if (folder) {
                setCurrentViewFolderId(folderId);
                const path: Folder[] = [];
                let current: Folder | undefined = folder;
                while (current) {
                    path.unshift(current);
                    current = folders.find(f => f.id === current?.parentId);
                }
                setFolderPath(path);
            }
        }
        setTimeout(() => setIsLoading(false), 50);
    };

    // --- Data Filtering ---
    const getCurrentFolders = () => {
        return folders.filter(
            (folder) =>
                folder.parentId === currentViewFolderId &&
                !selectedFolderIds.includes(folder.id)
        );
    };

    // --- Selection Handling ---
    const handleSelectTarget = (id: string | null) => {
        setTargetFolderId(id);
    };

    // --- Move Action ---
    const handleMove = () => {
        if (targetFolderId !== undefined) {
            onMove(targetFolderId);
            onClose();
        }
    };

    // --- Rendering ---
    const renderFolderItem = ({ item }: { item: Folder }) => (
        <TouchableOpacity
            onPress={() => navigateToFolder(item.id)}
            // Apply item-specific styles to the wrapper if needed
            style={styles.folderItemWrapper}
        >
            <FolderCard
                title={item.title}
                type={item.type ?? "custom"}
                selected={false} // Selection is shown on explicit buttons, not cards
                folderId={item.id}
                showAddTagButton={false}
                onPress={() => navigateToFolder(item.id)}
            />
        </TouchableOpacity>
    );

    const displayedFolders = getCurrentFolders();

    // Pre-calculate styles for selection buttons to fix TS error [cite: 2]
    const isCurrentSelected = targetFolderId === currentViewFolderId;
    const isRootSelected = targetFolderId === null;

    const selectCurrentButtonStyle: StyleProp<ViewStyle> = [
        styles.selectCurrentButton,
        { borderColor: colors.primary }, // Base border color
        isCurrentSelected && styles.selectedTargetButton, // Apply conditional border style
        { backgroundColor: isCurrentSelected ? colors.primary + '20' : colors.card } // Apply conditional background
    ];

    const selectRootButtonStyle: StyleProp<ViewStyle> = [
        styles.selectRootButton,
        { borderColor: colors.border }, // Base border color
        isRootSelected && styles.selectedTargetButton, // Apply conditional border style
        { backgroundColor: isRootSelected ? colors.primary + '20' : colors.card } // Apply conditional background
    ];

    return (
        <BaseModal isVisible={isVisible} onClose={onClose} dismissOnBackdropPress={false}>
            <View style={styles.modalContainer}>
                <Text variant="md" weight="bold" style={[styles.title, { color: colors.text }]}>
                    Mover carpeta
                </Text>
                <Spacer size={10} />

                {/* --- Breadcrumbs and Select Current --- */}
                <Row align="center" justify="space-between" style={styles.navigationRow}>
                    {/* Breadcrumbs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.breadcrumbsScrollView}
                        contentContainerStyle={styles.breadcrumbsContent}
                    >
                        {/* Root Breadcrumb */}
                        <TouchableOpacity
                            style={styles.breadcrumbItem}
                            onPress={() => navigateToFolder(null)}
                        >
                            <Text
                                variant="sm"
                                style={[
                                    styles.breadcrumbText,
                                    // Apply active style directly based on condition
                                    currentViewFolderId === null
                                        ? [styles.breadcrumbActive, { color: colors.text }] // Active style needs color too
                                        : { color: colors.primary }
                                ]}
                            >
                                Elige una carpeta destino
                            </Text>
                        </TouchableOpacity>
                        {/* Folder Path Breadcrumbs */}
                        {folderPath.map((folder) => (
                            <Row key={folder.id} align="center">
                                <RightChevronIcon width={12} height={12} color={colors.secondaryText} style={styles.breadcrumbSeparator} />
                                <TouchableOpacity
                                    style={styles.breadcrumbItem}
                                    onPress={() => navigateToFolder(folder.id)}
                                >
                                    <Text
                                        variant="sm"
                                        style={[
                                            styles.breadcrumbText,
                                            // Apply active style directly based on condition
                                            currentViewFolderId === folder.id
                                                ? [styles.breadcrumbActive, { color: colors.text }] // Active style needs color too
                                                : { color: colors.primary }
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {folder.title}
                                    </Text>
                                </TouchableOpacity>
                            </Row>
                        ))}
                    </ScrollView>

                    {/* Select Current Folder Button */}
                    {currentViewFolderId !== null && (
                        <TouchableOpacity
                            // Apply pre-calculated style array [cite: 2]
                            style={selectCurrentButtonStyle}
                            onPress={() => handleSelectTarget(currentViewFolderId)}
                        >
                            <Text style={[styles.selectButtonText, { color: colors.primary }]}>
                                Select Current
                            </Text>
                        </TouchableOpacity>
                    )}
                </Row>
                <Spacer size={10}/>

                {/* --- Select Root Option --- */}
                <TouchableOpacity
                    // Apply pre-calculated style array [cite: 2]
                    style={selectRootButtonStyle}
                    onPress={() => handleSelectTarget(null)}
                >
                    <Text style={[styles.selectButtonText, { color: colors.text }]}>
                        Mover a vista general
                    </Text>
                </TouchableOpacity>
                <Spacer size={16} />


                {/* --- Folder List --- */}
                <Text variant="sm" weight="medium" style={[styles.subheading, { color: colors.secondaryText }]}>
                    Navega y escoge una carpeta
                </Text>
                <View style={styles.folderListContainer}>
                    {isLoading ? (
                        <ActivityIndicator style={styles.loadingIndicator} />
                    ) : (
                        <FlatList
                            data={displayedFolders}
                            renderItem={renderFolderItem}
                            keyExtractor={(item) => item.id}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text variant="sm" style={{ color: colors.secondaryText }}>
                                        (No hay carpetas disponibles)
                                    </Text>
                                </View>
                            }
                        />
                    )}
                    {/* --- Action Buttons --- */}
                    <Row justify="space-between">
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Cancelar"
                                onPress={onClose}
                                variant="outline"
                                style={styles.cancelButton}
                            />
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Mover"
                                onPress={handleMove}
                                disabled={targetFolderId === undefined}
                            />
                        </View>
                    </Row>
                </View>
                <Spacer size={16} />

            </View>
        </BaseModal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flexShrink: 1,
        padding: 15,
        maxHeight: '85%',
        width: '100%',
    },
    title: {
        marginBottom: 10,
        textAlign: "center",
    },
    navigationRow: {
        marginBottom: 8,
        // Ensure this row doesn't allow content to overlap
        minHeight: 35, // Set minimum height
    },
    breadcrumbsScrollView: {
        flexShrink: 1, // Allow shrinking
        maxWidth: '70%', // Prevent breadcrumbs from taking all space
    },
    breadcrumbsContent: {
        alignItems: 'center',
    },
    breadcrumbItem: {
        paddingHorizontal: 4,
        paddingVertical: 4,
        marginRight: 2,
    },
    breadcrumbText: {
        fontSize: 14,
    },
    breadcrumbActive: { // Style for the *currently viewed* folder in breadcrumbs
        fontWeight: "bold",
        // color set dynamically
    },
    breadcrumbSeparator: {
        marginHorizontal: 4,
        alignSelf: 'center', // Align chevron vertically
    },
    selectCurrentButton: { // Base style for the button itself
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        borderWidth: 1, // Base border width
        marginLeft: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectRootButton: { // Base style for the button itself
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectButtonText: {
        fontSize: 13,
        fontWeight: '500',
    },
    selectedTargetButton: { // Applied when this button represents the selected target
        borderWidth: 2.5, // Thicker border for selected target
        // backgroundColor is applied dynamically
    },
    folderListContainer: {
        flex: 1,
        minHeight: 100,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingTop: 8,
    },
    subheading: {
        marginBottom: 8,
        paddingLeft: 4,
    },
    folderItemWrapper: { // Style for the touchable wrapper around FolderCard
        // Add padding/margin here if needed for spacing items in the list
        marginBottom: 4,
    },
    // folderItemCard style removed as it's not passed to FolderCard
    emptyContainer: {
        height: 80,
        alignItems: "center",
        justifyContent: 'center',
    },
    loadingIndicator: {
        marginTop: 20,
    },
    buttonContainer: {
        flex: 1,
        marginHorizontal: 5,
    },
    cancelButton: {
        // Using Button variant="outline" handles styling
    },
    // disabledButton style removed (handled by Button's disabled prop)
});
