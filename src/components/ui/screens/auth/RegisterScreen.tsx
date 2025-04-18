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
import CheckIcon from "../../assets/svg/Check.svg"

type Props = {
    onRegister: (data: {
        firstName: string
        lastName: string
        email: string
        password: string
        acceptedTerms: boolean
    }) => void
    onGoToLogin: () => void
}

export function RegisterScreen({ onRegister, onGoToLogin }: Props) {
    const { colors } = useTheme()
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [acceptedTerms, setAcceptedTerms] = useState(false)

    // Animated value for button press effect
    const buttonScale = new Animated.Value(1)

    const canSubmit =
        firstName &&
        lastName &&
        email.trim().length > 0 &&
        password.length >= 6 &&
        acceptedTerms

    const handleRegister = () => {
        if (canSubmit) {
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

            onRegister({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password,
                acceptedTerms,
            })
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
                            Create Your Account
                        </Text>
                    </View>

                    {/* Registration Form */}
                    <Stack spacing={12} style={styles.formContainer}>
                        {/* First Name */}
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
                                placeholder="First Name"
                                placeholderTextColor={colors.secondaryText}
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>

                        {/* Last Name */}
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
                                placeholder="Last Name"
                                placeholderTextColor={colors.secondaryText}
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>

                        {/* Email */}
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

                        {/* Password */}
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
                                placeholder="Password"
                                placeholderTextColor={colors.secondaryText}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>
                    </Stack>

                    {/* Terms and Conditions */}
                    <TouchableOpacity
                        style={styles.termsContainer}
                        onPress={() => setAcceptedTerms(!acceptedTerms)}
                    >
                        <View
                            style={[
                                styles.checkbox,
                                {
                                    backgroundColor: acceptedTerms
                                        ? colors.primary
                                        : colors.secondaryText,
                                    borderColor: acceptedTerms
                                        ? colors.primary
                                        : colors.secondaryText,
                                },
                            ]}
                        >
                            {acceptedTerms && (
                                <CheckIcon
                                    width={14}
                                    height={14}
                                    stroke="#FFFFFF"
                                />
                            )}
                        </View>
                        <Text
                            variant="sm"
                            style={[
                                styles.termsText,
                                { color: colors.secondaryText },
                            ]}
                        >
                            <Text> I agree to the </Text>
                            <Text style={{ color: colors.primary }}>
                                Terms of Service
                            </Text>{" "}
                            <Text> and </Text>
                            <Text style={{ color: colors.primary }}>
                                Privacy Policy
                            </Text>
                        </Text>
                    </TouchableOpacity>

                    {/* Register Button with Press Animation */}
                    <Animated.View
                        style={{
                            transform: [{ scale: buttonScale }],
                        }}
                    >
                        <Button title="Sign Up" onPress={handleRegister} />
                    </Animated.View>

                    {/* Login Link */}
                    <View style={styles.loginContainer}>
                        <Text
                            variant="sm"
                            style={{ color: colors.secondaryText }}
                        >
                            Already have an account?{" "}
                        </Text>
                        <TouchableOpacity
                            onPress={onGoToLogin}
                            style={styles.loginLink}
                        >
                            <Text
                                variant="sm"
                                weight="bold"
                                style={{ color: colors.primary }}
                            >
                                Sign In
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
    termsContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        marginRight: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    termsText: {
        flex: 1,
        fontSize: 12,
    },
    loginContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
    },
    loginLink: {
        padding: 5,
    },
})
