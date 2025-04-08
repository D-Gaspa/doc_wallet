import React from "react"
import { StyleSheet, View } from "react-native"
import { ThemeProvider } from "./context/ThemeContext.tsx"
import {
    NavigationContainer,
    NavigationProp,
    useNavigation,
    useNavigationState,
} from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { FolderMainView } from "./components/ui/screens/folders/FolderMainView.tsx"
import { TabBar } from "./components/ui/layout/tab_bar/TabBar.tsx"
import { TagProvider } from "./components/ui/tag_functionality/TagContext.tsx"
import { DocumentsScreen } from "./components/ui/screens/documents/DocumentsScreen.tsx"
import { ProfileScreen } from "./components/ui/screens/ProfileScreen.tsx"

const Tab = createBottomTabNavigator()

// Placeholder Components for "Files" and "Profile"
/*
const DocumentsScreen = () => (
    <View style={styles.screenContainer}>
        <Text style={styles.text}>Files Screen (Coming Soon)</Text>
    </View>
)
*/

// Define the types for navigation
type TabParamList = {
    Home: undefined
    Files: undefined
    Profile: undefined
}

function MainTabsContent() {
    const navigation = useNavigation<NavigationProp<TabParamList>>()

    const folderMainViewRef = React.useRef<{
        resetToRootFolder: () => void
    } | null>(null)

    const handleTabReselect = (tab: string) => {
        if (tab === "Home" && folderMainViewRef.current) {
            // If Home tab is reselected, reset to root folder
            folderMainViewRef.current.resetToRootFolder()
        }
    }

    const currentRouteName = useNavigationState((state) => {
        console.log("Navigation State:", JSON.stringify(state, null, 2))

        // With nested navigators, we need to check if this is a tab navigator
        if (state?.routes?.[0]?.state?.routes) {
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
                <Tab.Screen name="Home">
                    {() => <FolderMainView ref={folderMainViewRef} />}
                </Tab.Screen>
                <Tab.Screen name="Files" component={DocumentsScreen} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>

            <TabBar
                activeTab={currentRouteName}
                onTabChange={handleTabChange}
                onTabReselect={handleTabReselect}
            />
        </View>
    )
}

export default function App() {
    return (
        <ThemeProvider>
            <TagProvider>
                <NavigationContainer>
                    <MainTabsContent />
                </NavigationContainer>
            </TagProvider>
        </ThemeProvider>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})
