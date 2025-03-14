import React from "react"
import { View, StyleSheet } from "react-native" //TouchableOpacity
import { useThemeContext } from "../../../../context/ThemeContext.tsx"
import { TabBarNavigation } from "./TabBarNavigation.tsx"

export interface TabbarProps {
    activeTab: string
    onTabChange: (tab: string) => void
    onAddPress?: () => void
    testID?: string
}

export function TabBar({ activeTab, onTabChange, testID }: TabbarProps) {
    const { colors } = useThemeContext()

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.secondary,
                    shadowColor: colors.shadow,
                },
            ]}
            testID={testID ?? "tabbar-root"}
        >
            {/* Bottom Navigation Tabs */}
            <TabBarNavigation activeTab={activeTab} onTabChange={onTabChange} />
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
