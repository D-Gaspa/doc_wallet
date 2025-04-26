// App.tsx - Fix for useInsertionEffect error and SafeAreaProvider
import React, { useState, useEffect } from "react"
import { StyleSheet, View } from "react-native"
import { ThemeProvider } from "./context/ThemeContext"
import { TagProvider } from "./components/ui/tag_functionality/TagContext"
import {
    NavigationContainer,
    NavigationProp,
    useNavigation,
} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"

// ---> Import SafeAreaProvider <---
import { SafeAreaProvider } from "react-native-safe-area-context"

import { SplashScreen } from "./components/ui/screens/SplashScreen"
import { LoginScreen } from "./components/ui/screens/auth/LoginScreen"
import { RegisterScreen } from "./components/ui/screens/auth/RegisterScreen"
import { SettingsScreen } from "./components/ui/screens/settings/SettingsScreen"
import { FolderMainView } from "./components/ui/screens/folders/FolderMainView"
import { DocumentsScreen } from "./components/ui/screens/documents/DocumentsScreen"
import { ProfileScreen } from "./components/ui/screens/ProfileScreen"
import { TabBar } from "./components/ui/layout/tab_bar/TabBar"
// Assuming this type exists or is defined elsewhere
import type { FolderMainViewRef } from "./navigation"

// Import your auth store and types
import { useAuthStore } from "./store"
import type { IUserCredentials } from "./types/user"

// Define Param Lists
export type AuthStackParamList = {
    Login: undefined
    Register: undefined
}

export type TabParamList = {
    Home: { folderId?: string } | undefined // <-- Add parameter type here
    Files: undefined
    Profile: undefined
    Settings: undefined
}

// Define the register data type if not imported
type RegisterData = {
    firstName: string
    lastName: string
    email: string
    password: string
    acceptedTerms: boolean
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const Tab = createBottomTabNavigator()

// MainTabsContent component remains the same as you provided
function MainTabsContent() {
    const navigation = useNavigation<NavigationProp<TabParamList>>()
    const folderMainViewRef = React.useRef<FolderMainViewRef>(null!)
    // Use navigation state for active tab if preferred, or manage locally
    // For simplicity, let's use local state as in your provided code
    const [activeTab, setActiveTab] = useState<keyof TabParamList>("Home")

    // Using navigation state listener might be more robust
    // React.useEffect(() => {
    //     const unsubscribe = navigation.addListener('state', (e) => {
    //         const currentRoute = e.data.state?.routes[e.data.state?.index || 0];
    //         if (currentRoute) {
    //            setActiveTab(currentRoute.name as keyof TabParamList);
    //         }
    //     });
    //     return unsubscribe;
    // }, [navigation]);

    const handleTabChange = (tab: string) => {
        const tabKey = tab as keyof TabParamList
        setActiveTab(tabKey) // Update local state
        navigation.navigate(tabKey) // Navigate
    }

    const handleTabReselect = (tab: string) => {
        if (tab === "Home" && folderMainViewRef.current) {
            folderMainViewRef.current.resetToRootFolder()
        }
    }

    return (
        <View style={styles.container}>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: { display: "none" }, // Hide default tab bar
                }}
                // tabBar={() => null} // Alternative way to hide default tab bar
            >
                <Tab.Screen name="Home">
                    {() => <FolderMainView ref={folderMainViewRef} />}
                </Tab.Screen>
                <Tab.Screen name="Files" component={DocumentsScreen} />
                <Tab.Screen name="Profile">
                    {() => (
                        <ProfileScreen folderMainViewRef={folderMainViewRef} />
                    )}
                </Tab.Screen>
                <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>

            {/* Your custom TabBar */}
            <TabBar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onTabReselect={handleTabReselect}
            />
        </View>
    )
}

export default function App() {
    const [showSplash, setShowSplash] = useState(true)
    const {
        isAuthenticated,
        loginWithEmailPassword,
        registerUser,
        checkAuthStatus,
    } = useAuthStore()

    // Check auth status when app loads
    useEffect(() => {
        const initialize = async () => {
            await checkAuthStatus()
        }
        initialize()

        const splashTimer = setTimeout(() => {
            setShowSplash(false)
        }, 3000) // Show splash for 3 seconds

        return () => clearTimeout(splashTimer)
    }, [checkAuthStatus])

    const handleLogin = async (
        email: string,
        password: string,
    ): Promise<void> => {
        try {
            await loginWithEmailPassword(email, password)
        } catch (error) {
            console.error("Login failed:", error)
            // Handle login error feedback to the user if needed
        }
    }

    const handleRegister = async (data: RegisterData): Promise<void> => {
        const userData: Omit<IUserCredentials, "id" | "createdAt"> = {
            email: data.email,
            password: data.password,
            name: `${data.firstName} ${data.lastName}`,
        }
        try {
            await registerUser(userData)
            // Automatically log in after successful registration
            await loginWithEmailPassword(data.email, data.password)
        } catch (error) {
            console.error("Registration or auto-login failed:", error)
            // Handle registration error feedback
        }
    }

    return (
        // ---> Wrap the entire app with SafeAreaProvider <---
        <SafeAreaProvider>
            <ThemeProvider>
                {showSplash ? (
                    <SplashScreen /> // Removed duration prop if handled internally or by timer
                ) : (
                    <TagProvider>
                        <NavigationContainer>
                            {isAuthenticated ? (
                                <MainTabsContent />
                            ) : (
                                <AuthStack.Navigator
                                    screenOptions={{ headerShown: false }}
                                    initialRouteName="Login"
                                >
                                    <AuthStack.Screen name="Login">
                                        {/* Use component prop for simplicity unless complex props needed */}
                                        {(props) => (
                                            <LoginScreen
                                                {...props} // Pass navigation props
                                                onLogin={handleLogin}
                                                onGoToRegister={() =>
                                                    // eslint-disable-next-line react/prop-types
                                                    props.navigation.navigate(
                                                        "Register",
                                                    )
                                                }
                                            />
                                        )}
                                    </AuthStack.Screen>
                                    <AuthStack.Screen name="Register">
                                        {(props) => (
                                            <RegisterScreen
                                                {...props} // Pass navigation props
                                                onRegister={handleRegister}
                                                onGoToLogin={() =>
                                                    // eslint-disable-next-line react/prop-types
                                                    props.navigation.navigate(
                                                        "Login",
                                                    )
                                                }
                                            />
                                        )}
                                    </AuthStack.Screen>
                                </AuthStack.Navigator>
                            )}
                        </NavigationContainer>
                    </TagProvider>
                )}
            </ThemeProvider>
        </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
})
