import React, { useState } from "react"
import {
    GestureResponderEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import ArrowIcon from "../assets/svg/Arrow 1.svg"
import { DocumentType, IDocument } from "../../../types/document"
import { Tag, useTagContext } from "../tag_functionality/TagContext"
import { ItemTagsManager } from "../tag_functionality/ItemTagsManager"
import { ListItemCard } from "./ListItemCard"
import { Stack } from "../layout"
import { DocumentActionModal } from "../screens/documents/DocumentActionModal"

import StarIcon from "../assets/svg/starfilled.svg"
import StarOutlineIcon from "../assets/svg/favorite.svg"
import SettingsIcon from "../assets/svg/threedots.svg"

// eslint-disable-next-line react-native/no-inline-styles
const PdfIconPlaceholder = () => <Text style={{ fontSize: 20 }}>📄</Text>
// eslint-disable-next-line react-native/no-inline-styles
const ImageIconPlaceholder = () => <Text style={{ fontSize: 20 }}>🖼️</Text>
// eslint-disable-next-line react-native/no-inline-styles
const DefaultIconPlaceholder = () => <Text style={{ fontSize: 20 }}>❓</Text>

export interface DocumentCardProps {
    document: IDocument
    tags: Tag[]

    onPress: () => void
    onLongPress?: () => void

    isFavorite?: boolean
    onToggleFavorite?: () => void
    onShare?: () => void
    onDelete?: () => void
    // TODO: Add other actions as needed, e.g., onViewDetails

    selected?: boolean
    showAddTagButton?: boolean
    selectedTagIds?: string[]
    onTagPress?: (tagId: string) => void

    testID?: string
    onReplace?: () => void
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
    onReplace,
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

    const iconNode = React.useMemo(() => {
        const docType = document.metadata?.type
        if (docType === DocumentType.PDF) {
            return <PdfIconPlaceholder />
        } else if (
            docType === DocumentType.IMAGE ||
            docType === DocumentType.IMAGE_PNG
        ) {
            return <ImageIconPlaceholder />
        }
        return <DefaultIconPlaceholder />
    }, [document.metadata?.type])

    const handleButtonPress =
        (handler?: () => void) => (event: GestureResponderEvent) => {
            event.stopPropagation()
            handler?.()
        }

    const actionIconsNode = React.useMemo(
        () => (
            <View style={styles.actionButtonsContainer}>
                {/* Favorite Button (only if handler provided) */}
                {onToggleFavorite && (
                    <TouchableOpacity
                        onPress={handleButtonPress(onToggleFavorite)}
                        style={styles.actionButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 5 }}
                        testID={`doc-fav-btn-${document.id}`}
                    >
                        {isFavorite ? (
                            <StarIcon
                                width={18}
                                height={18}
                                fill={colors.warning}
                            />
                        ) : (
                            <StarOutlineIcon
                                width={18}
                                height={18}
                                stroke={colors.secondaryText}
                            />
                        )}
                    </TouchableOpacity>
                )}

                {/* Options Button (only if delete or share handlers provided) */}
                {(onDelete || onShare) && (
                    <TouchableOpacity
                        onPress={handleButtonPress(() =>
                            setActionModalVisible(true),
                        )}
                        style={styles.actionButton}
                        hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }} // Adjust hitSlop
                        testID={`doc-options-btn-${document.id}`}
                    >
                        <SettingsIcon
                            width={18}
                            height={18}
                            fill={colors.secondaryText}
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

    // Children Node
    const documentTags = tagContext.getTagsForItem(document.id, "document")
    const childrenNode = React.useMemo(
        () => (
            <Stack spacing={6} style={styles.childrenStack}>
                {/* Tags */}
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
                {/* Visualizar Link */}
                <View style={styles.viewContainer}>
                    <Text style={[styles.viewText, { color: colors.primary }]}>
                        Visualizar documento
                    </Text>
                    <ArrowIcon width={16} height={16} stroke={colors.primary} />
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

    // Render Base Component
    return (
        <View style={styles.outerContainer}>
            {/* Expired Overlay */}
            {isExpired && <View style={styles.expiredOverlay} />}

            <ListItemCard
                id={document.id}
                title={document.title ?? "Untitled Document"}
                icon={iconNode}
                onPress={onPress}
                onLongPress={onLongPress}
                actionIcons={actionIconsNode}
                selected={selected}
                testID={testID}
            >
                {childrenNode}
            </ListItemCard>

            {/* Render Action Modal */}
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
                        console.log("view details pressed")
                    }}
                    onReplace={() => {
                        setActionModalVisible(false)
                        if (onReplace) onReplace()
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
        marginRight: 5,
    },
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
        marginLeft: 8,
        justifyContent: "center",
        alignItems: "center",
    },
})
