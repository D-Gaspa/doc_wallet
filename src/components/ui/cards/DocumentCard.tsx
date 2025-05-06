import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import ArrowIcon from "../assets/svg/Arrow 1.svg"
import { DocumentType, IDocument } from "../../../types/document"
import { Tag, useTagContext } from "../tag_functionality/TagContext"
import { ItemTagsManager } from "../tag_functionality/ItemTagsManager"
import { ListItemCard } from "./ListItemCard"
import { Stack } from "../layout"

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

    showAddTagButton?: boolean
    selectedTagIds?: string[]
    onTagPress?: (tagId: string) => void

    testID?: string
}

export function DocumentCard({
    document,
    tags = [],
    onPress,
    onLongPress,
    testID,
    showAddTagButton = true,
    selectedTagIds = [],
    onTagPress,
}: DocumentCardProps) {
    const { colors } = useTheme()
    const tagContext = useTagContext()

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

    const childrenNode = React.useMemo(
        () => (
            <Stack spacing={6} style={styles.childrenStack}>
                {/* Tags */}
                <ItemTagsManager
                    itemId={document.id}
                    itemType="document"
                    tags={tags}
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
            tags,
            tagContext.tags,
            showAddTagButton,
            selectedTagIds,
            onTagPress,
            colors.primary,
        ],
    )

    // --- Render Base Component ---
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
                actionIcons={null}
                testID={testID}
            >
                {childrenNode}
            </ListItemCard>
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
})
