import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { RootStackParamList } from "./types"
import { ROOT_ROUTES } from "./routes"
import { AuthNavigator } from "./AuthNavigator"
import { MainNavigator } from "./MainNavigator"
import { useNavigationPersistence } from "./persistence"
import { linking } from "./linking"
import { navigationRef } from "./index"
import { Text } from "react-native"
// import { useColorScheme } from "react-native"
// import { DarkTheme, LightTheme } from "theme_modules"

// Placeholder loading screen
export function LoadingScreen() {
    return <Text testID="loading-screen">Loading...</Text>
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
    const { isReady, initialState, onStateChange } = useNavigationPersistence()

    // In the future, we should use the user's color scheme preference
    // const colorScheme = useColorScheme()
    // const theme = colorScheme === "dark" ? DarkTheme : LightTheme

    if (!isReady) {
        // Return a loading screen or null until navigation state is restored
        return null
    }

    return (
        <NavigationContainer
            ref={navigationRef}
            initialState={initialState}
            onStateChange={onStateChange}
            linking={linking}
            // theme={theme}
        >
            <Stack.Navigator
                initialRouteName={ROOT_ROUTES.LOADING}
                screenOptions={{
                    headerShown: false,
                    gestureEnabled: false,
                }}
            >
                <Stack.Screen
                    name={ROOT_ROUTES.LOADING}
                    component={LoadingScreen}
                />
                <Stack.Screen
                    name={ROOT_ROUTES.AUTH}
                    component={AuthNavigator}
                />
                <Stack.Screen
                    name={ROOT_ROUTES.MAIN}
                    component={MainNavigator}
                />
            </Stack.Navigator>
        </NavigationContainer>
    )
}
