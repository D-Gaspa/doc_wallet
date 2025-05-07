//components/ui/screens/auth/LoginScreen.tsx

import React, { useState, useRef, useEffect } from "react"
import {
    View,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ScrollView,
    Animated,
    ActivityIndicator,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme" // Adjust path
import { Button } from "../../button" // Adjust path
import { Stack, Spacer, Row } from "../../layout" // ---> Import Row <---
import { Text } from "../../typography" // Adjust path
import { TextField } from "../../form" // Import TextField
import { DocWalletLogo } from "../../../common/DocWalletLogo" // Adjust path
import EyeIcon from "../../assets/svg/Eye.svg" // Adjust path
import EyeOffIcon from "../../assets/svg/EyeOff.svg" // Adjust path
import { useDismissKeyboard } from "../../../../hooks/useDismissKeyboard"
import { IUser } from "../../../../types/user.ts"

type LoginScreenProps = {
    onLogin: (
        email: string | undefined,
        password: string | undefined,
        useBiometrics?: boolean,
    ) => Promise<IUser | null | void>
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

    // Refs and Animations
    // const passwordInputRef = useRef<typeof TextField>(null); // ---> Cannot use ref if TextField doesn't support forwardRef
    const buttonScale = useRef(new Animated.Value(1)).current
    const shakeAnimation = useRef(new Animated.Value(0)).current
    const [showEmailPasswordForm, setShowEmailPasswordForm] = useState(false) // New state to control form visibility

    useEffect(() => {
        const attemptBiometricLogin = async () => {
            try {
                setIsLoggingIn(true)
                const biometricUser = await onLogin(undefined, undefined, true) // Attempt biometric login
                if (biometricUser) {
                    // Biometric login successful, no need to show form
                } else {
                    // Biometric login failed or not available, show email/password form
                    setShowEmailPasswordForm(true)
                }
            } catch (error) {
                console.error("Biometric login attempt failed:", error)
                setShowEmailPasswordForm(true)
                // Show email/password form
            } finally {
                setIsLoggingIn(false)
            }
        }

        attemptBiometricLogin()
    }, [])

    // --- Correctly get dismiss keyboard props ---
    const dismissKeyboardProps = useDismissKeyboard()

    // Validation
    const isEmailValid = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    // Animations
    const animateButtonPress = () => {
        Animated.sequence([
            /* ... */
        ]).start()
    }
    const shakeError = () => {
        Animated.sequence([
            /* ... */
        ]).start()
    }

    const handleLogin = async () => {
        setError(null)
        if (!email.trim()) {
            setError("Por favor, ingrese su correo electrónico.")
            shakeError()
            return
        }
        if (!isEmailValid(email.trim())) {
            setError("Por favor, ingrese un correo electrónico válido.")
            shakeError()
            return
        }
        if (!password) {
            setError("Por favor, ingrese su contraseña.")
            shakeError()
            return
        }

        animateButtonPress()
        setIsLoggingIn(true)
        try {
            await onLogin(email.trim(), password)
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Ingreso fallido. Verifique sus credenciales e intente de nuevo."
            if (
                message === "Ingreso fallido, intente de nuevo." &&
                err instanceof Error &&
                err.message
            ) {
                setError(err.message)
            } else {
                setError(message)
            }
            shakeError()
        } finally {
            setIsLoggingIn(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Apply dismiss keyboard props to the main inner view */}
                <View style={styles.inner} {...dismissKeyboardProps}>
                    <Stack spacing={16}>
                        {/* Logo */}
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
                        <Spacer size={10} />

                        {/* Greeting */}
                        <View style={styles.greetingContainer}>
                            <Text
                                variant="md"
                                weight="bold"
                                style={[styles.title, { color: colors.text }]}
                            >
                                Bienvenido de nuevo
                            </Text>
                            <Spacer size={4} />
                            <Text
                                variant="sm"
                                style={[
                                    styles.subtitle,
                                    { color: colors.secondaryText },
                                ]}
                            >
                                Inicia sesión para acceder a tus documentos
                            </Text>
                        </View>
                        <Spacer size={10} />

                        {/* Login Form */}
                        {showEmailPasswordForm && (
                            <>
                                <>
                                    <Animated.View
                                        style={{
                                            transform: [
                                                { translateX: shakeAnimation },
                                            ],
                                        }}
                                    >
                                        <Stack spacing={12}>
                                            {/* Email Input */}
                                            <View>
                                                <Text
                                                    variant="sm"
                                                    weight="medium"
                                                    style={[
                                                        styles.inputLabel,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    Correo electrónico
                                                </Text>
                                                <TextField
                                                    placeholder="Ingresa tu correo"
                                                    // removed placeholderTextColor
                                                    value={email}
                                                    onChangeText={setEmail}
                                                    keyboardType="email-address"
                                                    autoCapitalize="none"
                                                    returnKeyType="next"
                                                    testID="login-email-input"
                                                />
                                                {/* Note: To enable focusing next field, TextField needs to support forwardRef */}
                                            </View>

                                            {/* Password Input */}
                                            <View>
                                                <Text
                                                    variant="sm"
                                                    weight="medium"
                                                    style={[
                                                        styles.inputLabel,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    Contraseña
                                                </Text>
                                                <View
                                                    style={
                                                        styles.passwordContainer
                                                    }
                                                >
                                                    <TextField
                                                        // removed ref={passwordInputRef as any}
                                                        placeholder="Ingresa tu contraseña"
                                                        // removed placeholderTextColor
                                                        value={password}
                                                        onChangeText={
                                                            setPassword
                                                        }
                                                        secureTextEntry={
                                                            !isPasswordVisible
                                                        }
                                                        returnKeyType="go"
                                                        onSubmitEditing={
                                                            handleLogin
                                                        } // Submit form on "go"
                                                        testID="login-password-input"
                                                    />
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            setPasswordVisible(
                                                                !isPasswordVisible,
                                                            )
                                                        }
                                                        style={
                                                            styles.eyeIconContainer
                                                        }
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
                                                                color={
                                                                    colors.secondaryText
                                                                }
                                                            />
                                                        ) : (
                                                            <EyeOffIcon
                                                                width={20}
                                                                height={20}
                                                                color={
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
                                                    style={
                                                        styles.forgotPasswordContainer
                                                    }
                                                >
                                                    <TouchableOpacity
                                                        onPress={
                                                            onForgotPassword
                                                        }
                                                        hitSlop={{
                                                            top: 10,
                                                            bottom: 10,
                                                            left: 10,
                                                            right: 10,
                                                        }}
                                                    >
                                                        <Text
                                                            variant="sm"
                                                            weight="medium"
                                                            style={{
                                                                color: colors.primary,
                                                            }}
                                                        >
                                                            ¿Olvidaste tu
                                                            contraseña?
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </Stack>
                                    </Animated.View>
                                </>
                            </>
                        )}

                        <Spacer size={10} />

                        {/* Login Button */}
                        <Animated.View
                            style={{ transform: [{ scale: buttonScale }] }}
                        >
                            <Button
                                onPress={handleLogin}
                                style={styles.loginButton}
                                disabled={isLoggingIn}
                                testID="login-submit-button"
                            >
                                {isLoggingIn ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={colors.tabbarIcon_active}
                                    />
                                ) : (
                                    <Text
                                        variant="sm"
                                        weight="bold"
                                        style={{
                                            color: colors.tabbarIcon_active,
                                        }}
                                    >
                                        Iniciar sesión
                                    </Text>
                                )}
                            </Button>
                        </Animated.View>
                        <Spacer size={20} />

                        {/* Register Link */}
                        {/* ---> Use imported Row <--- */}
                        <Row
                            style={styles.registerContainer}
                            justify="center"
                            align="center"
                        >
                            <Text
                                variant="sm"
                                style={{ color: colors.secondaryText }}
                            >
                                ¿Todavía no tienes una cuenta?{/* Spanish */}{" "}
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
                                    Regístrate {/* Spanish */}
                                </Text>
                            </TouchableOpacity>
                        </Row>
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
        marginBottom: 20,
    },
    logoShadow: {
        borderRadius: 50,
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 10,
    },
    greetingContainer: {
        alignItems: "center",
        marginBottom: 28,
    },
    title: {
        textAlign: "center",
    },
    subtitle: {
        textAlign: "center",
        marginTop: 4,
    },
    inputLabel: {
        marginBottom: 6,
        marginLeft: 4,
        fontSize: 14,
    },
    passwordContainer: {
        position: "relative",
        justifyContent: "center",
    },
    eyeIconContainer: {
        position: "absolute",
        right: 16,
        height: "100%",
        justifyContent: "center",
    },
    forgotPasswordContainer: {
        alignItems: "flex-end",
        marginTop: 8,
    },
    errorText: {
        marginTop: 8,
        textAlign: "center",
        fontSize: 14,
    },
    loginButton: {
        height: 52,
    },
    registerContainer: {
        // Now using Row component
        marginTop: 20,
        flexWrap: "wrap",
    },
    registerLink: {
        paddingLeft: 5,
        paddingVertical: 5,
    },
})
