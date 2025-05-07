import React, { useMemo } from "react"
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../../hooks/useTheme"

export interface BreadcrumbItem {
    id: string | null
    title: string
}

interface BreadcrumbNavigationProps {
    path: BreadcrumbItem[]
    onNavigate: (folderId: string | null) => void
    testID?: string
}

export function BreadcrumbNavigation({
    path,
    onNavigate,
    testID,
}: BreadcrumbNavigationProps) {
    const { colors } = useTheme()
    const iconSize = 12

    const displayPath = useMemo(() => {
        const rootLabel = "Inicio"
        if (path.length === 0) {
            return [{ id: null, title: rootLabel }]
        }
        if (path[0].id !== null && path[0].title !== rootLabel) {
            return [{ id: null, title: rootLabel }, ...path]
        }
        return path.map((item) =>
            item.id === null ? { ...item, title: rootLabel } : item,
        )
    }, [path])

    return (
        <View
            style={styles.container}
            testID={testID ?? "breadcrumb-navigation"}
        >
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {displayPath.map((item, index) => {
                    const isLastItem = index === displayPath.length - 1
                    return (
                        <React.Fragment key={item.id ?? "root-breadcrumb"}>
                            <TouchableOpacity
                                style={styles.breadcrumbItem}
                                onPress={() => onNavigate(item.id)}
                                disabled={isLastItem}
                                accessibilityRole="button"
                                accessibilityLabel={item.title}
                                accessibilityState={{ disabled: isLastItem }}
                            >
                                <Text
                                    style={[
                                        styles.breadcrumbText,
                                        isLastItem
                                            ? // eslint-disable-next-line react-native/no-inline-styles
                                              {
                                                  color: colors.text,
                                                  fontWeight: "bold",
                                              }
                                            : { color: colors.primary },
                                    ]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {item.title}
                                </Text>
                            </TouchableOpacity>
                            {!isLastItem && (
                                <FontAwesome6
                                    name="chevron-right"
                                    size={iconSize}
                                    color={colors.secondaryText}
                                    iconStyle="solid"
                                    style={styles.separator}
                                />
                            )}
                        </React.Fragment>
                    )
                })}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
        minHeight: 35,
    },
    scrollContent: {
        alignItems: "center",
        paddingHorizontal: 4,
    },
    breadcrumbItem: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 4,
    },
    breadcrumbText: {
        fontSize: 14,
    },
    separator: {
        marginHorizontal: 6,
    },
})
