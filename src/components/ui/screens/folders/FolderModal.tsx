// src/components/ui/screens/folders/FolderModal.tsx (Corrected)

import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, ScrollView, ViewStyle, Animated } from "react-native";
import { useTheme } from "../../../../hooks/useTheme";
import { BaseModal } from "../../../common/modal";
import { Stack } from "../../layout";
import { Row } from "../../layout";
import { Spacer } from "../../layout";
import { Text } from "../../typography";
import { TextField } from "../../form";
import { FolderCard } from "../../cards"; // Import FolderCardProps if using FolderCard inside
import { Button } from "../../button";
import { LoggingService } from "../../../../services/monitoring/loggingService";
import { useDismissGesture } from "../../gestures/useDismissGesture.ts";
import { CustomIconSelector } from "./CustomIconSelector";
// Removed Switch import

export type FolderType = "travel" | "medical" | "car" | "education" | "custom";

// Props Updated: Removed 'favorite' from onSave
interface UnifiedFolderModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSave: (
        name: string,
        type: FolderType,
        customIconId?: string,
        folderId?: string
        // favorite parameter removed
    ) => void;
    mode: "create" | "edit";
    initialData?: {
        id?: string;
        name?: string;
        type?: FolderType;
        customIconId?: string;
        favorite?: boolean; // Can still receive initial favorite for display elsewhere if needed
    };
    parentFolderId?: string | null;
}

export function UnifiedFolderModal({
                                       isVisible,
                                       onClose,
                                       onSave,
                                       mode = "create",
                                       initialData = {},
                                       parentFolderId = null,
                                   }: UnifiedFolderModalProps) {
    const { colors } = useTheme();
    const logger = LoggingService.getLogger
        ? LoggingService.getLogger("UnifiedFolderModal")
        : { debug: console.debug };
    // Removed isFavorite state
    const isMounted = useRef(false);

    const [folderName, setFolderName] = useState(initialData.name || "");
    const [selectedType, setSelectedType] = useState<FolderType>(
        initialData.type || "custom"
    );
    const [customIconId, setCustomIconId] = useState(
        initialData.customIconId || "file"
    );
    const [showCustomSelector, setShowCustomSelector] = useState(
        selectedType === "custom"
    );

    const handleCancelRef = useRef(() => {
        if (mode === "create") {
            setFolderName("");
            setSelectedType("custom");
            setCustomIconId("file");
        }
        onClose();
    });

    const { translateX, panHandlers, resetPosition } = useDismissGesture({
        onDismiss: handleCancelRef.current,
        direction: "horizontal",
    });

    useEffect(() => {
        if (isVisible) {
            setFolderName(initialData.name || "");
            setSelectedType(initialData.type || "custom");
            setCustomIconId(initialData.customIconId || "file");
            setShowCustomSelector(initialData.type === "custom");

            const timer = setTimeout(() => {
                isMounted.current = true;
                if (resetPosition) resetPosition();
            }, 100);

            return () => {
                clearTimeout(timer);
                isMounted.current = false;
            };
        }
    }, [isVisible, initialData]);

    const folderTypes = [ /* ... folder types ... */
        { type: "travel" as const, label: "Travel" },
        { type: "medical" as const, label: "Medical" },
        { type: "car" as const, label: "Vehicle" },
        { type: "education" as const, label: "Education" },
        { type: "custom" as const, label: "Custom" },
    ];

    const handleTypeSelect = (type: FolderType) => { /* ... remains same ... */
        if (!isMounted.current) return;
        setSelectedType(type);
        if (type === "custom") {
            if (!customIconId) setCustomIconId("file");
            setTimeout(() => { setShowCustomSelector(true); }, 50);
        } else {
            setShowCustomSelector(false);
        }
    };
    const handleIconSelect = (iconId: string) => { /* ... remains same ... */
        if (!isMounted.current) return;
        setCustomIconId(iconId);
    };

    const handleSave = () => {
        if (!isMounted.current || folderName.trim() === "") return;

        // Call onSave WITHOUT favorite parameter
        onSave(
            folderName.trim(), // Trim name on save
            selectedType,
            selectedType === "custom" ? customIconId : undefined,
            initialData.id
        );

        logger.debug(`${mode === "create" ? "Creating" : "Updating"} folder`, { /* ... logging data ... */
            name: folderName.trim(), type: selectedType, customIconId: selectedType === "custom" ? customIconId : undefined, parentId: parentFolderId, id: initialData.id,
        });

        if (mode === "create") {
            setFolderName("");
            setSelectedType("custom");
            setCustomIconId("file");
        }
        onClose();
    };

    function handleCancel() { handleCancelRef.current(); }

    const buttonStyle: ViewStyle = folderName.trim() === "" ? { ...styles.disabledButton } : {};
    const modalTitle = mode === "create" ? "Create new folder" : "Edit folder";
    const actionButtonText = mode === "create" ? "Create Folder" : "Update Folder";

    return (
        <BaseModal isVisible={isVisible} onClose={handleCancel} dismissOnBackdropPress={false}>
            <Animated.View style={[styles.modalContent, { transform: [{ translateX }] }]} {...panHandlers}>
                {/* Header Bar */}
                <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
                    {/* ... close indicator, spacer, title ... */}
                    <View style={[styles.closeIndicator, { backgroundColor: colors.secondaryText }]} />
                    <Spacer size={20} />
                    <Text variant="md" weight="bold" style={styles.title}>
                        {modalTitle}
                    </Text>
                    <Row justify="space-between" align="center" style={styles.buttonRow}>
                        <View style={styles.buttonContainer}><Button title="Cancel" onPress={handleCancel} testID="cancel-button" /></View>
                        <View style={styles.buttonContainer}><Button title={actionButtonText} onPress={handleSave} style={buttonStyle} testID={mode === "create" ? "create-button" : "update-button"} /></View>
                    </Row>
                </View>

                {/* Scrollable Content */}
                <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.container} testID={`folder-${mode}-modal`}>
                        <Stack spacing={16}>
                            {/* Favorite Toggle Section Removed */}

                            {/* Folder Name Input */}
                            <Stack spacing={8}>
                                <Text weight="medium">Folder Name</Text>
                                <TextField placeholder="Enter folder name" value={folderName} onChangeText={setFolderName} testID="folder-name-input" style={styles.textField}/>
                            </Stack>

                            {/* Folder Type Selection */}
                            <Stack spacing={8}>
                                <Text weight="medium">Folder Type</Text>
                                <View style={styles.typesOuterContainer}>
                                    {folderTypes.map((item) => (
                                        <View
                                            key={item.type}
                                            style={[
                                                styles.folderCardWrapper,
                                                selectedType === item.type && { backgroundColor: colors.primary + "20", borderColor: colors.primary },
                                            ]}
                                        >
                                            <FolderCard
                                                title={item.label}
                                                type={item.type}
                                                onPress={() => handleTypeSelect(item.type)}
                                                testID={`folder-type-${item.type}`}
                                                // Provide required dummy prop for onToggleFavorite
                                                onToggleFavorite={() => {}}
                                            />
                                        </View>
                                    ))}
                                </View>
                            </Stack>

                            {/* Custom Icon Selector */}
                            <View style={styles.iconSelectorContainer}>
                                {showCustomSelector && selectedType === "custom" ? (
                                    <CustomIconSelector selectedIconId={customIconId} onSelectIcon={handleIconSelect} />
                                ) : ( <View style={styles.placeholderContainer} /> )}
                            </View>
                        </Stack>
                    </View>
                </ScrollView>
            </Animated.View>
        </BaseModal>
    );
}

// --- Stylesheet --- (Keep existing styles)
const styles = StyleSheet.create({
    modalContent: { flex: 1, width: "100%", },
    scrollContainer: { flex: 1, width: "100%", },
    scrollContentContainer: { flexGrow: 1, paddingBottom: 30, },
    container: { padding: 20, flex: 1 },
    headerBar: { paddingVertical: 16, paddingHorizontal: 20, alignItems: "center", borderBottomWidth: 1, width: "100%", },
    title: { marginVertical: 10, textAlign: 'center' },
    closeIndicator: { width: 40, height: 5, borderRadius: 2.5, marginBottom: 5, alignSelf: 'center' },
    textField: { width: "100%", },
    typesOuterContainer: { width: "100%", paddingVertical: 5, },
    folderCardWrapper: { borderWidth: 1, borderRadius: 8, marginBottom: 8, overflow: "hidden", },
    iconSelectorContainer: { width: "100%", minHeight: 120, marginTop: 10, marginBottom: 20, },
    placeholderContainer: { minHeight: 120, },
    buttonRow: { width: "100%", },
    buttonContainer: { flex: 0.48, },
    disabledButton: { opacity: 0.5, }
});
