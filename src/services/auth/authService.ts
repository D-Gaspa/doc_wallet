import { BiometricAuthService } from "./biometricAuth"
import { PinAuthService } from "./pinAuth"
import { GoogleAuthService } from "./googleAuth"
import { TokenService } from "./token"
import { IUser } from "../../types/user"
import { AuthMethod } from "../../types/auth"

export class AuthService {
    private biometricAuth: BiometricAuthService
    private pinAuth: PinAuthService

    constructor() {
        this.biometricAuth = new BiometricAuthService()
        this.pinAuth = new PinAuthService()
    }

    async authenticate(
        method: AuthMethod,
        authData?: { pin?: string }
    ): Promise<IUser | null> {
        switch (method) {
            case AuthMethod.BIOMETRIC: {
                const biometricSuccess =
                    await this.biometricAuth.authenticateWithBiometrics()
                if (biometricSuccess) {
                    return await TokenService.getUserData()
                }
                return null
            }

            case AuthMethod.PIN: {
                const pin = authData?.pin
                if (!pin) return null

                const pinSuccess = await this.pinAuth.verifyPin(pin)
                if (pinSuccess) {
                    return await TokenService.getUserData()
                }
                return null
            }

            case AuthMethod.GOOGLE:
                try {
                    const authResponse = await GoogleAuthService.signIn()
                    const user: IUser = {
                        id: authResponse.user.id,
                        name: authResponse.user.name || "User",
                        email: authResponse.user.email,
                    }

                    await TokenService.storeUserData(user)

                    return user
                } catch (error) {
                    console.error("Google authentication failed:", error)
                    return null
                }

            default:
                return null
        }
    }

    async isBiometricAvailable(): Promise<boolean> {
        return await this.biometricAuth.isBiometricsAvailable()
    }

    async isPinSet(): Promise<boolean> {
        return await this.pinAuth.isPinSet()
    }

    async setupPin(pin: string): Promise<boolean> {
        return await this.pinAuth.createPin(pin)
    }

    async getPreferredAuthMethod(): Promise<AuthMethod> {
        const biometricAvailable = await this.isBiometricAvailable()
        if (biometricAvailable) {
            return AuthMethod.BIOMETRIC
        }

        const isPinSet = await this.isPinSet()
        if (isPinSet) {
            return AuthMethod.PIN
        }

        return AuthMethod.GOOGLE
    }
}
