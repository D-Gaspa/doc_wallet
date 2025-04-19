import React, { useState, useRef } from "react"
import {
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ScrollView,
    Animated,
    ActivityIndicator,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { Button } from "../../button"
import { Stack } from "../../layout"
import { Text } from "../../typography"
import { DocWalletLogo } from "../../../common/DocWalletLogo"
import EyeIcon from "../../assets/svg/Eye.svg"
import EyeOffIcon from "../../assets/svg/EyeOff.svg"
// Import the hook from its separate file
import { useDismissKeyboard } from "../../../../hooks/useDismissKeyboard"

type LoginScreenProps = {
    onLogin: (email: string, password: string) => Promise<void>
    onGoToRegister: () => void
    onForgotPassword?: () => void
}

export function LoginScreen({
    onLogin,
    onGoToRegister,
    onForgotPassword,
}: LoginScreenProps) {
    const { colors } = useTheme()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isPasswordVisible, setPasswordVisible] = useState(false)
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Refs for form fields and animations
    const passwordInputRef = useRef<TextInput>(null)
    const buttonScale = useRef(new Animated.Value(1)).current
    const shakeAnimation = useRef(new Animated.Value(0)).current

    // Use the dismiss keyboard hook to hide keyboard on background tap
    const dismissKeyboardProps = useDismissKeyboard()

    // Email validation
    const isEmailValid = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    // Button press animation
    const animateButtonPress = () => {
        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start()
    }

    // Error shake animation
    const shakeError = () => {
        Animated.sequence([
            Animated.timing(shakeAnimation, {
                toValue: 10,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
                toValue: -10,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
                toValue: 10,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
                toValue: 0,
                duration: 50,
                useNativeDriver: true,
            }),
        ]).start()
    }

    const handleLogin = async () => {
        // Reset error state
        setError(null)

        // Validate form
        if (!email.trim()) {
            setError("Please enter your email")
            shakeError()
            return
        }

        if (!isEmailValid(email.trim())) {
            setError("Please enter a valid email address")
            shakeError()
            return
        }

        if (!password) {
            setError("Please enter your password")
            shakeError()
            return
        }

        // Animate button
        animateButtonPress()

        try {
            // Set loading state
            setIsLoggingIn(true)

            // Try to log in
            await onLogin(email.trim(), password)

            // Clear form on success
            setEmail("")
            setPassword("")
        } catch (err) {
            // Display error message
            setError(
                err instanceof Error
                    ? err.message
                    : "Login failed. Please try again.",
            )
            shakeError()
        } finally {
            setIsLoggingIn(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.select({ ios: "padding", android: undefined })}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View {...dismissKeyboardProps}>
                    <Stack spacing={16} style={styles.inner}>
                        {/* Logo with Subtle Glow */}
                        <View style={styles.logoContainer}>
                            <View
                                style={[
                                    styles.logoShadow,
                                    {
                                        shadowColor: colors.primary,
                                        backgroundColor: colors.background,
                                    },
                                ]}
                            >
                                <DocWalletLogo
                                    size={90}
                                    primaryColor={colors.primary}
                                    secondaryColor={colors.secondary}
                                    backgroundColor={colors.background}
                                />
                            </View>
                        </View>

                        {/* Greeting */}
                        <View style={styles.greetingContainer}>
                            <Text
                                variant="md"
                                weight="bold"
                                style={[styles.title, { color: colors.text }]}
                            >
                                Welcome Back
                            </Text>
                            <Text
                                variant="sm"
                                style={[
                                    styles.subtitle,
                                    { color: colors.secondaryText },
                                ]}
                            >
                                Sign in to access your documents
                            </Text>
                        </View>

                        {/* Login Form */}
                        <Animated.View
                            style={[
                                styles.formContainer,
                                { transform: [{ translateX: shakeAnimation }] },
                            ]}
                        >
                            <Stack spacing={12}>
                                {/* Email Input */}
                                <View>
                                    <Text
                                        variant="sm"
                                        weight="medium"
                                        style={styles.inputLabel}
                                    >
                                        Email
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor:
                                                    colors.searchbar,
                                                color: colors.text,
                                                borderColor: colors.border,
                                            },
                                        ]}
                                        placeholder="Enter your email"
                                        placeholderTextColor={
                                            colors.secondaryText
                                        }
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={setEmail}
                                        returnKeyType="next"
                                        submitBehavior="submit"
                                        onSubmitEditing={() =>
                                            passwordInputRef.current?.focus()
                                        }
                                    />
                                </View>

                                {/* Password Input */}
                                <View>
                                    <Text
                                        variant="sm"
                                        weight="medium"
                                        style={styles.inputLabel}
                                    >
                                        Password
                                    </Text>
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            ref={passwordInputRef}
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor:
                                                        colors.searchbar,
                                                    color: colors.text,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                            placeholder="Enter your password"
                                            placeholderTextColor={
                                                colors.secondaryText
                                            }
                                            secureTextEntry={!isPasswordVisible}
                                            value={password}
                                            onChangeText={setPassword}
                                            returnKeyType="go"
                                            onSubmitEditing={handleLogin}
                                        />
                                        <TouchableOpacity
                                            onPress={() =>
                                                setPasswordVisible(
                                                    !isPasswordVisible,
                                                )
                                            }
                                            style={styles.eyeIconContainer}
                                            hitSlop={{
                                                top: 10,
                                                bottom: 10,
                                                left: 10,
                                                right: 10,
                                            }}
                                        >
                                            {isPasswordVisible ? (
                                                <EyeIcon
                                                    width={20}
                                                    height={20}
                                                    stroke={
                                                        colors.secondaryText
                                                    }
                                                />
                                            ) : (
                                                <EyeOffIcon
                                                    width={20}
                                                    height={20}
                                                    stroke={
                                                        colors.secondaryText
                                                    }
                                                />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Error Message */}
                                {error && (
                                    <Text
                                        variant="sm"
                                        style={[
                                            styles.errorText,
                                            { color: colors.error },
                                        ]}
                                    >
                                        {error}
                                    </Text>
                                )}

                                {/* Forgot Password */}
                                {onForgotPassword && (
                                    <View
                                        style={styles.forgotPasswordContainer}
                                    >
                                        <TouchableOpacity
                                            onPress={onForgotPassword}
                                            hitSlop={{
                                                top: 10,
                                                bottom: 10,
                                                left: 10,
                                                right: 10,
                                            }}
                                        >
                                            <Text
                                                variant="sm"
                                                style={{
                                                    color: colors.primary,
                                                }}
                                            >
                                                Forgot Password?
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </Stack>
                        </Animated.View>

                        {/* Login Button with Press Animation */}
                        <Animated.View
                            style={{
                                transform: [{ scale: buttonScale }],
                            }}
                        >
                            <Button
                                title={isLoggingIn ? "" : "Sign In"}
                                onPress={handleLogin}
                                style={styles.loginButton}
                            >
                                {isLoggingIn && (
                                    <ActivityIndicator
                                        size="small"
                                        color="#FFFFFF"
                                        style={styles.loadingIndicator}
                                    />
                                )}
                            </Button>
                        </Animated.View>

                        {/* Register Link */}
                        <View style={styles.registerContainer}>
                            <Text
                                variant="sm"
                                style={{ color: colors.secondaryText }}
                            >
                                Do not have an account?{" "}
                            </Text>
                            <TouchableOpacity
                                onPress={onGoToRegister}
                                style={styles.registerLink}
                                hitSlop={{
                                    top: 10,
                                    bottom: 10,
                                    left: 10,
                                    right: 10,
                                }}
                            >
                                <Text
                                    variant="sm"
                                    weight="bold"
                                    style={{ color: colors.primary }}
                                >
                                    Sign Up
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Stack>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
    },
    inner: {
        paddingHorizontal: 24,
        paddingVertical: 30,
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 15,
    },
    logoShadow: {
        borderRadius: 45,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 15,
        elevation: 12,
        padding: 8,
    },
    greetingContainer: {
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        textAlign: "center",
        marginBottom: 6,
        fontSize: 24,
    },
    subtitle: {
        textAlign: "center",
        marginTop: 4,
    },
    formContainer: {
        marginBottom: 8,
    },
    inputLabel: {
        marginBottom: 6,
    },
    input: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    passwordContainer: {
        position: "relative",
    },
    eyeIconContainer: {
        position: "absolute",
        right: 16,
        top: "50%",
        transform: [{ translateY: -10 }],
    },
    forgotPasswordContainer: {
        alignItems: "flex-end",
        marginTop: 8,
        marginBottom: 4,
    },
    errorText: {
        marginTop: 6,
    },
    loginButton: {
        height: 52,
        justifyContent: "center",
        alignItems: "center",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 4,
    },
    loadingIndicator: {
        position: "absolute",
    },
    registerContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
    },
    registerLink: {
        padding: 5,
    },
})
