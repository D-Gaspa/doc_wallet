import React, { ReactNode } from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useTheme } from "../../../hooks/useTheme"
import { Row, Stack } from "../layout"

interface ListItemCardProps {
    id: string
    title: string
    icon: ReactNode
    actionIcons?: ReactNode
    children?: ReactNode
    onPress?: () => void
    onLongPress?: () => void
    selected?: boolean
    testID?: string
}

export function ListItemCard({
    id,
    title,
    icon,
    actionIcons,
    children,
    onPress,
    onLongPress,
    selected = false,
    testID,
}: ListItemCardProps) {
    const { colors } = useTheme()

    return (
        <TouchableOpacity
            style={[
                styles.container,
                // eslint-disable-next-line
                {
                    borderBottomColor: colors.border,
                    backgroundColor: selected
                        ? colors.primary + "15"
                        : "transparent",
                },
            ]}
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={500}
            testID={testID ?? `list-item-${id}`}
            activeOpacity={0.7}
        >
            {/* Optional: Selection indicator bar */}
            {selected && (
                <View
                    style={[
                        styles.selectionIndicator,
                        { backgroundColor: colors.primary },
                    ]}
                />
            )}

            <Row align="center" style={styles.contentRow} spacing={0}>
                {/* 1. Icon Area (Fixed Width) */}
                <View style={styles.iconWrapper}>{icon}</View>

                {/* 2. Center Content Area (Title + Children) */}
                <Stack style={styles.centerContent} spacing={4}>
                    <Text
                        style={[styles.title, { color: colors.text }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {title}
                    </Text>
                    {/* Render secondary content if provided */}
                    {children && (
                        <View style={styles.childrenContainer}>{children}</View>
                    )}
                </Stack>

                {/* 3. Right Action Icons Area */}
                {actionIcons && (
                    <View style={styles.actionIconsWrapper}>{actionIcons}</View>
                )}
            </Row>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: StyleSheet.hairlineWidth,
        position: "relative",
        paddingHorizontal: 8,
        paddingVertical: 12,
    },
    selectionIndicator: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
    },
    contentRow: {
        flex: 1,
        marginLeft: 4,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    centerContent: {
        flex: 1,
        justifyContent: "center",
    },
    title: {
        fontSize: 16,
        fontWeight: "500",
    },
    childrenContainer: {
        marginTop: 2,
        width: "100%",
    },
    actionIconsWrapper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingLeft: 8,
    },
})
