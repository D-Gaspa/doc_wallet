//components/ui/screens/auth/RegisterScreen.tsx

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
    Keyboard,
    Modal,
    // Linking, // ---> Removed unused import
    TextInput, // Keep for ref typing
    TouchableWithoutFeedback,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { Button } from "../../button"
import { Stack, Spacer, Row } from "../../layout"
import { Text } from "../../typography"
import { TextField } from "../../form"
import { Checkbox } from "../../form"
import { DocWalletLogo } from "../../../common/DocWalletLogo"
import EyeIcon from "../../assets/svg/Eye.svg"
import EyeOffIcon from "../../assets/svg/EyeOff.svg"
import { TermsAndConditionsScreen } from "./TermsAndConditions"

type RegisterData = {
    firstName: string
    lastName: string
    email: string
    password: string
    acceptedTerms: boolean
    enableBioAuth: boolean
}

type RegisterScreenProps = {
    onRegister: (data: RegisterData) => Promise<void>
    onGoToLogin: () => void
}

export function RegisterScreen({
    onRegister,
    onGoToLogin,
}: RegisterScreenProps) {
    const { colors } = useTheme()
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [isPasswordVisible, setPasswordVisible] = useState(false)
    const [isRegistering, setIsRegistering] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formTouched, setFormTouched] = useState<Record<string, boolean>>({})
    const [isTermsModalVisible, setIsTermsModalVisible] = useState(false)
    const [enableBiometrics, setEnableBiometrics] = useState(false)

    const lastNameInputRef = useRef<TextInput>(null)
    const emailInputRef = useRef<TextInput>(null)
    const passwordInputRef = useRef<TextInput>(null)
    const confirmPasswordInputRef = useRef<TextInput>(null)

    // --- Animations ---
    const buttonScale = useRef(new Animated.Value(1)).current
    const shakeAnimation = useRef(new Animated.Value(0)).current

    // --- Password Strength ---
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        feedback: "",
    })
    useEffect(() => {
        if (!password) {
            setPasswordStrength({ score: 0, feedback: "" })
            return
        }
        let score = 0
        if (password.length >= 8) score += 1
        if (password.length >= 12) score += 1
        if (/[A-Z]/.test(password)) score += 1
        if (/[a-z]/.test(password)) score += 1
        if (/[0-9]/.test(password)) score += 1
        if (/[^A-Za-z0-9]/.test(password)) score += 1
        const feedback =
            score < 3
                ? "Contraseña débil"
                : score < 5
                ? "Contraseña moderada"
                : "Contraseña fuerte"
        setPasswordStrength({ score: Math.min(score, 6), feedback })
    }, [password, colors])

    const validateField = (
        field: keyof RegisterData | "confirmPassword",
        value: string | boolean,
    ): string => {
        let error = ""
        switch (field) {
            case "firstName":
                if (!value) error = "El nombre es requerido"
                break
            case "lastName":
                if (!value) error = "El apellido es requerido"
                break
            case "email":
                if (!value) error = "El correo es requerido"
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))
                    error = "Por favor, ingrese un correo válido"
                break
            case "password":
                if (!value) error = "La contraseña es requerida"
                else if (String(value).length < 6)
                    error = "La contraseña debe tener al menos 6 caracteres"
                break
            case "confirmPassword":
                if (!value) error = "Por favor confirme la contraseña"
                else if (String(value) !== password)
                    error = "Las contraseñas no coinciden"
                break
            case "enableBioAuth":
                break
            case "acceptedTerms":
                if (!value) error = "Debes aceptar los términos y condiciones"
                break
        }
        return error
    }

    const getFieldState = (
        field: keyof RegisterData | "confirmPassword" | "enableBioAuth",
    ) => {
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
                ? acceptedTerms
                : enableBiometrics
        const touched = formTouched[field]
        const error = validateField(field, value)
        return { valid: error === "", error: error, value, touched }
    }

    const markTouched = (field: keyof RegisterData | "confirmPassword") => {
        setFormTouched((prev) => ({ ...prev, [field]: true }))
    }

    // Animations
    const animateButtonPress = () => {
        /* ... */
    }
    const shakeError = () => {
        /* ... */
    }

    // --- Form Validation & Submission ---
    const isFormValid = (): boolean => {
        const fields: (keyof RegisterData | "confirmPassword")[] = [
            "firstName",
            "lastName",
            "email",
            "password",
            "confirmPassword",
            "acceptedTerms",
        ]
        let isValid = true
        const newErrors: Record<string, string> = {}
        const newTouched: Record<string, boolean> = { ...formTouched }

        fields.forEach((field) => {
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
            if (error) {
                newErrors[field] = error
                isValid = false
            }
            newTouched[field] = true
        })
        setErrors(newErrors)
        setFormTouched(newTouched)
        return isValid
    }

    const handleRegister = async () => {
        Keyboard.dismiss()
        if (!isFormValid()) {
            shakeError()
            return
        }
        animateButtonPress()
        setIsRegistering(true)
        try {
            await onRegister({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password,
                acceptedTerms,
                enableBioAuth: enableBiometrics,
            })
        } catch (err) {
            setErrors((prev) => ({
                ...prev,
                form:
                    err instanceof Error
                        ? err.message
                        : "Registro fallido. Intente de nuevo.",
            }))
            shakeError()
        } finally {
            setIsRegistering(false)
        }
    }

    // --- T&C Modal Handlers ---
    const handleAcceptTerms = () => {
        setAcceptedTerms(true)
        setIsTermsModalVisible(false)
        markTouched("acceptedTerms")
        setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.acceptedTerms
            return newErrors
        })
    }
    const handleDeclineTerms = () => {
        setAcceptedTerms(false)
        setIsTermsModalVisible(false)
        markTouched("acceptedTerms")
        const error = validateField("acceptedTerms", false)
        if (error) {
            setErrors((prev) => ({ ...prev, acceptedTerms: error }))
        }
    }

    // --- Password Strength Indicator ---
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
                {passwordStrength.feedback && (
                    <Text variant="xm" style={{ color: strengthColor }}>
                        {passwordStrength.feedback}
                    </Text>
                )}
            </View>
        )
    }

    const dismissKeyboard = () => Keyboard.dismiss()

    // Get field states for error display
    const firstNameState = getFieldState("firstName")
    const lastNameState = getFieldState("lastName")
    const emailState = getFieldState("email")
    const passwordState = getFieldState("password")
    const confirmPasswordState = getFieldState("confirmPassword")
    const acceptedTermsState = getFieldState("acceptedTerms")
    const enableBiometricsState = getFieldState("enableBioAuth")

    return (
        <>
            <KeyboardAvoidingView
                style={[
                    styles.container,
                    { backgroundColor: colors.background },
                ]}
                behavior={Platform.select({
                    ios: "padding",
                    android: "height",
                })}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableWithoutFeedback
                        onPress={dismissKeyboard}
                        accessible={false}
                    >
                        <View style={styles.inner}>
                            <Stack spacing={12}>
                                {/* Logo */}
                                <View style={styles.logoContainer}>
                                    <View
                                        style={[
                                            styles.logoShadow,
                                            {
                                                shadowColor: colors.primary,
                                                backgroundColor:
                                                    colors.background,
                                            },
                                        ]}
                                    >
                                        <DocWalletLogo
                                            size={80}
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
                                        style={[
                                            styles.title,
                                            { color: colors.text },
                                        ]}
                                    >
                                        Crea tu cuenta
                                    </Text>
                                    <Spacer size={4} />
                                    <Text
                                        variant="sm"
                                        style={[
                                            styles.subtitle,
                                            { color: colors.secondaryText },
                                        ]}
                                    >
                                        Comienza a gestionar tus documentos de
                                        forma segura
                                    </Text>
                                </View>
                                {/* Registration Form */}
                                <Animated.View
                                    style={{
                                        transform: [
                                            { translateX: shakeAnimation },
                                        ],
                                    }}
                                >
                                    <Stack spacing={10}>
                                        {/* Names Row */}
                                        <Row
                                            style={styles.namesRow}
                                            spacing={10}
                                        >
                                            <View style={styles.nameField}>
                                                <Text
                                                    variant="sm"
                                                    weight="medium"
                                                    style={[
                                                        styles.inputLabel,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    Nombre(s)
                                                </Text>
                                                <TextField
                                                    placeholder="Tu nombre"
                                                    value={firstName}
                                                    onChangeText={setFirstName}
                                                    onBlur={() =>
                                                        markTouched("firstName")
                                                    }
                                                    returnKeyType="next"
                                                    hasError={
                                                        firstNameState.touched &&
                                                        !!firstNameState.error
                                                    }
                                                    onSubmitEditing={() =>
                                                        lastNameInputRef.current?.focus()
                                                    }
                                                />
                                                {firstNameState.touched &&
                                                firstNameState.error ? (
                                                    <Text
                                                        variant="xm"
                                                        style={[
                                                            styles.errorText,
                                                            {
                                                                color: colors.error,
                                                            },
                                                        ]}
                                                    >
                                                        {firstNameState.error}
                                                    </Text>
                                                ) : (
                                                    <View
                                                        style={
                                                            styles.errorPlaceholder
                                                        }
                                                    />
                                                )}
                                            </View>
                                            <View style={styles.nameField}>
                                                <Text
                                                    variant="sm"
                                                    weight="medium"
                                                    style={[
                                                        styles.inputLabel,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    Apellidos
                                                </Text>
                                                <TextField
                                                    ref={lastNameInputRef}
                                                    placeholder="Tus apellidos"
                                                    value={lastName}
                                                    onChangeText={setLastName}
                                                    onBlur={() =>
                                                        markTouched("lastName")
                                                    }
                                                    returnKeyType="next"
                                                    hasError={
                                                        lastNameState.touched &&
                                                        !!lastNameState.error
                                                    }
                                                    onSubmitEditing={() =>
                                                        emailInputRef.current?.focus()
                                                    }
                                                />
                                                {lastNameState.touched &&
                                                lastNameState.error ? (
                                                    <Text
                                                        variant="xm"
                                                        style={[
                                                            styles.errorText,
                                                            {
                                                                color: colors.error,
                                                            },
                                                        ]}
                                                    >
                                                        {lastNameState.error}
                                                    </Text>
                                                ) : (
                                                    <View
                                                        style={
                                                            styles.errorPlaceholder
                                                        }
                                                    />
                                                )}
                                            </View>
                                        </Row>
                                        {/* Email */}
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
                                                ref={emailInputRef}
                                                placeholder="ejemplo@correo.com"
                                                value={email}
                                                onChangeText={setEmail}
                                                onBlur={() =>
                                                    markTouched("email")
                                                }
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                returnKeyType="next"
                                                hasError={
                                                    emailState.touched &&
                                                    !!emailState.error
                                                }
                                                onSubmitEditing={() =>
                                                    passwordInputRef.current?.focus()
                                                }
                                            />
                                            {emailState.touched &&
                                            emailState.error ? (
                                                <Text
                                                    variant="xm"
                                                    style={[
                                                        styles.errorText,
                                                        { color: colors.error },
                                                    ]}
                                                >
                                                    {emailState.error}
                                                </Text>
                                            ) : (
                                                <View
                                                    style={
                                                        styles.errorPlaceholder
                                                    }
                                                />
                                            )}
                                        </View>
                                        {/* Password */}
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
                                                style={styles.passwordContainer}
                                            >
                                                <TextField
                                                    ref={passwordInputRef}
                                                    placeholder="Mínimo 6 caracteres"
                                                    value={password}
                                                    onChangeText={setPassword}
                                                    onBlur={() =>
                                                        markTouched("password")
                                                    }
                                                    secureTextEntry={
                                                        !isPasswordVisible
                                                    }
                                                    returnKeyType="next"
                                                    hasError={
                                                        passwordState.touched &&
                                                        !!passwordState.error
                                                    }
                                                    onSubmitEditing={() =>
                                                        confirmPasswordInputRef.current?.focus()
                                                    }
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
                                            {renderPasswordStrength()}
                                            {passwordState.touched &&
                                            passwordState.error ? (
                                                <Text
                                                    variant="xm"
                                                    style={[
                                                        styles.errorText,
                                                        { color: colors.error },
                                                    ]}
                                                >
                                                    {passwordState.error}
                                                </Text>
                                            ) : (
                                                <View
                                                    style={
                                                        styles.errorPlaceholder
                                                    }
                                                />
                                            )}
                                        </View>
                                        {/* Confirm Password */}
                                        <View>
                                            <Text
                                                variant="sm"
                                                weight="medium"
                                                style={[
                                                    styles.inputLabel,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                Confirmar contraseña
                                            </Text>
                                            <View
                                                style={styles.passwordContainer}
                                            >
                                                <TextField
                                                    ref={
                                                        confirmPasswordInputRef
                                                    }
                                                    placeholder="Confirma tu contraseña"
                                                    value={confirmPassword}
                                                    onChangeText={
                                                        setConfirmPassword
                                                    }
                                                    onBlur={() =>
                                                        markTouched(
                                                            "confirmPassword",
                                                        )
                                                    }
                                                    secureTextEntry={
                                                        !isPasswordVisible
                                                    }
                                                    returnKeyType="done"
                                                    onSubmitEditing={
                                                        handleRegister
                                                    }
                                                    hasError={
                                                        confirmPasswordState.touched &&
                                                        !!confirmPasswordState.error
                                                    }
                                                />
                                            </View>
                                            {confirmPasswordState.touched &&
                                            confirmPasswordState.error ? (
                                                <Text
                                                    variant="xm"
                                                    style={[
                                                        styles.errorText,
                                                        { color: colors.error },
                                                    ]}
                                                >
                                                    {confirmPasswordState.error}
                                                </Text>
                                            ) : (
                                                <View
                                                    style={
                                                        styles.errorPlaceholder
                                                    }
                                                />
                                            )}
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
                                {/*  Enable Biometrics Checkbox */}
                                <View style={styles.termsContainer}>
                                    <View style={styles.checkboxWrapper}>
                                        <Checkbox
                                            checked={enableBiometrics}
                                            onToggle={() => {
                                                setEnableBiometrics(
                                                    !enableBiometrics,
                                                )
                                                markTouched("enableBioAuth")
                                            }}
                                        />
                                    </View>
                                    <View style={styles.termsTextContainer}>
                                        <Text
                                            variant="sm"
                                            style={[
                                                styles.termsText,
                                                { color: colors.secondaryText },
                                            ]}
                                        >
                                            Habilitar Biometría
                                        </Text>
                                        {enableBiometricsState.touched &&
                                        enableBiometricsState.error ? (
                                            <Text
                                                variant="xm"
                                                style={[
                                                    styles.errorText,
                                                    { color: colors.error },
                                                ]}
                                            >
                                                {enableBiometricsState.error}
                                            </Text>
                                        ) : (
                                            <View
                                                style={styles.errorPlaceholder}
                                            />
                                        )}
                                    </View>
                                </View>

                                {/* Terms and Conditions */}
                                <View style={styles.termsContainer}>
                                    <View style={styles.checkboxWrapper}>
                                        <Checkbox
                                            checked={acceptedTerms}
                                            onToggle={() => {
                                                setIsTermsModalVisible(true)
                                                markTouched("acceptedTerms")
                                            }}
                                            // Removed style prop
                                        />
                                    </View>
                                    <View style={styles.termsTextContainer}>
                                        <Text
                                            variant="sm"
                                            style={[
                                                styles.termsText,
                                                { color: colors.secondaryText },
                                            ]}
                                        >
                                            Acepto los
                                            <Text
                                                variant="sm"
                                                style={[
                                                    styles.linkText,
                                                    { color: colors.primary },
                                                ]}
                                                onPress={() =>
                                                    setIsTermsModalVisible(true)
                                                }
                                            >
                                                {" "}
                                                términos de servicio
                                            </Text>
                                        </Text>
                                        {acceptedTermsState.touched &&
                                        acceptedTermsState.error ? (
                                            <Text
                                                variant="xm"
                                                style={[
                                                    styles.errorText,
                                                    { color: colors.error },
                                                ]}
                                            >
                                                {acceptedTermsState.error}
                                            </Text>
                                        ) : (
                                            <View
                                                style={styles.errorPlaceholder}
                                            />
                                        )}
                                    </View>
                                </View>
                                {/* Register Button */}
                                <Animated.View
                                    style={[
                                        { transform: [{ scale: buttonScale }] },
                                        styles.buttonWrapper,
                                    ]}
                                >
                                    <Button
                                        onPress={handleRegister}
                                        disabled={isRegistering}
                                    >
                                        {isRegistering ? (
                                            <ActivityIndicator
                                                size="small"
                                                color={colors.tabbarIcon_active}
                                            />
                                        ) : (
                                            <Text
                                                variant="base"
                                                weight="bold"
                                                style={{
                                                    color: colors.tabbarIcon_active,
                                                }}
                                            >
                                                Crear cuenta
                                            </Text>
                                        )}
                                    </Button>
                                </Animated.View>
                                {/* Login Link */}
                                <Row
                                    style={styles.loginContainer}
                                    justify="center"
                                    align="center"
                                >
                                    <Text
                                        variant="sm"
                                        style={{ color: colors.secondaryText }}
                                    >
                                        ¿Ya tienes una cuenta?{" "}
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
                                            Iniciar sesión
                                        </Text>
                                    </TouchableOpacity>
                                </Row>
                            </Stack>
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Terms and Conditions Modal */}
            <Modal
                visible={isTermsModalVisible}
                animationType="slide"
                onRequestClose={handleDeclineTerms}
            >
                <TermsAndConditionsScreen
                    onAccept={handleAcceptTerms}
                    onDecline={handleDeclineTerms}
                />
            </Modal>
        </>
    )
}

// --- Styles ---
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { flexGrow: 1 },
    inner: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 30,
        flex: 1,
        justifyContent: "center",
    },
    logoContainer: { alignItems: "center", marginBottom: 15 },
    logoShadow: {
        borderRadius: 50,
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 10,
    },
    greetingContainer: { alignItems: "center", marginBottom: 20 },
    title: { textAlign: "center" },
    subtitle: { textAlign: "center", marginTop: 4 },
    namesRow: {
        /* Using Row component spacing */
    },
    nameField: { flex: 1 },
    inputLabel: { marginBottom: 6, marginLeft: 4, fontSize: 14 },
    // inputBase style removed
    // inputError style removed
    passwordContainer: { position: "relative", justifyContent: "center" },
    eyeIconContainer: {
        position: "absolute",
        right: 16,
        height: "100%",
        justifyContent: "center",
    },
    errorText: { marginTop: 4, fontSize: 12, minHeight: 16 },
    errorPlaceholder: { minHeight: 16 },
    formErrorText: { textAlign: "center", marginVertical: 8 },
    termsContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginVertical: 12,
    },
    checkboxWrapper: {
        marginRight: 10,
        marginTop: 3,
    },
    termsTextContainer: { flex: 1 },
    termsText: { lineHeight: 20 },
    linkText: { fontWeight: "500" },
    strengthContainer: { marginTop: 6 },
    strengthBars: { flexDirection: "row", marginVertical: 4, height: 4 },
    strengthBar: { flex: 1, marginHorizontal: 1, borderRadius: 2 },
    buttonWrapper: { marginTop: 16, marginBottom: 8 },
    loginContainer: { marginTop: 16, flexWrap: "wrap" },
    loginLink: { paddingLeft: 5, paddingVertical: 5 },
})
