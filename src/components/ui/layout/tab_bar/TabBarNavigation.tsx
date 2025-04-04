import React from "react"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import { useTheme } from "../../../../hooks/useTheme.ts"

import HomeIcon from "../../assets/svg/Home.svg"
import ProfileIcon from "../../assets/svg/Profile.svg"
import AddFileIcon from "../../assets/svg/add-file-icon.svg"

export interface TabBarNavigationProps {
    activeTab: string
    onTabChange: (tab: string) => void
    onTabReselect?: (tab: string) => void
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
    onTabReselect,
    testID,
}: TabBarNavigationProps) {
    const { colors } = useTheme()

    // Handle tab press with reselection detection
    const handleTabPress = (tab: string) => {
        if (tab === activeTab && onTabReselect) {
            // If we're already on this tab and have a reselect handler
            onTabReselect(tab)
        } else {
            // Normal tab change
            onTabChange(tab)
        }
    }

    return (
        <View style={styles.container} testID={testID ?? "tab-bar-navigation"}>
            {tabs.map(({ tab, icon: Icon, useFill }) => {
                const isActive = activeTab === tab

                const strokeColor = isActive
                    ? colors.tabbarIcon_active
                    : colors.tabbarIcon_inactive

                console.log(`Tab: ${tab}, Stroke Color: ${strokeColor}`)

                return (
                    <TouchableOpacity
                        key={tab}
                        style={styles.tab}
                        onPress={() => handleTabPress(tab)}
                        testID={`tab-${tab.toLowerCase()}`}
                    >
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
                            stroke={!useFill ? strokeColor : "none"}
                            fill={useFill ? strokeColor : "none"}
                            style={styles.icon}
                        />
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}

// Styles remain the same

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
