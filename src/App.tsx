import React, { Suspense, useEffect, useState } from "react"
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
import { SafeAreaProvider } from "react-native-safe-area-context"
import { SplashScreen } from "./components/ui/screens/SplashScreen"
import { LoginScreen } from "./components/ui/screens/auth/LoginScreen"
import { RegisterScreen } from "./components/ui/screens/auth/RegisterScreen"
import { SettingsScreen } from "./components/ui/screens/settings/SettingsScreen"
import { FolderMainView } from "./components/ui/screens/folders/FolderMainView"
import { DocumentsScreen } from "./components/ui/screens/documents/DocumentsScreen"
import {
    DATABASE_NAME,
    databaseService,
} from "./services/database/databaseService.ts"
import { ProfileScreen } from "./components/ui/screens/ProfileScreen"
import { TabBar } from "./components/ui/layout/tab_bar/TabBar"
import type { FolderMainViewRef } from "./navigation"

import { useAuthStore } from "./store"
import type { IUserCredentials } from "./types/user"
import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite"

export type AuthStackParamList = {
    Login: undefined
    Register: undefined
}

export type TabParamList = {
    Home: { folderId?: string } | undefined
    Files: undefined
    Profile: undefined
    Settings: undefined
}

type RegisterData = {
    firstName: string
    lastName: string
    email: string
    password: string
    acceptedTerms: boolean
}

interface AuthScreensProps {
    handleLogin: (email: string, password: string) => Promise<void>
    handleRegister: (data: RegisterData) => Promise<void>
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const Tab = createBottomTabNavigator()

function MainTabsContent() {
    const navigation = useNavigation<NavigationProp<TabParamList>>()
    const folderMainViewRef = React.useRef<FolderMainViewRef>(null!)
    const [activeTab, setActiveTab] = useState<keyof TabParamList>("Home")

    const handleTabChange = (tab: string) => {
        const tabKey = tab as keyof TabParamList
        setActiveTab(tabKey)
        navigation.navigate(tabKey)
    }

    const navigateToTab = (
        tabKey: keyof TabParamList,
        params?: TabParamList[keyof TabParamList],
    ) => {
        setActiveTab(tabKey)
        // eslint-disable-next-line
        navigation.navigate(tabKey, params as any)
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
                    {(props) => (
                        <FolderMainView {...props} ref={folderMainViewRef} />
                    )}
                </Tab.Screen>
                <Tab.Screen name="Files" component={DocumentsScreen} />
                <Tab.Screen name="Profile">
                    {() => (
                        <ProfileScreen
                            folderMainViewRef={folderMainViewRef}
                            navigateToTab={navigateToTab}
                        />
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

function AuthScreens({ handleLogin, handleRegister }: AuthScreensProps) {
    return (
        <AuthStack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="Login"
        >
            <AuthStack.Screen name="Login">
                {(props) => (
                    <LoginScreen
                        {...props}
                        onLogin={handleLogin}
                        onGoToRegister={() =>
                            props.navigation.navigate("Register")
                        }
                    />
                )}
            </AuthStack.Screen>
            <AuthStack.Screen name="Register">
                {(props) => (
                    <RegisterScreen
                        {...props}
                        onRegister={handleRegister}
                        onGoToLogin={() => props.navigation.navigate("Login")}
                    />
                )}
            </AuthStack.Screen>
        </AuthStack.Navigator>
    )
}

function AppContent() {
    const [showSplash, setShowSplash] = useState(true)
    const {
        isAuthenticated,
        loginWithEmailPassword,
        registerUser,
        checkAuthStatus,
    } = useAuthStore()

    useEffect(() => {
        const initializeAuth = async () => {
            await checkAuthStatus()
        }
        initializeAuth()

        const splashTimer = setTimeout(() => {
            setShowSplash(false)
        }, 3000)

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
            await loginWithEmailPassword(data.email, data.password)
        } catch (error) {
            console.error("Registration or auto-login failed:", error)
        }
    }

    if (showSplash) {
        return <SplashScreen />
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? (
                <MainTabsContent />
            ) : (
                <AuthScreens
                    handleLogin={handleLogin}
                    handleRegister={handleRegister}
                />
            )}
        </NavigationContainer>
    )
}

export default function App() {
    const initializeDatabase = async (db: SQLiteDatabase) => {
        try {
            databaseService.setDatabase(db)
            await databaseService.initialize()
            console.log("Database initialized successfully!")
        } catch (error) {
            console.error("Failed to initialize database:", error)
        }
    }

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <Suspense fallback={<SplashScreen />}>
                    <SQLiteProvider
                        databaseName={DATABASE_NAME}
                        onInit={initializeDatabase}
                        useSuspense={true}
                    >
                        <TagProvider>
                            <AppContent />
                        </TagProvider>
                    </SQLiteProvider>
                </Suspense>
            </ThemeProvider>
        </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
})
