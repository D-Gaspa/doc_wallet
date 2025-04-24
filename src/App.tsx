// App.tsx - Fix for useInsertionEffect error
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

import { SplashScreen } from "./components/ui/screens/SplashScreen"
import { LoginScreen } from "./components/ui/screens/auth/LoginScreen"
import { RegisterScreen } from "./components/ui/screens/auth/RegisterScreen"
import { SettingsScreen } from "./components/ui/screens/settings/SettingsScreen"
import { FolderMainView } from "./components/ui/screens/folders/FolderMainView"
import { DocumentsScreen } from "./components/ui/screens/documents/DocumentsScreen"
import { ProfileScreen } from "./components/ui/screens/ProfileScreen"
import { TabBar } from "./components/ui/layout/tab_bar/TabBar"
import { FolderMainViewRef } from "./navigation"

// Import your auth store
import { useAuthStore } from "./store"
import type { IUserCredentials } from "./types/user"

export type AuthStackParamList = {
    Login: undefined
    Register: undefined
}

export type TabParamList = {
    Home: undefined
    Files: undefined
    Profile: undefined
    Settings: undefined
}

// Define the register data type
type RegisterData = {
    firstName: string
    lastName: string
    email: string
    password: string
    acceptedTerms: boolean
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

function MainTabsContent() {
    const navigation = useNavigation<NavigationProp<TabParamList>>()
    const folderMainViewRef = React.useRef<FolderMainViewRef>(null!)
    const [activeTab, setActiveTab] = useState<keyof TabParamList>("Home")

    // Directly manage tab state without using navigation listeners
    const handleTabChange = (tab: string) => {
        const tabKey = tab as keyof TabParamList
        setActiveTab(tabKey)
        navigation.navigate(tabKey)
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
                    tabBarStyle: { display: "none" },
                }}
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
            // Check if user is already authenticated
            await checkAuthStatus()
        }

        initialize()

        // Handle splash screen separately from auth check
        const splashTimer = setTimeout(() => {
            setShowSplash(false)
        }, 3000)

        return () => clearTimeout(splashTimer)
    }, [checkAuthStatus])

    // Fix TypeScript error by explicitly returning Promise<void>
    const handleLogin = async (
        email: string,
        password: string,
    ): Promise<void> => {
        await loginWithEmailPassword(email, password)
        // Result is explicitly discarded, fulfilling the Promise<void> return type
    }

    // Fix TypeScript error by explicitly returning Promise<void>
    const handleRegister = async (data: RegisterData): Promise<void> => {
        const userData: Omit<IUserCredentials, "id" | "createdAt"> = {
            email: data.email,
            password: data.password,
            name: `${data.firstName} ${data.lastName}`,
        }

        await registerUser(userData)
        await loginWithEmailPassword(data.email, data.password)
        // Results are explicitly discarded, fulfilling the Promise<void> return type
    }

    return (
        <ThemeProvider>
            {showSplash ? (
                // Remove the onFinish prop to prevent React scheduling issues
                <SplashScreen duration={3000} />
            ) : (
                <TagProvider>
                    <NavigationContainer>
                        {isAuthenticated ? (
                            // After logging in, go to your tabs
                            <MainTabsContent />
                        ) : (
                            // Otherwise show the auth stack
                            <AuthStack.Navigator
                                screenOptions={{ headerShown: false }}
                                initialRouteName="Login"
                            >
                                <AuthStack.Screen name="Login">
                                    {({ navigation }) => (
                                        <LoginScreen
                                            onLogin={handleLogin}
                                            onGoToRegister={() =>
                                                navigation.navigate("Register")
                                            }
                                        />
                                    )}
                                </AuthStack.Screen>

                                <AuthStack.Screen name="Register">
                                    {({ navigation }) => (
                                        <RegisterScreen
                                            onRegister={handleRegister}
                                            onGoToLogin={() =>
                                                navigation.navigate("Login")
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
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
})
