import React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MainTabParamList } from "../types/navigation.ts"
import { TAB_ROUTES } from "./routes"
import { DocumentNavigator } from "./DocumentNavigator"
import { ProfileNavigator } from "./ProfileNavigator"
import { SettingsNavigator } from "./SettingsNavigator"

// Placeholder for notification screen
const NotificationsScreen = () => null

const Tab = createBottomTabNavigator<MainTabParamList>()

export function MainNavigator() {
    return (
        <Tab.Navigator
            initialRouteName={TAB_ROUTES.DOCUMENTS}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen
                name={TAB_ROUTES.DOCUMENTS}
                component={DocumentNavigator}
                options={{
                    tabBarLabel: "Documents",
                    // We'll add icons later
                }}
            />
            <Tab.Screen
                name={TAB_ROUTES.PROFILES}
                component={ProfileNavigator}
                options={{
                    tabBarLabel: "Profiles",
                    // We'll add icons later
                }}
            />
            <Tab.Screen
                name={TAB_ROUTES.NOTIFICATIONS}
                component={NotificationsScreen}
                options={{
                    tabBarLabel: "Alerts",
                    // We'll add icons later
                }}
            />
            <Tab.Screen
                name={TAB_ROUTES.SETTINGS}
                component={SettingsNavigator}
                options={{
                    tabBarLabel: "Settings",
                    // We'll add icons later
                }}
            />
        </Tab.Navigator>
    )
}
