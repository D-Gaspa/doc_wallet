import { BiometricAuthService } from "./biometricAuth"
import { PinAuthService } from "./pinAuth"
import { GoogleAuthService } from "./googleAuth"
import { TokenService } from "./tokenService"
import { IUser } from "../../types/user"
import { AuthMethod } from "../../types/auth"
import { LoggingService } from "../monitoring/loggingService"
import { PerformanceMonitoringService } from "../monitoring/performanceMonitoringService"

export class AuthService {
    private biometricAuth: BiometricAuthService
    private pinAuth: PinAuthService
    private logger = LoggingService.getLogger("AuthService")

    constructor() {
        this.biometricAuth = new BiometricAuthService()
        this.pinAuth = new PinAuthService()
        this.logger.debug("AuthService initialized")
    }

    async authenticate(
        method: AuthMethod,
        authData?: { pin?: string }
    ): Promise<IUser | null> {
        PerformanceMonitoringService.startMeasure(`auth_${method}`)
        this.logger.info(`Authentication attempt with method: ${method}`)

        try {
            switch (method) {
                case AuthMethod.BIOMETRIC: {
                    this.logger.debug("Attempting biometric authentication")
                    const biometricSuccess =
                        await this.biometricAuth.authenticateWithBiometrics()
                    if (biometricSuccess) {
                        this.logger.info("Biometric authentication successful")
                        const userData = await TokenService.getUserData()
                        PerformanceMonitoringService.endMeasure(
                            `auth_${method}`
                        )
                        return userData
                    }
                    this.logger.warn("Biometric authentication failed")
                    PerformanceMonitoringService.endMeasure(`auth_${method}`)
                    return null
                }

                case AuthMethod.PIN: {
                    const pin = authData?.pin
                    if (!pin) {
                        this.logger.warn(
                            "PIN authentication attempted without a PIN"
                        )
                        PerformanceMonitoringService.endMeasure(
                            `auth_${method}`
                        )
                        return null
                    }

                    this.logger.debug("Attempting PIN authentication")
                    const pinSuccess = await this.pinAuth.verifyPin(pin)
                    if (pinSuccess) {
                        this.logger.info("PIN authentication successful")
                        const userData = await TokenService.getUserData()
                        PerformanceMonitoringService.endMeasure(
                            `auth_${method}`
                        )
                        return userData
                    }
                    this.logger.warn("PIN authentication failed")
                    PerformanceMonitoringService.endMeasure(`auth_${method}`)
                    return null
                }

                case AuthMethod.GOOGLE:
                    try {
                        this.logger.debug("Attempting Google authentication")
                        const authResponse = await GoogleAuthService.signIn()
                        const user: IUser = {
                            id: authResponse.user.id,
                            name: authResponse.user.name || "User",
                            email: authResponse.user.email,
                        }

                        this.logger.info("Google authentication successful", {
                            userId: user.id,
                            email: user.email,
                        })

                        await TokenService.storeUserData(user)
                        PerformanceMonitoringService.endMeasure(
                            `auth_${method}`
                        )
                        return user
                    } catch (error) {
                        this.logger.error(
                            "Google authentication failed:",
                            error
                        )
                        PerformanceMonitoringService.endMeasure(
                            `auth_${method}`
                        )
                        return null
                    }

                default:
                    this.logger.warn(
                        `Unsupported authentication method: ${method}`
                    )
                    PerformanceMonitoringService.endMeasure(`auth_${method}`)
                    return null
            }
        } catch (error) {
            this.logger.error(`Error during ${method} authentication:`, error)
            PerformanceMonitoringService.endMeasure(`auth_${method}`)
            return null
        }
    }

    async isBiometricAvailable(): Promise<boolean> {
        try {
            const result = await this.biometricAuth.isBiometricsAvailable()
            this.logger.debug("Biometric availability checked", {
                isAvailable: result,
            })
            return result
        } catch (error) {
            this.logger.error("Error checking biometric availability:", error)
            return false
        }
    }

    async isPinSet(): Promise<boolean> {
        try {
            const result = await this.pinAuth.isPinSet()
            this.logger.debug("PIN status checked", { isSet: result })
            return result
        } catch (error) {
            this.logger.error("Error checking if PIN is set:", error)
            return false
        }
    }

    async setupPin(pin: string): Promise<boolean> {
        try {
            this.logger.info("Setting up new PIN")
            const result = await this.pinAuth.createPin(pin)
            if (result) {
                this.logger.info("PIN setup successful")
            } else {
                this.logger.warn("PIN setup failed")
            }
            return result
        } catch (error) {
            this.logger.error("Error during PIN setup:", error)
            return false
        }
    }

    async getPreferredAuthMethod(): Promise<AuthMethod> {
        try {
            const biometricAvailable = await this.isBiometricAvailable()
            if (biometricAvailable) {
                this.logger.debug("Preferred auth method: Biometric")
                return AuthMethod.BIOMETRIC
            }

            const isPinSet = await this.isPinSet()
            if (isPinSet) {
                this.logger.debug("Preferred auth method: PIN")
                return AuthMethod.PIN
            }

            this.logger.debug("Preferred auth method: Google")
            return AuthMethod.GOOGLE
        } catch (error) {
            this.logger.error("Error determining preferred auth method:", error)
            // Default to Google as fallback
            return AuthMethod.GOOGLE
        }
    }
}
