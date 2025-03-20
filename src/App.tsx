import React, { useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import { ThemeProvider } from "./context/ThemeContext.tsx"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"

import { FolderMainView } from "./components/ui/screens/folders/FolderMainView.tsx"
import { TabBar } from "./components/ui/layout/tab_bar/TabBar.tsx"

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

// Placeholder Components for "Files" and "Profile"
const FilesScreen = () => (
    <View style={styles.screenContainer}>
        <Text style={styles.text}>Files Screen (Coming Soon)</Text>
    </View>
)

const ProfileScreen = () => (
    <View style={styles.screenContainer}>
        <Text style={styles.text}>Profile Screen (Coming Soon)</Text>
    </View>
)

// Main Tab Navigation
function MainTabs() {
    const [activeTab, setActiveTab] = useState("Home")

    return (
        <>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: { display: "none" },
                }} // Hide default TabBar
                initialRouteName="Home"
            >
                <Tab.Screen name="Home" component={FolderMainView} />
                <Tab.Screen name="Files" component={FilesScreen} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>

            {/* Custom TabBar at the Bottom */}
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </>
    )
}

export default function App() {
    return (
        <ThemeProvider>
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="MainTabs" component={MainTabs} />
                </Stack.Navigator>
            </NavigationContainer>
        </ThemeProvider>
    )
}

const styles = StyleSheet.create({
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
