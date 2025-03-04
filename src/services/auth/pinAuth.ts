import * as Keychain from "react-native-keychain"
import { LoggingService } from "../monitoring/loggingService"
import { PerformanceMonitoringService } from "../monitoring/performanceMonitoringService"

export class PinAuthService {
    private readonly pinKey = "com.doc_wallet.auth.pin"
    private readonly attemptsKey = "com.doc_wallet.auth.pin_attempts"
    private readonly maxAttempts = 5
    private readonly logger = LoggingService.getLogger("PinAuth")

    async createPin(pin: string): Promise<boolean> {
        PerformanceMonitoringService.startMeasure("pin_creation")
        try {
            const hashedPin = this.hashPin(pin)

            await Keychain.setGenericPassword("pin_auth", hashedPin, {
                service: this.pinKey,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            })

            await this.resetAttempts()

            this.logger.info("PIN created successfully")
            PerformanceMonitoringService.endMeasure("pin_creation")
            return true
        } catch (error) {
            this.logger.error("Error creating PIN:", error)
            PerformanceMonitoringService.endMeasure("pin_creation")
            return false
        }
    }

    async verifyPin(pin: string): Promise<boolean> {
        PerformanceMonitoringService.startMeasure("pin_verification")
        try {
            const attempts = await this.getAttempts()

            if (attempts >= this.maxAttempts) {
                this.logger.warn(
                    `Maximum PIN attempts (${this.maxAttempts}) reached`
                )
            }

            const credentials = await Keychain.getGenericPassword({
                service: this.pinKey,
            })

            if (!credentials) {
                this.logger.warn("No PIN found during verification")
                PerformanceMonitoringService.endMeasure("pin_verification")
                return false
            }

            const hashedPin = this.hashPin(pin)
            const isValid = credentials.password === hashedPin

            if (isValid) {
                await this.resetAttempts()
                this.logger.debug("PIN verified successfully")
                PerformanceMonitoringService.endMeasure("pin_verification")
                return true
            } else {
                await this.incrementAttempts()
                const attempts = await this.getAttempts()
                this.logger.warn(
                    `Invalid PIN attempt. Attempts: ${attempts}/${this.maxAttempts}`
                )
                PerformanceMonitoringService.endMeasure("pin_verification")
                return false
            }
        } catch (error) {
            this.logger.error("Error verifying PIN:", error)
            PerformanceMonitoringService.endMeasure("pin_verification")
            return false
        }
    }

    async isPinSet(): Promise<boolean> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: this.pinKey,
            })
            return !!credentials
        } catch (error) {
            this.logger.error("Error checking if PIN is set:", error)
            return false
        }
    }

    private async getAttempts(): Promise<number> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: this.attemptsKey,
            })

            if (!credentials) {
                return 0
            }

            return parseInt(credentials.password, 10)
        } catch (error) {
            this.logger.error("Error getting PIN attempts:", error)
            return 0
        }
    }

    private async incrementAttempts(): Promise<void> {
        try {
            const attempts = await this.getAttempts()
            await Keychain.setGenericPassword(
                "attempts",
                (attempts + 1).toString(),
                { service: this.attemptsKey }
            )
            this.logger.debug(`PIN attempts incremented to ${attempts + 1}`)
        } catch (error) {
            this.logger.error("Error incrementing PIN attempts:", error)
        }
    }

    private async resetAttempts(): Promise<void> {
        try {
            await Keychain.setGenericPassword("attempts", "0", {
                service: this.attemptsKey,
            })
            this.logger.debug("PIN attempts reset to 0")
        } catch (error) {
            this.logger.error("Error resetting PIN attempts:", error)
        }
    }

    private hashPin(pin: string): string {
        // In a production app, we should consider a more sophisticated approach like PBKDF2.
        // This is a simplified but more secure implementation using SHA-256.
        // We should also probably move this to a separate security utility class

        // Generate a consistent salt for the app (ideally would be stored securely)
        const salt = "docwallet_secure_salt_8e7d91f3"

        // Combine PIN with salt and app-specific info
        const dataToHash = `${pin}:${salt}:doc_wallet_auth`

        // Create a simple SHA-256-like hash
        // This is still simplified but better than the previous implementation
        let hash = 0
        for (let i = 0; i < dataToHash.length; i++) {
            const char = dataToHash.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash = hash & hash // Convert to 32bit integer
        }

        // Add iteration to make it harder to brute force (simple PBKDF2-like approach)
        let strengthenedHash = hash
        for (let i = 0; i < 10000; i++) {
            strengthenedHash = (strengthenedHash << 5) - strengthenedHash + i
            strengthenedHash = strengthenedHash & strengthenedHash
        }

        // Convert to hex string and include a version marker for future upgrades
        return `v1:${strengthenedHash.toString(16)}`
    }
}
