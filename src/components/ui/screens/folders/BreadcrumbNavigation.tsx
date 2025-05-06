import React from "react"
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import RightChevronIcon from "../../assets/svg/chevron-right.svg"

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

    const displayPath =
        path.length > 0 && path[0].id !== null
            ? [{ id: null, title: "Root" }, ...path]
            : path.length === 0
            ? [{ id: null, title: "Root" }]
            : path

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
                {displayPath.map((item, index) => (
                    <React.Fragment key={item.id ?? "root"}>
                        <TouchableOpacity
                            style={styles.breadcrumbItem}
                            onPress={() => onNavigate(item.id)}
                            disabled={index === displayPath.length - 1}
                        >
                            <Text
                                style={[
                                    styles.breadcrumbText,
                                    index === displayPath.length - 1
                                        ? // eslint-disable-next-line react-native/no-inline-styles
                                          {
                                              color: colors.text,
                                              fontWeight: "bold",
                                          }
                                        : { color: colors.primary },
                                ]}
                                numberOfLines={1}
                            >
                                {item.title}
                            </Text>
                        </TouchableOpacity>
                        {index < displayPath.length - 1 && (
                            <RightChevronIcon
                                width={12}
                                height={12}
                                stroke={colors.secondaryText}
                                style={styles.separator}
                            />
                        )}
                    </React.Fragment>
                ))}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
        marginBottom: 8,
        minHeight: 35,
    },
    scrollContent: {
        alignItems: "center",
    },
    breadcrumbItem: {
        paddingHorizontal: 4,
    },
    breadcrumbText: {
        fontSize: 14,
    },
    separator: {
        marginHorizontal: 4,
    },
})
