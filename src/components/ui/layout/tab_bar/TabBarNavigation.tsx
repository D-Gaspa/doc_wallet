import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, TouchableOpacity, View, Text, Animated, Dimensions } from "react-native";
import { useTheme } from "../../../../hooks/useTheme.ts"; // Adjust path

// Import icons
import HouseIcon from "../../assets/svg/Home.svg"; // Ensure path is correct
import ProfileIcon from "../../assets/svg/Profile.svg"; // Ensure path is correct
import AddFileIcon from "../../assets/svg/add-file-icon.svg"; // Ensure path is correct

export interface TabBarNavigationProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onTabReselect?: (tab: string) => void;
    testID?: string;
}

// --- Constants ---
export const INDICATOR_HEIGHT = 3;
const ICON_SIZE = 32;
const TAB_PADDING_TOP = 6 + INDICATOR_HEIGHT;
const TAB_PADDING_BOTTOM = 4;

// Updated tabs array
const tabs = [
    { key: "Home", label: "Home", icon: HouseIcon },
    { key: "Files", label: "Files", icon: AddFileIcon },
    { key: "Profile", label: "Profile", icon: ProfileIcon },
];
const tabKeys = tabs.map(t => t.key);

export function TabBarNavigation({
                                     activeTab,
                                     onTabChange,
                                     onTabReselect,
                                     testID,
                                 }: TabBarNavigationProps) {
    const { colors } = useTheme();
    const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);
    const indicatorPosition = useRef(new Animated.Value(0)).current;
    const itemWidth = tabs.length > 0 ? containerWidth / tabs.length : 0;

    // Effect for initial position
    useEffect(() => {
        const initialActiveIndex = tabKeys.indexOf(activeTab);
        // Calculate initial position carefully, handle itemWidth possibly being 0 initially
        const calculatedItemWidth = Dimensions.get('window').width / tabs.length;
        const initialPosition = initialActiveIndex >= 0 && calculatedItemWidth > 0
            ? initialActiveIndex * calculatedItemWidth
            : 0;
        indicatorPosition.setValue(initialPosition);
        // Removed eslint-disable-next-line: The empty array is correct for setting initial state on mount.
        // If ESLint setup finds the rule later, it might complain, but the logic is standard.
    }, []); // Run only once on mount

    // Effect for animating position changes
    useEffect(() => {
        const activeIndex = tabKeys.indexOf(activeTab);
        // Only animate if itemWidth is calculated and valid
        if (activeIndex !== -1 && itemWidth > 0) {
            const targetPosition = activeIndex * itemWidth;
            Animated.timing(indicatorPosition, {
                toValue: targetPosition,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
        // Dependencies are correct: animation depends on activeTab and itemWidth
    }, [activeTab, itemWidth, indicatorPosition]);

    const handleTabPress = (tabKey: string) => {
        if (tabKey === activeTab && onTabReselect) {
            onTabReselect(tabKey);
        } else if (tabKey !== activeTab) {
            onTabChange(tabKey);
        }
    };

    const handleLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
        const { width } = event.nativeEvent.layout;
        if (width > 0 && Math.abs(width - containerWidth) > 1) {
            setContainerWidth(width);
            const activeIndex = tabKeys.indexOf(activeTab);
            if (activeIndex !== -1) {
                const newItemWidth = width / tabs.length;
                indicatorPosition.setValue(activeIndex * newItemWidth);
            }
        }
    };

    return (
        <View
            style={styles.container}
            testID={testID ?? "tab-bar-navigation"}
            onLayout={handleLayout}
        >
            {/* Animated Indicator */}
            <Animated.View
                style={[
                    styles.indicator, // Base styles from StyleSheet
                    // eslint-disable-next-line react-native/no-inline-styles
                    { // Inline styles ONLY for dynamic/animated properties
                        width: itemWidth > 0 ? itemWidth : 0, // Dynamic width
                        backgroundColor: colors.primary, // Moved to styles.indicator initially, but needs theme color
                        transform: [{ translateX: indicatorPosition }], // Animated transform
                    },
                    // Note: Moving backgroundColor to StyleSheet might require passing theme colors differently
                    // Keeping it inline might be necessary if theme context isn't easily available in StyleSheet.create
                    // Let's keep it inline for now as it depends on `colors` from the hook.
                    // If your setup allows passing theme to StyleSheet, you can move backgroundColor there.
                ]}
            />

            {/* Tab Items */}
            {tabs.map(({ key, label, icon: Icon }) => {
                const isActive = activeTab === key;
                const currentIconColor = isActive ? colors.primary : colors.text;
                const labelColor = isActive ? colors.primary : colors.secondaryText;

                return (
                    <TouchableOpacity
                        key={key}
                        style={styles.tab}
                        onPress={() => handleTabPress(key)}
                        testID={`tab-${key.toLowerCase()}`}
                        activeOpacity={0.7}
                    >
                        <Icon
                            width={ICON_SIZE}
                            height={ICON_SIZE}
                            color={currentIconColor}
                            style={styles.icon}
                        />
                        <Text style={[styles.label, { color: labelColor }]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        width: "100%",
        height: '100%',
        position: 'relative',
    },
    indicator: { // Base styles for the indicator
        position: 'absolute',
        top: 0,
        height: INDICATOR_HEIGHT,
        // backgroundColor can be set here if theme is passed or defined statically
    },
    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: TAB_PADDING_TOP,
        paddingBottom: TAB_PADDING_BOTTOM,
    },
    icon: {
        marginBottom: 2,
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
});
