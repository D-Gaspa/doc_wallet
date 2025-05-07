import React, { useEffect, useRef, useState } from "react"
import {
    ActivityIndicator,
    Animated,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../../hooks/useTheme"
import { Button } from "../../button"
import { Row, Spacer, Stack } from "../../layout"
import { Text } from "../../typography"
import { Checkbox, TextField } from "../../form"
import { DocWalletLogo } from "../../../common/DocWalletLogo"
import { TermsAndConditionsScreen } from "./TermsAndConditions"

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
    testID?: string
}

export function RegisterScreen({
    onRegister,
    onGoToLogin,
    testID,
}: RegisterScreenProps) {
    const { colors } = useTheme()
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [isPasswordVisible, setPasswordVisible] = useState(false)
    const [isConfirmPasswordVisible, setConfirmPasswordVisible] =
        useState(false)
    const [isRegistering, setIsRegistering] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formTouched, setFormTouched] = useState<Record<string, boolean>>({})
    const [isTermsModalVisible, setIsTermsModalVisible] = useState(false)

    const lastNameInputRef = useRef<TextInput>(null)
    const emailInputRef = useRef<TextInput>(null)
    const passwordInputRef = useRef<TextInput>(null)
    const confirmPasswordInputRef = useRef<TextInput>(null)

    const buttonScale = useRef(new Animated.Value(1)).current
    const shakeAnimation = useRef(new Animated.Value(0)).current

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

        let feedbackText: string
        if (score < 3) feedbackText = "Contraseña débil"
        else if (score < 5) feedbackText = "Contraseña moderada"
        else feedbackText = "Contraseña fuerte"
        setPasswordStrength({
            score: Math.min(score, 6),
            feedback: feedbackText,
        })
    }, [password])

    const validateField = (
        field: keyof RegisterData | "confirmPassword",
        value: string | boolean,
    ): string => {
        let errorMsg = ""
        switch (field) {
            case "firstName":
                if (!value) errorMsg = "El nombre es requerido"
                break
            case "lastName":
                if (!value) errorMsg = "El apellido es requerido"
                break
            case "email":
                if (!value) errorMsg = "El correo es requerido"
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))
                    errorMsg = "Por favor, ingrese un correo válido"
                break
            case "password":
                if (!value) errorMsg = "La contraseña es requerida"
                else if (String(value).length < 8)
                    errorMsg = "La contraseña debe tener al menos 8 caracteres"
                break
            case "confirmPassword":
                if (!value) errorMsg = "Por favor confirme la contraseña"
                else if (String(value) !== password)
                    errorMsg = "Las contraseñas no coinciden"
                break
            case "acceptedTerms":
                if (!value)
                    errorMsg = "Debes aceptar los términos y condiciones"
                break
        }
        return errorMsg
    }

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
        return { valid: error === "", error, value, touched }
    }

    const markTouched = (field: keyof RegisterData | "confirmPassword") => {
        setFormTouched((prev) => ({ ...prev, [field]: true }))
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
        setErrors((prev) => ({ ...prev, [field]: error }))
    }

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
        setErrors({})

        try {
            await onRegister({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password,
                acceptedTerms,
            })
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Error desconocido durante el registro."
            setErrors((prev) => ({ ...prev, form: message }))
            shakeError()
        } finally {
            setIsRegistering(false)
        }
    }

    const handleAcceptTerms = () => {
        setAcceptedTerms(true)
        setIsTermsModalVisible(false)
        markTouched("acceptedTerms")
    }
    const handleDeclineTerms = () => {
        setAcceptedTerms(false)
        setIsTermsModalVisible(false)
        markTouched("acceptedTerms")
    }

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
                                            : colors.border + "30",
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

    const firstNameState = getFieldState("firstName")
    const lastNameState = getFieldState("lastName")
    const emailState = getFieldState("email")
    const passwordState = getFieldState("password")
    const confirmPasswordState = getFieldState("confirmPassword")
    const acceptedTermsState = getFieldState("acceptedTerms")

    return (
        <>
            <KeyboardAvoidingView
                style={[
                    styles.container,
                    { backgroundColor: colors.background },
                ]}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                testID={testID ?? "register-screen"}
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

                                <Animated.View
                                    style={{
                                        transform: [
                                            { translateX: shakeAnimation },
                                        ],
                                    }}
                                >
                                    <Stack spacing={10}>
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
                                                    firstNameState.error && (
                                                        <Text
                                                            variant="xm"
                                                            style={[
                                                                styles.errorText,
                                                                {
                                                                    color: colors.error,
                                                                },
                                                            ]}
                                                        >
                                                            {
                                                                firstNameState.error
                                                            }
                                                        </Text>
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
                                                    lastNameState.error && (
                                                        <Text
                                                            variant="xm"
                                                            style={[
                                                                styles.errorText,
                                                                {
                                                                    color: colors.error,
                                                                },
                                                            ]}
                                                        >
                                                            {
                                                                lastNameState.error
                                                            }
                                                        </Text>
                                                    )}
                                            </View>
                                        </Row>

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
                                                emailState.error && (
                                                    <Text
                                                        variant="xm"
                                                        style={[
                                                            styles.errorText,
                                                            {
                                                                color: colors.error,
                                                            },
                                                        ]}
                                                    >
                                                        {emailState.error}
                                                    </Text>
                                                )}
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
                                            <View
                                                style={styles.passwordContainer}
                                            >
                                                <TextField
                                                    ref={passwordInputRef}
                                                    placeholder="Mínimo 8 caracteres"
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
                                                        color={
                                                            colors.secondaryText
                                                        }
                                                        iconStyle="solid"
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                            {renderPasswordStrength()}
                                            {passwordState.touched &&
                                                passwordState.error && (
                                                    <Text
                                                        variant="xm"
                                                        style={[
                                                            styles.errorText,
                                                            {
                                                                color: colors.error,
                                                            },
                                                        ]}
                                                    >
                                                        {passwordState.error}
                                                    </Text>
                                                )}
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
                                                        !isConfirmPasswordVisible
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
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        setConfirmPasswordVisible(
                                                            !isConfirmPasswordVisible,
                                                        )
                                                    }
                                                    style={
                                                        styles.eyeIconContainer
                                                    }
                                                    accessibilityLabel={
                                                        isConfirmPasswordVisible
                                                            ? "Ocultar confirmación de contraseña"
                                                            : "Mostrar confirmación de contraseña"
                                                    }
                                                >
                                                    <FontAwesome6
                                                        name={
                                                            isConfirmPasswordVisible
                                                                ? "eye"
                                                                : "eye-slash"
                                                        }
                                                        size={20}
                                                        color={
                                                            colors.secondaryText
                                                        }
                                                        iconStyle="solid"
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                            {confirmPasswordState.touched &&
                                                confirmPasswordState.error && (
                                                    <Text
                                                        variant="xm"
                                                        style={[
                                                            styles.errorText,
                                                            {
                                                                color: colors.error,
                                                            },
                                                        ]}
                                                    >
                                                        {
                                                            confirmPasswordState.error
                                                        }
                                                    </Text>
                                                )}
                                        </View>

                                        {errors.form && (
                                            <Text
                                                variant="sm"
                                                style={[
                                                    styles.formErrorText,
                                                    { color: colors.error },
                                                ]}
                                            >
                                                {errors.form}
                                            </Text>
                                        )}
                                    </Stack>
                                </Animated.View>

                                <View style={styles.termsContainer}>
                                    <View style={styles.checkboxWrapper}>
                                        <Checkbox
                                            checked={acceptedTerms}
                                            onToggle={() =>
                                                setIsTermsModalVisible(true)
                                            }
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
                                            acceptedTermsState.error && (
                                                <Text
                                                    variant="xm"
                                                    style={[
                                                        styles.errorText,
                                                        styles.termsErrorText,
                                                        { color: colors.error },
                                                    ]}
                                                >
                                                    {acceptedTermsState.error}
                                                </Text>
                                            )}
                                    </View>
                                </View>

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

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { flexGrow: 1, justifyContent: "center" },
    inner: {
        paddingHorizontal: 24,
        paddingVertical: 30,
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
        /* Uses Row component spacing */
    },
    nameField: { flex: 1 },
    inputLabel: { marginBottom: 6, marginLeft: 4, fontSize: 14 },
    passwordContainer: { position: "relative", justifyContent: "center" },
    eyeIconContainer: {
        position: "absolute",
        right: 0,
        paddingHorizontal: 16,
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        marginTop: 4,
        fontSize: 12,
        minHeight: 16,
    },
    termsErrorText: { textAlign: "left", marginLeft: 0 },
    formErrorText: { textAlign: "center", marginVertical: 8, fontSize: 14 },
    termsContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginVertical: 12,
    },
    checkboxWrapper: {
        marginRight: 10,
        marginTop: 1,
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
