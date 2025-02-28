import * as Keychain from "react-native-keychain"
import { ITokens } from "../../types/auth.ts"

export const TokenService = {
    storeTokens: async (tokens: ITokens): Promise<boolean> => {
        try {
            // Store tokens in the secure keychain
            await Keychain.setGenericPassword(
                "doc_wallet_auth_tokens",
                JSON.stringify(tokens),
                {
                    service: "com.doc_wallet.auth",
                    accessControl:
                        Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
                    accessible:
                        Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                }
            )
            return true
        } catch (error) {
            console.error("Error storing tokens:", error)
            return false
        }
    },

    getTokens: async (): Promise<ITokens | null> => {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: "com.doc_wallet.auth",
            })

            if (credentials) {
                return JSON.parse(credentials.password) as ITokens
            }
            return null
        } catch (error) {
            console.error("Error retrieving tokens:", error)
            return null
        }
    },

    clearTokens: async (): Promise<boolean> => {
        try {
            await Keychain.resetGenericPassword({
                service: "com.doc_wallet.auth",
            })
            return true
        } catch (error) {
            console.error("Error clearing tokens:", error)
            return false
        }
    },

    isTokenValid: async (): Promise<boolean> => {
        try {
            const tokens = await TokenService.getTokens()
            if (!tokens) return false

            // Checks if token is expired (with 5 min buffer)
            const currentTime = Date.now()
            return tokens.expiresAt > currentTime + 5 * 60 * 1000
        } catch (error) {
            console.error("Error validating token:", error)
            return false
        }
    },
}
