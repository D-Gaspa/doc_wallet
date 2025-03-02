import { Platform } from "react-native"
import {
    authorize,
    refresh,
    revoke,
    prefetchConfiguration,
} from "react-native-app-auth"
import { TokenService } from "./token"
import { jwtDecode } from "jwt-decode"
import { IGoogleUser } from "../../types/user.ts"
import { IGoogleAuthResponse, IJwtPayload } from "../../types/auth.ts"
import Config from "react-native-config"

const clientIdIOS = Config.GOOGLE_CLIENT_ID_IOS
const clientIdAndroid = Config.GOOGLE_CLIENT_ID_ANDROID

export const googleConfig = {
    issuer: "https://accounts.google.com",
    clientId: Platform.OS === "ios" ? clientIdIOS! : clientIdAndroid!,
    redirectUrl:
        Platform.OS === "ios"
            ? "not set"
            : Config.GOOGLE_REDIRECT_URL ||
              `com.${Config.APP_NAME}:/oauth2redirect/google`,
    scopes: ["openid", "profile", "email"],
    serviceConfiguration: {
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://www.googleapis.com/oauth2/v4/token",
        revocationEndpoint: "https://oauth2.googleapis.com/revoke",
    },
}

export const GoogleAuthService = {
    preloadConfig: async () => {
        try {
            if (!googleConfig.clientId) {
                console.error(`Missing Google client ID for ${Platform.OS}`)
                return
            }

            await prefetchConfiguration({
                warmAndPrefetchChrome: true,
                ...googleConfig,
            })
        } catch (error) {
            console.error("Failed to preload configuration", error)
        }
    },

    getUserFromIdToken: (idToken: string): IGoogleUser => {
        try {
            const decodedToken = jwtDecode<IJwtPayload>(idToken)

            return {
                id: decodedToken.sub,
                name: decodedToken.name || null,
                email: decodedToken.email,
                photo: decodedToken.picture || null,
            }
        } catch (error) {
            console.error("Error decoding ID token", error)
            throw new Error("Failed to decode user information from token")
        }
    },

    signIn: async (): Promise<IGoogleAuthResponse> => {
        try {
            // Perform authorization request
            const result = await authorize(googleConfig)

            // Get user info from ID token
            const user = GoogleAuthService.getUserFromIdToken(result.idToken)

            const expiresAt = new Date(
                result.accessTokenExpirationDate
            ).getTime()

            await TokenService.storeTokens({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken || "", // May be empty if not requesting offline access
                expiresAt,
            })

            return {
                user,
                tokens: {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken || "",
                    expiresAt,
                },
            }
        } catch (error) {
            console.error("Google sign in error:", error)
            throw new Error("Google sign in failed")
        }
    },

    signOut: async (): Promise<void> => {
        try {
            const tokens = await TokenService.getTokens()

            if (tokens) {
                await revoke(googleConfig, {
                    tokenToRevoke: tokens.accessToken,
                    includeBasicAuth: true,
                })
            }

            await TokenService.clearTokens()
        } catch (error) {
            console.error("Sign out error:", error)
            // Still clear local tokens even if revoke fails
            await TokenService.clearTokens()
        }
    },

    refreshAccessToken: async (): Promise<boolean> => {
        try {
            const tokens = await TokenService.getTokens()

            if (!tokens || !tokens.refreshToken) {
                return false
            }

            const result = await refresh(googleConfig, {
                refreshToken: tokens.refreshToken,
            })

            const expiresAt = new Date(
                result.accessTokenExpirationDate
            ).getTime()

            await TokenService.storeTokens({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken || tokens.refreshToken, // Keep old refresh token if not provided
                expiresAt,
            })

            return true
        } catch (error) {
            console.error("Error refreshing token:", error)
            return false
        }
    },

    isAuthenticated: async (): Promise<boolean> => {
        try {
            return await TokenService.isTokenValid()
        } catch (error) {
            console.error("Error checking authentication:", error)
            return false
        }
    },

    getCurrentUser: async (): Promise<IGoogleUser | null> => {
        try {
            const tokens = await TokenService.getTokens()
            const isValid = await TokenService.isTokenValid()

            if (!tokens || !isValid) {
                return null
            }

            // TODO: Check request of user info
            try {
                const response = await fetch(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    {
                        headers: {
                            Authorization: `Bearer ${tokens.accessToken}`,
                        },
                    }
                )

                if (response.ok) {
                    const userData = await response.json()
                    return {
                        id: userData.sub,
                        name: userData.name || null,
                        email: userData.email,
                        photo: userData.picture || null,
                    }
                } else {
                    console.error(
                        "Failed to get user info:",
                        await response.text()
                    )
                    return null
                }
            } catch (error) {
                console.error("Error getting user info:", error)
                return null
            }
        } catch (error) {
            console.error("Error getting current user:", error)
            return null
        }
    },
}
