import React, { useState } from "react"
import {
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ScrollView,
    Animated,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { Button } from "../../button"
import { Stack } from "../../layout"
import { Text } from "../../typography"
import { DocWalletLogo } from "../../../common/DocWalletLogo"
import EyeIcon from "../../assets/svg/Eye.svg"
import EyeOffIcon from "../../assets/svg/EyeOff.svg"

type Props = {
    onLogin: (email: string, password: string) => void
    onGoToRegister: () => void
    onForgotPassword?: () => void
}

export function LoginScreen({
    onLogin,
    onGoToRegister,
    onForgotPassword,
}: Props) {
    const { colors } = useTheme()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isPasswordVisible, setPasswordVisible] = useState(false)

    // Animated value for button press effect
    const buttonScale = new Animated.Value(1)

    const handleLogin = () => {
        if (email.trim() && password.trim()) {
            // Add press animation
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

            onLogin(email.trim(), password)
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
                    </View>

                    {/* Login Form */}
                    <Stack spacing={12} style={styles.formContainer}>
                        {/* Email Input */}
                        <View>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.searchbar,
                                        color: colors.text,
                                        borderColor: colors.border,
                                    },
                                ]}
                                placeholder="Email"
                                placeholderTextColor={colors.secondaryText}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        {/* Password Input */}
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.searchbar,
                                        color: colors.text,
                                        borderColor: colors.border,
                                    },
                                ]}
                                placeholder="Password"
                                placeholderTextColor={colors.secondaryText}
                                secureTextEntry={!isPasswordVisible}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity
                                onPress={() =>
                                    setPasswordVisible(!isPasswordVisible)
                                }
                                style={styles.eyeIconContainer}
                            >
                                {isPasswordVisible ? (
                                    <EyeIcon
                                        width={20}
                                        height={20}
                                        stroke={colors.secondaryText}
                                    />
                                ) : (
                                    <EyeOffIcon
                                        width={20}
                                        height={20}
                                        stroke={colors.secondaryText}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Forgot Password */}
                        {onForgotPassword && (
                            <View style={styles.forgotPasswordContainer}>
                                <TouchableOpacity onPress={onForgotPassword}>
                                    <Text variant="xm">Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Stack>

                    {/* Login Button with Press Animation */}
                    <Animated.View
                        style={{
                            transform: [{ scale: buttonScale }],
                        }}
                    >
                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            style={styles.loginButton}
                        />
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
        paddingHorizontal: 20,
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
        marginBottom: 20,
    },
    title: {
        textAlign: "center",
        marginBottom: 6,
    },
    formContainer: {
        marginBottom: 20,
    },
    input: {
        height: 44,
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 14,
        borderWidth: 1,
    },
    passwordContainer: {
        // Remove this style as it's no longer used
    },
    eyeIconContainer: {
        position: "absolute",
        right: 10,
        top: "50%",
        transform: [{ translateY: -10 }],
    },
    forgotPasswordContainer: {
        alignItems: "flex-end",
        marginTop: 8,
    },
    loginButton: {
        marginTop: 12,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 4,
    },
    registerContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
    },
    registerLink: {
        padding: 5,
    },
})
