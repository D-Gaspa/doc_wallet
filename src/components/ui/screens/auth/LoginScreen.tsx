import React, { useRef, useState } from "react"
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../../hooks/useTheme"
import { Button } from "../../button"
import { Row, Spacer, Stack } from "../../layout"
import { Text } from "../../typography"
import { TextField } from "../../form"
import { DocWalletLogo } from "../../../common/DocWalletLogo"
import { useDismissKeyboard } from "../../../../hooks/useDismissKeyboard"

type LoginScreenProps = {
    onLogin: (email: string, password: string) => Promise<void>
    onGoToRegister: () => void
    onForgotPassword?: () => void
    testID?: string
}

export function LoginScreen({
    onLogin,
    onGoToRegister,
    onForgotPassword,
    testID,
}: LoginScreenProps) {
    const { colors } = useTheme()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isPasswordVisible, setPasswordVisible] = useState(false)
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const passwordInputRef = useRef<TextInput>(null)
    const buttonScale = useRef(new Animated.Value(1)).current
    const shakeAnimation = useRef(new Animated.Value(0)).current
    const dismissKeyboardProps = useDismissKeyboard()

    const isEmailValid = (emailToTest: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToTest)

    const animateButtonPress = () => {
        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.96,
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

    const shakeError = () => {
        shakeAnimation.setValue(0)
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
                    : "Error desconocido al iniciar sesión."
            setError(message)
            shakeError()
        } finally {
            setIsLoggingIn(false)
        }
    }

    const togglePasswordVisibility = () => {
        setPasswordVisible(!isPasswordVisible)
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            testID={testID ?? "login-screen"}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.inner} {...dismissKeyboardProps}>
                    <Stack spacing={16}>
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

                        <Animated.View
                            style={{
                                transform: [{ translateX: shakeAnimation }],
                            }}
                        >
                            <Stack spacing={12}>
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
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        onSubmitEditing={() =>
                                            passwordInputRef.current?.focus()
                                        }
                                        testID="login-email-input"
                                        hasError={
                                            !!(
                                                error &&
                                                (error.includes("correo") ||
                                                    error.includes("email"))
                                            )
                                        }
                                    />
                                </View>

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
                                    <View style={styles.passwordContainer}>
                                        <TextField
                                            ref={passwordInputRef}
                                            placeholder="Ingresa tu contraseña"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!isPasswordVisible}
                                            returnKeyType="go"
                                            onSubmitEditing={handleLogin}
                                            testID="login-password-input"
                                            hasError={
                                                !!(
                                                    error &&
                                                    error.includes("contraseña")
                                                )
                                            }
                                        />
                                        <TouchableOpacity
                                            onPress={togglePasswordVisibility}
                                            style={styles.eyeIconContainer}
                                            hitSlop={{
                                                top: 10,
                                                bottom: 10,
                                                left: 10,
                                                right: 10,
                                            }}
                                            accessibilityLabel={
                                                isPasswordVisible
                                                    ? "Ocultar contraseña"
                                                    : "Mostrar contraseña"
                                            }
                                        >
                                            <FontAwesome6
                                                name={
                                                    isPasswordVisible
                                                        ? "eye"
                                                        : "eye-slash"
                                                }
                                                size={20}
                                                color={colors.secondaryText}
                                                iconStyle="solid"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

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
                                                weight="medium"
                                                style={{
                                                    color: colors.primary,
                                                }}
                                            >
                                                ¿Olvidaste tu contraseña?
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </Stack>
                        </Animated.View>
                        <Spacer size={10} />

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

                        <Row
                            style={styles.registerContainer}
                            justify="center"
                            align="center"
                        >
                            <Text
                                variant="sm"
                                style={{ color: colors.secondaryText }}
                            >
                                ¿Todavía no tienes una cuenta?{" "}
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
                                    Regístrate
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
        paddingVertical: 30, // Adjust padding as needed
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
        right: 0,
        paddingHorizontal: 16,
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
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
        marginTop: 20,
        flexWrap: "wrap",
    },
    registerLink: {
        paddingLeft: 5,
        paddingVertical: 5,
    },
})
