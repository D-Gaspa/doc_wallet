import React from "react"
import { StyleSheet, View } from "react-native"
import { useTheme } from "../../../../hooks/useTheme.ts"
import { TabBarNavigation } from "./TabBarNavigation.tsx"

export interface TabBarProps {
    activeTab: string
    onTabChange: (tab: string) => void
    onTabReselect?: (tab: string) => void
    onAddPress?: () => void
    testID?: string
}

export function TabBar({
    activeTab,
    onTabChange,
    onTabReselect,
    testID,
}: TabBarProps) {
    const { colors } = useTheme()

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.secondary,
                    shadowColor: colors.shadow,
                },
            ]}
            testID={testID ?? "tabBar-root"}
        >
            {/* Bottom Navigation Tabs */}
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
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 34,
        height: 68,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 5,
        elevation: 5,
    },
})
