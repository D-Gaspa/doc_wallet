import React, { useState, useRef, useEffect } from "react"
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
    Keyboard,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { Button } from "../../button"
import { Stack } from "../../layout"
import { Text } from "../../typography"
import { DocWalletLogo } from "../../../common/DocWalletLogo"
import CheckIcon from "../../assets/svg/Check.svg"
import EyeIcon from "../../assets/svg/Eye.svg"
import EyeOffIcon from "../../assets/svg/EyeOff.svg"

type RegisterData = {
    firstName: string
    lastName: string
    email: string
    password: string
    acceptedTerms: boolean
}

type RegisterScreenProps = {
    onRegister: (data: RegisterData) => Promise<void>
    onGoToLogin: () => void
    termsAndConditionsUrl?: string
    privacyPolicyUrl?: string
}

export function RegisterScreen({
    onRegister,
    onGoToLogin,
    termsAndConditionsUrl,
    privacyPolicyUrl,
}: RegisterScreenProps) {
    const { colors } = useTheme()
    // Form state
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [isPasswordVisible, setPasswordVisible] = useState(false)
    const [isRegistering, setIsRegistering] = useState(false)

    // Form validation
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formTouched, setFormTouched] = useState<Record<string, boolean>>({})

    // Refs for input fields
    const lastNameInputRef = useRef<TextInput>(null)
    const emailInputRef = useRef<TextInput>(null)
    const passwordInputRef = useRef<TextInput>(null)
    const confirmPasswordInputRef = useRef<TextInput>(null)

    // Animations
    const buttonScale = useRef(new Animated.Value(1)).current
    const shakeAnimation = useRef(new Animated.Value(0)).current

    // Password strength tracking
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        feedback: "",
    })

    // Calculate password strength
    useEffect(() => {
        if (!password) {
            setPasswordStrength({ score: 0, feedback: "" })
            return
        }

        // Basic password strength calculation
        let score = 0

        // Length check
        if (password.length >= 8) score += 1
        if (password.length >= 12) score += 1

        // Character variety check
        if (/[A-Z]/.test(password)) score += 1 // Has uppercase
        if (/[a-z]/.test(password)) score += 1 // Has lowercase
        if (/[0-9]/.test(password)) score += 1 // Has numbers
        if (/[^A-Za-z0-9]/.test(password)) score += 1 // Has special chars

        let feedback: string
        if (score < 3) feedback = "Contraseña débil"
        else if (score < 5) feedback = "Contraseña moderada"
        else feedback = "Contraseña fuerte"

        setPasswordStrength({ score: Math.min(score, 6), feedback })
    }, [password])

    // Validate form field
    const validateField = (
        field: keyof RegisterData | "confirmPassword",
        value: string | boolean,
    ) => {
        let error = ""

        switch (field) {
            case "firstName":
                if (!value) error = "El primer nombre es requerido"
                break
            case "lastName":
                if (!value) error = "El apellido es requerido"
                break
            case "email":
                if (!value) error = "El email es requerido"
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))
                    error = "Por favor, ingrese un correo válido"
                break
            case "password":
                if (!value) error = "La contraseña es requerida"
                else if (String(value).length < 6)
                    error = "La contraseña debe tener al menos 6 caracteres"
                else if (passwordStrength.score < 3)
                    error = "Por favor, usa una contraseña más fuerte"
                break
            case "confirmPassword":
                if (String(value) !== password)
                    error = "Las contraseñas no coinciden"
                break
            case "acceptedTerms":
                if (!value) error = "Debes aceptar los términos y condiciones"
                break
        }

        return error
    }

    // Get field validity and error
    const getFieldState = (field: keyof RegisterData | "confirmPassword") => {
        const value =
            field === "firstName"
                ? firstName
                : field === "lastName"
                ? lastName
                : field === "email"
                ? email
                : field === "password"
                ? password
                : field === "confirmPassword"
                ? confirmPassword
                : acceptedTerms

        const touched = formTouched[field]
        const error = validateField(field, value)

        return {
            valid: error === "",
            error: touched ? error : "",
            value,
        }
    }

    // Mark field as touched
    const markTouched = (field: string) => {
        setFormTouched((prev) => ({ ...prev, [field]: true }))
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

    // Check if form is valid
    const isFormValid = () => {
        const fields: (keyof RegisterData | "confirmPassword")[] = [
            "firstName",
            "lastName",
            "email",
            "password",
            "confirmPassword",
            "acceptedTerms",
        ]

        // Mark all fields as touched
        const newFormTouched = fields.reduce((obj, field) => {
            obj[field] = true
            return obj
        }, {} as Record<string, boolean>)

        setFormTouched(newFormTouched)

        // Validate all fields
        const newErrors = fields.reduce((obj, field) => {
            const value =
                field === "firstName"
                    ? firstName
                    : field === "lastName"
                    ? lastName
                    : field === "email"
                    ? email
                    : field === "password"
                    ? password
                    : field === "confirmPassword"
                    ? confirmPassword
                    : acceptedTerms

            const error = validateField(field, value)
            if (error) obj[field] = error
            return obj
        }, {} as Record<string, string>)

        setErrors(newErrors)

        return Object.keys(newErrors).length === 0
    }

    const handleRegister = async () => {
        Keyboard.dismiss()

        // Validate form
        if (!isFormValid()) {
            shakeError()
            return
        }

        // Animate button and start loading
        animateButtonPress()
        setIsRegistering(true)

        try {
            // Call register function
            await onRegister({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password,
                acceptedTerms,
            })

            // Reset form on success
            setFirstName("")
            setLastName("")
            setEmail("")
            setPassword("")
            setConfirmPassword("")
            setAcceptedTerms(false)
            setFormTouched({})
        } catch (err) {
            // Set error message
            setErrors((prev) => ({
                ...prev,
                form:
                    err instanceof Error
                        ? err.message
                        : "Registration failed. Please try again.",
            }))
            shakeError()
        } finally {
            setIsRegistering(false)
        }
    }

    // Password strength indicator
    const renderPasswordStrength = () => {
        if (!password) return null

        const maxBars = 6
        const strengthColor =
            passwordStrength.score < 3
                ? colors.error
                : passwordStrength.score < 5
                ? colors.warning
                : colors.success

        return (
            <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                    {[...Array(maxBars)].map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.strengthBar,
                                {
                                    backgroundColor:
                                        i < passwordStrength.score
                                            ? strengthColor
                                            : colors.secondaryText + "30",
                                },
                            ]}
                        />
                    ))}
                </View>
                <Text variant="xm" style={{ color: strengthColor }}>
                    {passwordStrength.feedback}
                </Text>
            </View>
        )
    }

    // Dismiss keyboard when tapping outside inputs
    const dismissKeyboard = () => {
        Keyboard.dismiss()
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
                <View
                    style={styles.dismissKeyboardContainer}
                    onStartShouldSetResponder={() => true}
                    onResponderRelease={dismissKeyboard}
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
                            <Text
                                variant="sm"
                                style={[
                                    styles.subtitle,
                                    { color: colors.secondaryText },
                                ]}
                            >
                                Start managing your documents securely
                            </Text>
                        </View>

                        {/* Registration Form */}
                        <Animated.View
                            style={[
                                styles.formContainer,
                                { transform: [{ translateX: shakeAnimation }] },
                            ]}
                        >
                            <Stack spacing={12}>
                                {/* Names Row */}
                                <View style={styles.namesRow}>
                                    <View style={styles.nameField}>
                                        <Text
                                            variant="sm"
                                            weight="medium"
                                            style={styles.inputLabel}
                                        >
                                            First Name
                                        </Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                getFieldState("firstName").error
                                                    ? styles.inputError
                                                    : null,
                                                {
                                                    backgroundColor:
                                                        colors.searchbar,
                                                    color: colors.text,
                                                    borderColor: getFieldState(
                                                        "firstName",
                                                    ).error
                                                        ? colors.error
                                                        : colors.border,
                                                },
                                            ]}
                                            placeholder="Primer nombre"
                                            placeholderTextColor={
                                                colors.secondaryText
                                            }
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            onBlur={() =>
                                                markTouched("firstName")
                                            }
                                            returnKeyType="next"
                                            submitBehavior="submit"
                                            onSubmitEditing={() =>
                                                passwordInputRef.current?.focus()
                                            }
                                        />
                                        {getFieldState("firstName").error ? (
                                            <Text
                                                variant="xm"
                                                style={[
                                                    styles.errorText,
                                                    { color: colors.error },
                                                ]}
                                            >
                                                {
                                                    getFieldState("firstName")
                                                        .error
                                                }
                                            </Text>
                                        ) : null}
                                    </View>

                                    <View style={styles.nameField}>
                                        <Text
                                            variant="sm"
                                            weight="medium"
                                            style={styles.inputLabel}
                                        >
                                            Last Name
                                        </Text>
                                        <TextInput
                                            ref={lastNameInputRef}
                                            style={[
                                                styles.input,
                                                getFieldState("lastName").error
                                                    ? styles.inputError
                                                    : null,
                                                {
                                                    backgroundColor:
                                                        colors.searchbar,
                                                    color: colors.text,
                                                    borderColor: getFieldState(
                                                        "lastName",
                                                    ).error
                                                        ? colors.error
                                                        : colors.border,
                                                },
                                            ]}
                                            placeholder="Apellidos"
                                            placeholderTextColor={
                                                colors.secondaryText
                                            }
                                            value={lastName}
                                            onChangeText={setLastName}
                                            onBlur={() =>
                                                markTouched("lastName")
                                            }
                                            returnKeyType="next"
                                            submitBehavior="submit"
                                            onSubmitEditing={() =>
                                                passwordInputRef.current?.focus()
                                            }
                                        />
                                        {getFieldState("lastName").error ? (
                                            <Text
                                                variant="xm"
                                                style={[
                                                    styles.errorText,
                                                    { color: colors.error },
                                                ]}
                                            >
                                                {
                                                    getFieldState("lastName")
                                                        .error
                                                }
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>

                                {/* Email */}
                                <View>
                                    <Text
                                        variant="sm"
                                        weight="medium"
                                        style={styles.inputLabel}
                                    >
                                        Email
                                    </Text>
                                    <TextInput
                                        ref={emailInputRef}
                                        style={[
                                            styles.input,
                                            getFieldState("email").error
                                                ? styles.inputError
                                                : null,
                                            {
                                                backgroundColor:
                                                    colors.searchbar,
                                                color: colors.text,
                                                borderColor: getFieldState(
                                                    "email",
                                                ).error
                                                    ? colors.error
                                                    : colors.border,
                                            },
                                        ]}
                                        placeholder="Correo electrónico"
                                        placeholderTextColor={
                                            colors.secondaryText
                                        }
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={setEmail}
                                        onBlur={() => markTouched("email")}
                                        returnKeyType="next"
                                        submitBehavior="submit"
                                        onSubmitEditing={() =>
                                            passwordInputRef.current?.focus()
                                        }
                                    />
                                    {getFieldState("email").error ? (
                                        <Text
                                            variant="xm"
                                            style={[
                                                styles.errorText,
                                                { color: colors.error },
                                            ]}
                                        >
                                            {getFieldState("email").error}
                                        </Text>
                                    ) : null}
                                </View>

                                {/* Password */}
                                <View>
                                    <Text
                                        variant="sm"
                                        weight="medium"
                                        style={styles.inputLabel}
                                    >
                                        Contraseña
                                    </Text>
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            ref={passwordInputRef}
                                            style={[
                                                styles.input,
                                                getFieldState("password").error
                                                    ? styles.inputError
                                                    : null,
                                                {
                                                    backgroundColor:
                                                        colors.searchbar,
                                                    color: colors.text,
                                                    borderColor: getFieldState(
                                                        "password",
                                                    ).error
                                                        ? colors.error
                                                        : colors.border,
                                                },
                                            ]}
                                            placeholder="Contraseña (al menos 6 caracteres)"
                                            placeholderTextColor={
                                                colors.secondaryText
                                            }
                                            secureTextEntry={!isPasswordVisible}
                                            value={password}
                                            onChangeText={setPassword}
                                            onBlur={() =>
                                                markTouched("password")
                                            }
                                            returnKeyType="next"
                                            submitBehavior="submit"
                                            onSubmitEditing={() =>
                                                passwordInputRef.current?.focus()
                                            }
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
                                    {renderPasswordStrength()}
                                    {getFieldState("password").error ? (
                                        <Text
                                            variant="xm"
                                            style={[
                                                styles.errorText,
                                                { color: colors.error },
                                            ]}
                                        >
                                            {getFieldState("password").error}
                                        </Text>
                                    ) : null}
                                </View>

                                {/* Confirm Password */}
                                <View>
                                    <Text
                                        variant="sm"
                                        weight="medium"
                                        style={styles.inputLabel}
                                    >
                                        Confirm Password
                                    </Text>
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            ref={confirmPasswordInputRef}
                                            style={[
                                                styles.input,
                                                getFieldState("confirmPassword")
                                                    .error
                                                    ? styles.inputError
                                                    : null,
                                                {
                                                    backgroundColor:
                                                        colors.searchbar,
                                                    color: colors.text,
                                                    borderColor: getFieldState(
                                                        "confirmPassword",
                                                    ).error
                                                        ? colors.error
                                                        : colors.border,
                                                },
                                            ]}
                                            placeholder="Confirma tu contraseña"
                                            placeholderTextColor={
                                                colors.secondaryText
                                            }
                                            secureTextEntry={!isPasswordVisible}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            onBlur={() =>
                                                markTouched("confirmPassword")
                                            }
                                            returnKeyType="done"
                                        />
                                    </View>
                                    {getFieldState("confirmPassword").error ? (
                                        <Text
                                            variant="xm"
                                            style={[
                                                styles.errorText,
                                                { color: colors.error },
                                            ]}
                                        >
                                            {
                                                getFieldState("confirmPassword")
                                                    .error
                                            }
                                        </Text>
                                    ) : null}
                                </View>

                                {/* General form error */}
                                {errors.form ? (
                                    <Text
                                        variant="sm"
                                        style={[
                                            styles.formErrorText,
                                            { color: colors.error },
                                        ]}
                                    >
                                        {errors.form}
                                    </Text>
                                ) : null}
                            </Stack>
                        </Animated.View>

                        {/* Terms and Conditions */}
                        <View style={styles.termsContainer}>
                            <TouchableOpacity
                                style={styles.checkboxWrapper}
                                onPress={() => {
                                    setAcceptedTerms(!acceptedTerms)
                                    markTouched("acceptedTerms")
                                }}
                                hitSlop={{
                                    top: 10,
                                    bottom: 10,
                                    left: 10,
                                    right: 10,
                                }}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        {
                                            backgroundColor: acceptedTerms
                                                ? colors.primary
                                                : colors.background,
                                            borderColor: getFieldState(
                                                "acceptedTerms",
                                            ).error
                                                ? colors.error
                                                : acceptedTerms
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
                            </TouchableOpacity>

                            <View style={styles.termsTextContainer}>
                                <Text
                                    variant="sm"
                                    style={[
                                        styles.termsText,
                                        { color: colors.secondaryText },
                                    ]}
                                >
                                    I agree to the{" "}
                                    <Text
                                        style={{ color: colors.primary }}
                                        onPress={() => {
                                            // Handle Terms of Service link
                                            if (termsAndConditionsUrl) {
                                                // Open terms URL
                                            }
                                        }}
                                    >
                                        Terms of Service
                                    </Text>{" "}
                                    and{" "}
                                    <Text
                                        style={{ color: colors.primary }}
                                        onPress={() => {
                                            // Handle Privacy Policy link
                                            if (privacyPolicyUrl) {
                                                // Open privacy policy URL
                                            }
                                        }}
                                    >
                                        Privacy Policy
                                    </Text>
                                </Text>

                                {getFieldState("acceptedTerms").error ? (
                                    <Text
                                        variant="xm"
                                        style={[
                                            styles.errorText,
                                            { color: colors.error },
                                        ]}
                                    >
                                        {getFieldState("acceptedTerms").error}
                                    </Text>
                                ) : null}
                            </View>
                        </View>

                        {/* Register Button with Press Animation */}
                        <Animated.View
                            style={{
                                transform: [{ scale: buttonScale }],
                            }}
                        >
                            <Button
                                title={isRegistering ? "" : "Create Account"}
                                onPress={handleRegister}
                            >
                                {isRegistering && (
                                    <ActivityIndicator
                                        size="small"
                                        color="#FFFFFF"
                                        style={styles.loadingIndicator}
                                    />
                                )}
                            </Button>
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
                                    Sign In
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
    dismissKeyboardContainer: {
        flex: 1,
    },
    inner: {
        paddingHorizontal: 24,
        paddingVertical: 20,
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
    namesRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    nameField: {
        flex: 1,
        marginHorizontal: 4,
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
    inputError: {
        borderWidth: 1.5,
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
    errorText: {
        marginTop: 4,
        marginBottom: 2,
    },
    formErrorText: {
        textAlign: "center",
        marginTop: 8,
        marginBottom: 8,
    },
    termsContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginVertical: 8,
    },
    checkboxWrapper: {
        marginRight: 10,
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    termsTextContainer: {
        flex: 1,
    },
    termsText: {
        flexWrap: "wrap",
    },
    strengthContainer: {
        marginTop: 6,
    },
    strengthBars: {
        flexDirection: "row",
        marginVertical: 4,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        marginHorizontal: 2,
        borderRadius: 2,
    },
    loadingIndicator: {
        position: "absolute",
    },
    loginContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
    },
    loginLink: {
        padding: 5,
    },
})
