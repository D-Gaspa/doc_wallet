import React from "react"
import { StyleSheet, View } from "react-native"
import { useTheme } from "../../../../hooks/useTheme.ts" // Adjust path if needed
import { TabBarNavigation } from "./TabBarNavigation.tsx" // Import INDICATOR_HEIGHT
import { useSafeAreaInsets } from "react-native-safe-area-context"

export interface TabBarProps {
    activeTab: string
    onTabChange: (tab: string) => void
    onTabReselect?: (tab: string) => void
    onAddPress?: () => void
    testID?: string
}

// Define a base height for the content area (icon + label + padding)
const TAB_BAR_CONTENT_HEIGHT = 60 // Adjust if needed based on icon/label size

export function TabBar({
    activeTab,
    onTabChange,
    onTabReselect,
    testID,
}: TabBarProps) {
    const { colors } = useTheme()
    const insets = useSafeAreaInsets()

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.background,
                    borderTopColor: colors.border,
                    // Calculate total height: content + safe area bottom
                    height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
                    paddingBottom: insets.bottom, // Apply safe area padding
                },
            ]}
            testID={testID ?? "tabBar-root"}
        >
            <TabBarNavigation
                activeTab={activeTab}
                onTabChange={onTabChange}
                onTabReselect={onTabReselect}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        width: "100%",
        borderTopWidth: StyleSheet.hairlineWidth,
        // Height and paddingBottom are set dynamically above
    },
})
