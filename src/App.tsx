import React, { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { ThemeProvider } from "./context/ThemeContext.tsx"
import {
    NavigationContainer,
    NavigationProp,
    useNavigation,
    useNavigationState,
} from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useTheme } from "./hooks/useTheme.ts"
import { FolderMainView } from "./components/ui/screens/folders/FolderMainView.tsx"
import { TabBar } from "./components/ui/layout/tab_bar/TabBar.tsx"
import { Button } from "./components/ui/button"
import { Toast } from "./components/ui/feedback"

const Tab = createBottomTabNavigator()

// Placeholder Components for "Files" and "Profile"
const FilesScreen = () => (
    <View style={styles.screenContainer}>
        <Text style={styles.text}>Files Screen (Coming Soon)</Text>
    </View>
)

// Define the types for navigation
type TabParamList = {
    Home: undefined
    Files: undefined
    Profile: undefined
}
const ProfileScreen: React.FC = () => {
    const { colors, toggleTheme } = useTheme()
    const [toastVisible, setToastVisible] = useState<boolean>(false)

    // Handler for toggling theme
    const handleToggleTheme = () => {
        toggleTheme()
        setToastVisible(true)
    }

    return (
        <View
            style={[
                styles.screenContainer,
                { backgroundColor: colors.background },
            ]}
        >
            <Text>Profile</Text>

            {/* Theme toggle button */}
            <Button
                title="Toggle Theme"
                onPress={handleToggleTheme}
                testID="toggle-theme-button"
            />
            {toastVisible && (
                <Toast
                    message="Theme updated successfully"
                    visible={toastVisible}
                    onDismiss={() => setToastVisible(false)}
                />
            )}
        </View>
    )
}

// Wrapper component for the tab navigator
function MainTabsContent() {
    // Use the properly typed navigation
    const navigation = useNavigation<NavigationProp<TabParamList>>()

    // Debug the navigation state structure
    const currentRouteName = useNavigationState((state) => {
        console.log("Navigation State:", JSON.stringify(state, null, 2))

        // With nested navigators, we need to check if this is a tab navigator
        // The structure might be different from expected
        if (state?.routes?.[0]?.state?.routes) {
            // This is likely a case of nested navigators (Stack containing Tabs)
            const tabState = state.routes[0].state
            const tabRoutes = tabState.routes || []
            const tabIndex = tabState.index ?? 0
            return (tabRoutes[tabIndex]?.name as keyof TabParamList) || "Home"
        } else {
            // Direct tab navigation
            const routes = state?.routes || []
            const index = state?.index ?? 0
            return (routes[index]?.name as keyof TabParamList) || "Home"
        }
    })

    // This function tells React Navigation to navigate to the selected tab
    const handleTabChange = (tab: string) => {
        // Case sensitivity matters in React Navigation - make sure we're using
        // the exact screen names as registered in the Tab.Navigator
        const screenMapping: Record<string, keyof TabParamList> = {
            Home: "Home",
            Files: "Files",
            Profile: "Profile",
        }

        const screenName = screenMapping[tab]
        if (screenName) {
            navigation.navigate(screenName)
        }
    }

    return (
        <View style={styles.container}>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: { display: "none" },
                }}
            >
                <Tab.Screen name="Home" component={FolderMainView} />
                <Tab.Screen name="Files" component={FilesScreen} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>

            {/* Custom TabBar at the Bottom */}
            <TabBar
                activeTab={currentRouteName}
                onTabChange={handleTabChange}
            />
        </View>
    )
}

export default function App() {
    return (
        <ThemeProvider>
            <NavigationContainer>
                {/* Use a direct Tab Navigator instead of nesting it in a Stack */}
                <MainTabsContent />
            </NavigationContainer>
        </ThemeProvider>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    screenContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        fontSize: 18,
        fontWeight: "bold",
    },
})
