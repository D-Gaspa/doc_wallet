import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { SettingsStackParamList } from "../types/navigation.ts"
import { SETTINGS_ROUTES } from "./routes"

// Import screen placeholders - these will be implemented later
const SettingsHomeScreen = () => null
const NotificationSettingsScreen = () => null
const SecuritySettingsScreen = () => null
const AboutScreen = () => null

const Stack = createNativeStackNavigator<SettingsStackParamList>()

export function SettingsNavigator() {
    return (
        <Stack.Navigator
            initialRouteName={SETTINGS_ROUTES.SETTINGS_HOME}
            screenOptions={{
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen
                name={SETTINGS_ROUTES.SETTINGS_HOME}
                component={SettingsHomeScreen}
                options={{ title: "Settings" }}
            />
            <Stack.Screen
                name={SETTINGS_ROUTES.NOTIFICATION_SETTINGS}
                component={NotificationSettingsScreen}
                options={{ title: "Notifications" }}
            />
            <Stack.Screen
                name={SETTINGS_ROUTES.SECURITY_SETTINGS}
                component={SecuritySettingsScreen}
                options={{ title: "Security" }}
            />
            <Stack.Screen
                name={SETTINGS_ROUTES.ABOUT}
                component={AboutScreen}
                options={{ title: "About" }}
            />
        </Stack.Navigator>
    )
}
