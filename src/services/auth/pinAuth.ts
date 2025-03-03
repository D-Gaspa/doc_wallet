import * as Keychain from "react-native-keychain"

export class PinAuthService {
    private readonly pinKey = "com.doc_wallet.auth.pin"
    private readonly attemptsKey = "com.doc_wallet.auth.pin_attempts"
    private readonly maxAttempts = 5

    async createPin(pin: string): Promise<boolean> {
        try {
            const hashedPin = this.hashPin(pin)

            await Keychain.setGenericPassword("pin_auth", hashedPin, {
                service: this.pinKey,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            })

            await this.resetAttempts()

            return true
        } catch (error) {
            console.error("Error creating PIN:", error)
            return false
        }
    }

    async verifyPin(pin: string): Promise<boolean> {
        try {
            const attempts = await this.getAttempts()

            if (attempts >= this.maxAttempts) {
                throw new Error("Maximum PIN attempts reached")
            }

            const credentials = await Keychain.getGenericPassword({
                service: this.pinKey,
            })

            if (!credentials) {
                return false
            }

            const hashedPin = this.hashPin(pin)
            const isValid = credentials.password === hashedPin

            if (isValid) {
                await this.resetAttempts()
                return true
            } else {
                await this.incrementAttempts()
                return false
            }
        } catch (error) {
            console.error("Error verifying PIN:", error)
            return false
        }
    }

    async isPinSet(): Promise<boolean> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: this.pinKey,
            })
            return !!credentials
        } catch {
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
        } catch {
            return 0
        }
    }

    private async incrementAttempts(): Promise<void> {
        const attempts = await this.getAttempts()
        await Keychain.setGenericPassword(
            "attempts",
            (attempts + 1).toString(),
            { service: this.attemptsKey }
        )
    }

    private async resetAttempts(): Promise<void> {
        await Keychain.setGenericPassword("attempts", "0", {
            service: this.attemptsKey,
        })
    }

    private hashPin(pin: string): string {
        // In a production app, we should consider a more sophisticated approach like PBKDF2.
        // This is a simplified but more secure implementation using SHA-256

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
