import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { ProfileStackParamList } from "../types/navigation.ts"
import { PROFILE_ROUTES } from "./routes"

// Import screen placeholders - these will be implemented later
const ProfilesScreen = () => null
const ProfileDetailsScreen = () => null
const AddProfileScreen = () => null
const EditProfileScreen = () => null

const Stack = createNativeStackNavigator<ProfileStackParamList>()

export function ProfileNavigator() {
    return (
        <Stack.Navigator
            initialRouteName={PROFILE_ROUTES.PROFILES}
            screenOptions={{
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen
                name={PROFILE_ROUTES.PROFILES}
                component={ProfilesScreen}
                options={{ title: "Profiles" }}
            />
            <Stack.Screen
                name={PROFILE_ROUTES.PROFILE_DETAILS}
                component={ProfileDetailsScreen}
                options={{ title: "Profile Details" }}
            />
            <Stack.Screen
                name={PROFILE_ROUTES.ADD_PROFILE}
                component={AddProfileScreen}
                options={{ title: "Add Profile" }}
            />
            <Stack.Screen
                name={PROFILE_ROUTES.EDIT_PROFILE}
                component={EditProfileScreen}
                options={{ title: "Edit Profile" }}
            />
        </Stack.Navigator>
    )
}
