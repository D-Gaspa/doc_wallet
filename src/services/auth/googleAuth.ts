// src/services/auth/googleAuth.ts
import { Platform } from "react-native"
import {
    authorize,
    prefetchConfiguration,
    refresh,
    revoke,
} from "react-native-app-auth"
import { TokenService } from "./tokenService.ts"
import { jwtDecode } from "jwt-decode"
import { IGoogleUser } from "../../types/user.ts"
import { IGoogleAuthResponse, IJwtPayload } from "../../types/auth.ts"
import Config from "react-native-config"
import { LoggingService } from "../monitoring/loggingService"
import { PerformanceMonitoringService } from "../monitoring/performanceMonitoringService"

const logger = LoggingService.getLogger("GoogleAuth")
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
                logger.error(`Missing Google client ID for ${Platform.OS}`)
                return
            }

            logger.debug("Preloading Google authentication configuration")
            await prefetchConfiguration({
                warmAndPrefetchChrome: true,
                ...googleConfig,
            })
            logger.debug("Google configuration preloaded successfully")
        } catch (error) {
            logger.error("Failed to preload Google configuration", error)
        }
    },

    getUserFromIdToken: (idToken: string): IGoogleUser => {
        try {
            logger.debug("Decoding user information from ID token")
            const decodedToken = jwtDecode<IJwtPayload>(idToken)

            return {
                id: decodedToken.sub,
                name: decodedToken.name ?? undefined,
                email: decodedToken.email,
                photo: decodedToken.picture ?? undefined,
            }
        } catch (error) {
            logger.error("Error decoding ID token", error)
            throw new Error("Failed to decode user information from token")
        }
    },

    signIn: async (): Promise<IGoogleAuthResponse> => {
        PerformanceMonitoringService.startMeasure("google_sign_in")
        try {
            logger.info("Initiating Google sign-in")
            // Perform authorization request
            const result = await authorize(googleConfig)

            // Get user info from ID token
            const user = GoogleAuthService.getUserFromIdToken(result.idToken)
            logger.info("Google authorization successful", {
                email: user.email,
            })

            const expiresAt = new Date(
                result.accessTokenExpirationDate,
            ).getTime()

            await TokenService.storeTokens({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken || "", // May be empty if not requesting offline access
                expiresAt,
            })

            PerformanceMonitoringService.endMeasure("google_sign_in")
            return {
                user,
                tokens: {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken || "",
                    expiresAt,
                },
            }
        } catch (error) {
            logger.error("Google sign in error:", error)
            PerformanceMonitoringService.endMeasure("google_sign_in")
            throw new Error("Google sign in failed")
        }
    },

    signOut: async (): Promise<void> => {
        try {
            logger.info("Initiating Google sign-out")
            const tokens = await TokenService.getTokens()

            if (tokens) {
                await revoke(googleConfig, {
                    tokenToRevoke: tokens.accessToken,
                    includeBasicAuth: true,
                })
                logger.info("Google token revoked successfully")
            }

            await TokenService.clearTokens()
            logger.info("Google sign-out completed")
        } catch (error) {
            logger.error("Google sign out error:", error)
            // Still clear local tokens even if revoke fails
            await TokenService.clearTokens()
        }
    },

    refreshAccessToken: async (): Promise<boolean> => {
        PerformanceMonitoringService.startMeasure("token_refresh")
        try {
            logger.debug("Refreshing Google access token")
            const tokens = await TokenService.getTokens()

            if (!tokens || !tokens.refreshToken) {
                logger.warn("No refresh token available, cannot refresh")
                return false
            }

            const result = await refresh(googleConfig, {
                refreshToken: tokens.refreshToken,
            })

            const expiresAt = new Date(
                result.accessTokenExpirationDate,
            ).getTime()

            await TokenService.storeTokens({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken || tokens.refreshToken, // Keep old refresh token if not provided
                expiresAt,
            })

            logger.info("Google token refreshed successfully")
            PerformanceMonitoringService.endMeasure("token_refresh")
            return true
        } catch (error) {
            logger.error("Error refreshing Google token:", error)
            PerformanceMonitoringService.endMeasure("token_refresh")
            return false
        }
    },

    isAuthenticated: async (): Promise<boolean> => {
        try {
            const isValid = await TokenService.isTokenValid()
            logger.debug("Google authentication status checked", {
                isAuthenticated: isValid,
            })
            return isValid
        } catch (error) {
            logger.error("Error checking Google authentication status:", error)
            return false
        }
    },

    getCurrentUser: async (): Promise<IGoogleUser | null> => {
        try {
            const tokens = await TokenService.getTokens()
            const isValid = await TokenService.isTokenValid()

            if (!tokens || !isValid) {
                logger.debug("No valid tokens, cannot get current user")
                return null
            }

            // Get user info from Google API
            try {
                logger.debug("Requesting user info from Google API")
                const response = await fetch(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    {
                        headers: {
                            Authorization: `Bearer ${tokens.accessToken}`,
                        },
                    },
                )

                if (response.ok) {
                    const userData = await response.json()
                    logger.debug("User info retrieved successfully")
                    return {
                        id: userData.sub,
                        name: userData.name || null,
                        email: userData.email,
                        photo: userData.picture || null,
                    }
                } else {
                    logger.error(
                        "Failed to get user info from Google API",
                        await response.text(),
                    )
                    return null
                }
            } catch (error) {
                logger.error("Error getting user info from Google API:", error)
                return null
            }
        } catch (error) {
            logger.error("Error getting current Google user:", error)
            return null
        }
    },
}
