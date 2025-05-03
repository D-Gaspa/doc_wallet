import React, { useEffect, useState } from "react"
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
import { ProfileScreen } from "./components/ui/screens/ProfileScreen"
import { TabBar } from "./components/ui/layout/tab_bar/TabBar"
import type { FolderMainViewRef } from "./navigation"
import { useAuthStore } from "./store"
import type { IUserCredentials } from "./types/user"
import * as Notifications from "expo-notifications"
import { useNotificationStore } from "./store/useNotificationStore.ts"
import { generateUniqueId } from "./utils"
import { NotificationsInboxScreen } from "./components/ui/screens/NotificationsInboxScreen"

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
})

export type AuthStackParamList = {
    Login: undefined
    Register: undefined
}

export type TabParamList = {
    Home: { folderId?: string } | undefined
    Files: undefined
    Profile: undefined
    Settings: undefined
    Notifications: undefined
}

type RegisterData = {
    firstName: string
    lastName: string
    email: string
    password: string
    acceptedTerms: boolean
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
                <Tab.Screen
                    name="Notifications"
                    component={NotificationsInboxScreen}
                />
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

    // Ask to allow notifications
    useEffect(() => {
        ;(async () => {
            const { status: existingStatus } =
                await Notifications.getPermissionsAsync()
            let finalStatus = existingStatus
            if (existingStatus !== "granted") {
                const { status } = await Notifications.requestPermissionsAsync()
                finalStatus = status
            }

            if (finalStatus !== "granted") {
                console.warn("Push notifications not granted")
                return
            }

            const token = (await Notifications.getExpoPushTokenAsync()).data
            console.log("Expo Push Token:", token)
            // Optionally store this on your backend if you send notifications server-side
        })()
    }, [])

    useEffect(() => {
        const subscription = Notifications.addNotificationReceivedListener(
            (notification) => {
                const { title, body } = notification.request.content

                useNotificationStore.getState().logNotification({
                    id: generateUniqueId(),
                    title: title ?? "Notification",
                    body: body ?? "",
                    sentAt: new Date().toISOString(),
                })
            },
        )

        return () => subscription.remove()
    }, [])

    // Check auth status when app loads
    useEffect(() => {
        const initialize = async () => {
            await checkAuthStatus()
        }
        initialize().then((r) => r)

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
        <SafeAreaProvider>
            <ThemeProvider>
                {showSplash ? (
                    <SplashScreen />
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
                                                {...props}
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
