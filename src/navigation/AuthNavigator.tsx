import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { AuthStackParamList } from "./types"
import { AUTH_ROUTES } from "./routes"
import { Text } from "react-native"

// Import screen placeholders - these will be implemented later
const LoginScreen = () => <Text testID="login-screen">Login Screen</Text>
const RegisterScreen = () => null
const ForgotPasswordScreen = () => null
const PinSetupScreen = () => null
const BiometricSetupScreen = () => null

const Stack = createNativeStackNavigator<AuthStackParamList>()

export function AuthNavigator() {
    return (
        <Stack.Navigator
            initialRouteName={AUTH_ROUTES.LOGIN}
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen name={AUTH_ROUTES.LOGIN} component={LoginScreen} />
            <Stack.Screen
                name={AUTH_ROUTES.REGISTER}
                component={RegisterScreen}
            />
            <Stack.Screen
                name={AUTH_ROUTES.FORGOT_PASSWORD}
                component={ForgotPasswordScreen}
            />
            <Stack.Screen
                name={AUTH_ROUTES.PIN_SETUP}
                component={PinSetupScreen}
            />
            <Stack.Screen
                name={AUTH_ROUTES.BIOMETRIC_SETUP}
                component={BiometricSetupScreen}
            />
        </Stack.Navigator>
    )
}
