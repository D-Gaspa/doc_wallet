import React, { useEffect, useRef, useState } from "react"
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../../hooks/useTheme"

export interface TabBarNavigationProps {
    activeTab: string
    onTabChange: (tab: string) => void
    onTabReselect?: (tab: string) => void
    testID?: string
}

const INDICATOR_HEIGHT = 3
const ICON_SIZE = 24
const TAB_PADDING_VERTICAL = 6

const tabs = [
    { key: "Home", label: "Inicio", iconName: "house" as const },
    { key: "Files", label: "Escanear", iconName: "expand" as const }, // Could use "camera" icon
    { key: "Profile", label: "Perfil", iconName: "user" as const },
]
const tabKeys = tabs.map((t) => t.key)

export function TabBarNavigation({
    activeTab,
    onTabChange,
    onTabReselect,
    testID,
}: TabBarNavigationProps) {
    const { colors } = useTheme()
    const [containerWidth, setContainerWidth] = useState(
        Dimensions.get("window").width,
    )
    const indicatorPosition = useRef(new Animated.Value(0)).current

    const itemWidth = tabs.length > 0 ? containerWidth / tabs.length : 0

    useEffect(() => {
        const activeIndex = tabKeys.indexOf(activeTab)
        if (activeIndex !== -1 && itemWidth > 0) {
            const targetPosition = activeIndex * itemWidth
            Animated.timing(indicatorPosition, {
                toValue: targetPosition,
                duration: 250,
                useNativeDriver: true,
            }).start()
        }
    }, [activeTab, itemWidth, indicatorPosition])

    const handleTabPress = (tabKey: string) => {
        if (tabKey === activeTab && onTabReselect) {
            onTabReselect(tabKey)
        } else if (tabKey !== activeTab) {
            onTabChange(tabKey)
        }
    }

    const handleLayout = (event: {
        nativeEvent: { layout: { width: number } }
    }) => {
        const { width } = event.nativeEvent.layout
        if (width > 0 && Math.abs(width - containerWidth) > 1) {
            setContainerWidth(width)
            const activeIndex = tabKeys.indexOf(activeTab)
            if (activeIndex !== -1) {
                const newItemWidth = width / tabs.length
                indicatorPosition.setValue(activeIndex * newItemWidth)
            }
        }
    }

    return (
        <View
            style={styles.container}
            testID={testID ?? "tab-bar-navigation"}
            onLayout={handleLayout}
        >
            {/* Animated Indicator Line */}
            <Animated.View
                style={[
                    styles.indicator,
                    // eslint-disable-next-line react-native/no-inline-styles
                    {
                        width: itemWidth > 0 ? itemWidth : 0,
                        backgroundColor: colors.primary,
                        transform: [{ translateX: indicatorPosition }],
                    },
                ]}
            />

            {/* Tab Items */}
            {tabs.map(({ key, label, iconName }) => {
                const isActive = activeTab === key
                const currentIconColor = isActive
                    ? colors.primary
                    : colors.secondaryText
                const labelColor = isActive
                    ? colors.primary
                    : colors.secondaryText

                return (
                    <TouchableOpacity
                        key={key}
                        style={styles.tab}
                        onPress={() => handleTabPress(key)}
                        testID={`tab-${key.toLowerCase()}`}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                        accessibilityState={{ selected: isActive }}
                    >
                        <FontAwesome6
                            name={iconName}
                            size={ICON_SIZE}
                            color={currentIconColor}
                            iconStyle="solid"
                            style={styles.icon}
                        />
                        <Text style={[styles.label, { color: labelColor }]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        width: "100%",
        height: "100%",
        position: "relative",
    },
    indicator: {
        position: "absolute",
        top: 0,
        height: INDICATOR_HEIGHT,
    },
    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: TAB_PADDING_VERTICAL,
    },
    icon: {
        marginBottom: 2,
    },
    label: {
        fontSize: 10,
        fontWeight: "500",
        textAlign: "center",
    },
})
