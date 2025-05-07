import React, { useMemo, useState } from "react"
import {
    GestureResponderEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../hooks/useTheme"
import { DocumentType, IDocument } from "../../../types/document"
import { Tag, useTagContext } from "../tag_functionality/TagContext"
import { ItemTagsManager } from "../tag_functionality/ItemTagsManager"
import { ListItemCard } from "./ListItemCard"
import { Stack } from "../layout"
import { DocumentActionModal } from "../screens/documents/DocumentActionModal"

export interface DocumentCardProps {
    document: IDocument
    tags: Tag[]
    onPress: () => void
    onLongPress?: () => void
    isFavorite?: boolean
    onToggleFavorite?: () => void
    onShare?: () => void
    onDelete?: () => void
    selected?: boolean
    showAddTagButton?: boolean
    selectedTagIds?: string[]
    onTagPress?: (tagId: string) => void
    testID?: string
}

export function DocumentCard({
    document,
    onPress,
    onLongPress,
    isFavorite = false,
    onToggleFavorite,
    onShare,
    onDelete,
    selected = false,
    showAddTagButton = true,
    selectedTagIds = [],
    onTagPress,
    testID,
}: DocumentCardProps) {
    const { colors } = useTheme()
    const tagContext = useTagContext()
    const [actionModalVisible, setActionModalVisible] = useState(false)

    const isExpired = (() => {
        const expirationParam = document.parameters?.find(
            (p) => p.key === "expiration_date",
        )
        if (!expirationParam?.value) return false
        try {
            const expirationDate = new Date(expirationParam.value)
            if (isNaN(expirationDate.getTime())) return false
            const now = new Date()
            expirationDate.setHours(0, 0, 0, 0)
            now.setHours(0, 0, 0, 0)
            return expirationDate < now
        } catch (e) {
            console.warn("Error parsing expiration date:", e)
            return false
        }
    })()

    const iconNode = useMemo(() => {
        const docType = document.metadata?.type
        const iconSize = 28
        if (docType === DocumentType.PDF) {
            return (
                <FontAwesome6
                    name="file-pdf"
                    size={iconSize}
                    color={colors.error}
                    iconStyle="solid"
                />
            )
        } else if (
            docType === DocumentType.IMAGE ||
            docType === DocumentType.IMAGE_PNG
        ) {
            return (
                <FontAwesome6
                    name="file-image"
                    size={iconSize}
                    color={colors.primary}
                    iconStyle="solid"
                />
            )
        }
        return (
            <FontAwesome6
                name="file-lines"
                size={iconSize}
                color={colors.secondaryText}
                iconStyle="solid"
            />
        )
    }, [document.metadata?.type, colors])

    const handleButtonPress =
        (handler?: () => void) => (event: GestureResponderEvent) => {
            event.stopPropagation()
            handler?.()
        }

    const actionIconsNode = useMemo(
        () => (
            <View style={styles.actionButtonsContainer}>
                {onToggleFavorite && (
                    <TouchableOpacity
                        onPress={handleButtonPress(onToggleFavorite)}
                        style={styles.actionButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 5 }}
                        testID={`doc-fav-btn-${document.id}`}
                        accessibilityLabel={
                            isFavorite
                                ? "Quitar de favoritos"
                                : "Añadir a favoritos"
                        }
                    >
                        {isFavorite ? (
                            <FontAwesome6
                                name="star"
                                size={18}
                                color={colors.warning}
                                iconStyle="solid"
                            />
                        ) : (
                            <FontAwesome6
                                name="star"
                                size={18}
                                color={colors.secondaryText}
                                iconStyle="regular"
                            />
                        )}
                    </TouchableOpacity>
                )}
                {(onDelete || onShare) && (
                    <TouchableOpacity
                        onPress={handleButtonPress(() =>
                            setActionModalVisible(true),
                        )}
                        style={styles.actionButton}
                        hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
                        testID={`doc-options-btn-${document.id}`}
                        accessibilityLabel="Más opciones"
                    >
                        <FontAwesome6
                            name="ellipsis-vertical"
                            size={18}
                            color={colors.secondaryText}
                            iconStyle="solid"
                        />
                    </TouchableOpacity>
                )}
            </View>
        ),
        [
            document.id,
            isFavorite,
            onToggleFavorite,
            onShare,
            onDelete,
            colors,
            setActionModalVisible,
        ],
    )

    const documentTags = tagContext.getTagsForItem(document.id, "document")
    const childrenNode = useMemo(
        () => (
            <Stack spacing={6} style={styles.childrenStack}>
                <ItemTagsManager
                    itemId={document.id}
                    itemType="document"
                    tags={documentTags}
                    allTags={tagContext.tags}
                    showAddTagButton={showAddTagButton}
                    selectedTagIds={selectedTagIds}
                    onTagPress={onTagPress}
                    horizontal={true}
                    size="small"
                    initiallyExpanded={false}
                />
                <View style={styles.viewContainer}>
                    <Text style={[styles.viewText, { color: colors.primary }]}>
                        Ver documento
                    </Text>
                    <FontAwesome6
                        name="arrow-right"
                        size={14}
                        color={colors.primary}
                        iconStyle="solid"
                        style={styles.viewIcon}
                    />
                </View>
            </Stack>
        ),
        [
            document.id,
            documentTags,
            tagContext.tags,
            showAddTagButton,
            selectedTagIds,
            onTagPress,
            colors.primary,
        ],
    )

    return (
        <View style={styles.outerContainer}>
            {isExpired && <View style={styles.expiredOverlay} />}
            <ListItemCard
                id={document.id}
                title={document.title ?? "Documento sin título"}
                icon={iconNode}
                onPress={onPress}
                onLongPress={onLongPress}
                actionIcons={actionIconsNode}
                selected={selected}
                testID={testID}
            >
                {childrenNode}
            </ListItemCard>
            {document && (
                <DocumentActionModal
                    isVisible={actionModalVisible}
                    onClose={() => setActionModalVisible(false)}
                    document={document}
                    isFavorite={isFavorite}
                    onToggleFavorite={() => {
                        if (onToggleFavorite) onToggleFavorite()
                        setActionModalVisible(false)
                    }}
                    onShare={() => {
                        if (onShare) onShare()
                        setActionModalVisible(false)
                    }}
                    onDelete={() => {
                        if (onDelete) onDelete()
                        setActionModalVisible(false)
                    }}
                    onViewDetails={() => {
                        // TODO: This should ideally trigger the main onPress action for the card
                        //       or navigate to a dedicated details screen.
                        //       For now, it just logs. If onPress is the detail view, this might be redundant.
                        onPress() // Or a specific detail view action
                        setActionModalVisible(false)
                        console.log("view details pressed from modal")
                    }}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    outerContainer: {
        position: "relative",
    },
    childrenStack: {},
    viewContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    viewText: {
        fontSize: 14,
        fontWeight: "500",
        marginRight: 6,
    },
    viewIcon: {},
    // eslint-disable-next-line react-native/no-color-literals
    expiredOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        borderRadius: 8,
        zIndex: 2,
        pointerEvents: "none",
    },
    actionButtonsContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    actionButton: {
        padding: 4,
        marginLeft: 10,
        justifyContent: "center",
        alignItems: "center",
    },
})
