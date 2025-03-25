import React from "react"
import { View, TouchableOpacity } from "react-native"
import { useTheme } from "../../../../hooks/useTheme.ts"
import { StyleSheet } from "react-native"

// Import icons
import HomeIcon from "../../assets/svg/Home.svg"
import ProfileIcon from "../../assets/svg/Profile.svg"
import AddFileIcon from "../../assets/svg/add-file-icon.svg"

export interface TabbarNavigationProps {
    activeTab: string
    onTabChange: (tab: string) => void
    testID?: string
}

const tabs = [
    { tab: "Home", icon: HomeIcon, useFill: false },
    { tab: "Files", icon: AddFileIcon, useFill: true },
    { tab: "Profile", icon: ProfileIcon, useFill: false },
]

export function TabBarNavigation({
    activeTab,
    onTabChange,
    testID,
}: TabbarNavigationProps) {
    const { colors } = useTheme()

    return (
        <View style={styles.container} testID={testID ?? "tabbar-navigation"}>
            {tabs.map(({ tab, icon: Icon, useFill }) => {
                const isActive = activeTab === tab

                const strokeColor = isActive
                    ? colors.tabbarIcon_active
                    : colors.tabbarIcon_inactive

                // Console log the stroke colors of each tab
                console.log(`Tab: ${tab}, Stroke Color: ${strokeColor}`)

                return (
                    <TouchableOpacity
                        key={tab}
                        style={styles.tab}
                        onPress={() => onTabChange(tab)}
                        testID={`tab-${tab.toLowerCase()}`}
                    >
                        {/* Active Circle Indicator */}
                        {isActive && (
                            <View
                                style={[
                                    styles.activeCircle,
                                    { backgroundColor: colors.primary },
                                ]}
                            />
                        )}

                        {/* Icon */}
                        <Icon
                            width={28}
                            height={28}
                            stroke={!useFill ? strokeColor : "none"} // Use stroke for non-filled icons
                            fill={useFill ? strokeColor : "none"} //
                            style={styles.icon}
                        />
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        width: "100%",
    },
    tab: {
        alignItems: "center",
        justifyContent: "center",
        width: 60,
        height: 60,
        position: "relative",
    },
    activeCircle: {
        position: "absolute",
        width: 60,
        height: 60,
        borderRadius: 30,
        zIndex: -1,
    },
    icon: {
        zIndex: 1,
    },
})
