import {
    authenticateAsync,
    hasHardwareAsync,
    isEnrolledAsync,
} from "expo-local-authentication"
import { LoggingService } from "../monitoring/loggingService"
import { PerformanceMonitoringService } from "../monitoring/performanceMonitoringService"

export class BiometricAuthService {
    private readonly logger = LoggingService.getLogger("BiometricAuth")

    async isBiometricsAvailable(): Promise<boolean> {
        try {
            const hasHardware = await hasHardwareAsync()
            const isEnrolled = await isEnrolledAsync()

            if (!hasHardware) {
                this.logger.info(
                    "Biometric hardware not available on this device",
                )
                return false
            }

            if (!isEnrolled) {
                this.logger.info(
                    "Biometrics available but not enrolled on this device",
                )
                return false
            }

            this.logger.debug("Biometric authentication is available")
            return true
        } catch (error) {
            this.logger.error("Error checking biometric availability:", error)
            return false
        }
    }

    async authenticateWithBiometrics(
        promptMessage: string = "Authenticate to access your documents",
    ): Promise<boolean> {
        PerformanceMonitoringService.startMeasure("biometric_auth")
        try {
            this.logger.debug("Initiating biometric authentication")
            const result = await authenticateAsync({
                promptMessage,
                fallbackLabel: "Use PIN", // Custom fallback label
                disableDeviceFallback: false, // Allow device passcode fallback
            })

            if (result.success) {
                this.logger.info("Biometric authentication successful")
            } else {
                this.logger.warn("Biometric authentication failed", {
                    error: result.error,
                    warning: result.warning,
                })
            }

            PerformanceMonitoringService.endMeasure("biometric_auth")
            return result.success
        } catch (error) {
            this.logger.error("Biometric authentication error:", error)
            PerformanceMonitoringService.endMeasure("biometric_auth")
            return false
        }
    }
}
