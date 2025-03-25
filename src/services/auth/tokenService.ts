import * as Keychain from "react-native-keychain"
import { ITokens } from "../../types/auth.ts"
import { IUser } from "../../types/user.ts"
import { LoggingService } from "../monitoring/loggingService"
import { PerformanceMonitoringService } from "../monitoring/performanceMonitoringService"

const logger = LoggingService.getLogger("TokenService")

export const TokenService = {
    storeTokens: async (tokens: ITokens): Promise<boolean> => {
        PerformanceMonitoringService.startMeasure("store_tokens")
        try {
            logger.debug("Storing authentication tokens")
            await Keychain.setGenericPassword(
                "doc_wallet_auth_tokens",
                JSON.stringify(tokens),
                {
                    service: "com.doc_wallet.auth",
                    accessControl:
                        Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
                    accessible:
                        Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                },
            )
            logger.debug("Tokens stored successfully")
            PerformanceMonitoringService.endMeasure("store_tokens")
            return true
        } catch (error) {
            logger.error("Error storing authentication tokens:", error)
            PerformanceMonitoringService.endMeasure("store_tokens")
            return false
        }
    },

    getTokens: async (): Promise<ITokens | null> => {
        try {
            logger.debug("Retrieving authentication tokens")
            const credentials = await Keychain.getGenericPassword({
                service: "com.doc_wallet.auth",
            })

            if (credentials) {
                logger.debug("Tokens retrieved successfully")
                return JSON.parse(credentials.password) as ITokens
            }
            logger.debug("No tokens found")
            return null
        } catch (error) {
            logger.error("Error retrieving authentication tokens:", error)
            return null
        }
    },

    clearTokens: async (): Promise<boolean> => {
        try {
            logger.debug("Clearing authentication tokens")
            await Keychain.resetGenericPassword({
                service: "com.doc_wallet.auth",
            })
            logger.debug("Tokens cleared successfully")
            return true
        } catch (error) {
            logger.error("Error clearing authentication tokens:", error)
            return false
        }
    },

    isTokenValid: async (): Promise<boolean> => {
        try {
            logger.debug("Checking token validity")
            const tokens = await TokenService.getTokens()
            if (!tokens) {
                logger.debug("No tokens found, considering invalid")
                return false
            }

            const currentTime = Date.now()
            const isValid = tokens.expiresAt > currentTime + 5 * 60 * 1000
            logger.debug("Token validity checked", {
                isValid,
                expiresInMinutes: Math.floor(
                    (tokens.expiresAt - currentTime) / 60000,
                ),
            })
            return isValid
        } catch (error) {
            logger.error("Error validating token:", error)
            return false
        }
    },

    getUserData: async (): Promise<IUser | null> => {
        try {
            logger.debug("Retrieving user data")
            const credentials = await Keychain.getGenericPassword({
                service: "com.doc_wallet.auth.user_data",
            })

            if (credentials) {
                logger.debug("User data retrieved successfully")
                return JSON.parse(credentials.password) as IUser
            }
            logger.debug("No user data found")
            return null
        } catch (error) {
            logger.error("Error retrieving user data:", error)
            return null
        }
    },

    storeUserData: async (user: IUser): Promise<boolean> => {
        try {
            logger.debug("Storing user data", {
                userId: user.id,
                email: user.email,
            })
            await Keychain.setGenericPassword(
                "doc_wallet_user_data",
                JSON.stringify(user),
                {
                    service: "com.doc_wallet.auth.user_data",
                    accessible:
                        Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                },
            )
            logger.debug("User data stored successfully")
            return true
        } catch (error) {
            logger.error("Error storing user data:", error)
            return false
        }
    },

    clearUserData: async (): Promise<boolean> => {
        try {
            logger.debug("Clearing user data")
            await Keychain.resetGenericPassword({
                service: "com.doc_wallet.auth.user_data",
            })
            logger.debug("User data cleared successfully")
            return true
        } catch (error) {
            logger.error("Error clearing user data:", error)
            return false
        }
    },
}
