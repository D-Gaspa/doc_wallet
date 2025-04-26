import React from "react"
import { StyleSheet, View } from "react-native"
import { useTheme } from "../../../../hooks/useTheme.ts"
import { TabBarNavigation } from "./TabBarNavigation.tsx"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export interface TabBarProps {
    activeTab: string
    onTabChange: (tab: string) => void
    onTabReselect?: (tab: string) => void
    onAddPress?: () => void
    testID?: string
}

const TAB_BAR_CONTENT_HEIGHT = 60

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
                    height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
                    paddingBottom: insets.bottom,
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
    },
})
