import {
    authenticateAsync,
    hasHardwareAsync,
    isEnrolledAsync,
} from "expo-local-authentication"

export class BiometricAuthService {
    async isBiometricsAvailable(): Promise<boolean> {
        try {
            const hasHardware = await hasHardwareAsync()
            const isEnrolled = await isEnrolledAsync()
            return hasHardware && isEnrolled
        } catch (error) {
            console.error("Error checking biometric availability:", error)
            return false
        }
    }

    async authenticateWithBiometrics(
        promptMessage: string = "Authenticate to access your documents"
    ): Promise<boolean> {
        try {
            const result = await authenticateAsync({
                promptMessage,
                fallbackLabel: "Use PIN", // Custom fallback label
                disableDeviceFallback: false, // Allow device passcode fallback
            })

            return result.success
        } catch (error) {
            console.error("Biometric authentication error:", error)
            return false
        }
    }
}
