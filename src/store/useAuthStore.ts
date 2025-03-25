import { create } from "zustand"
import { AuthMethod, IAuthState } from "../types/auth"
import type { IUser } from "../types/user"
import { GoogleAuthService } from "../services/auth/googleAuth.ts"
import { AuthService } from "../services/auth/authService"
import { TokenService } from "../services/auth/tokenService"
import { LoggingService } from "../services/monitoring/loggingService"
import { PerformanceMonitoringService } from "../services/monitoring/performanceMonitoringService"
import { ErrorTrackingService } from "../services/monitoring/errorTrackingService"

const authService = new AuthService()
const logger = LoggingService.getLogger("AuthStore")

export const useAuthStore = create<IAuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    preferredAuthMethod: AuthMethod.PIN,

    login: async (pin?: string) => {
        PerformanceMonitoringService.startMeasure("login_flow")
        try {
            logger.info("Login process started")
            set({ isLoading: true })

            const preferredMethod = await authService.getPreferredAuthMethod()
            logger.debug(`Using preferred auth method: ${preferredMethod}`)

            let user: IUser | null

            if (preferredMethod === AuthMethod.BIOMETRIC) {
                user = await authService.authenticate(AuthMethod.BIOMETRIC)
                if (!user && pin) {
                    logger.debug("Biometric auth failed, trying PIN fallback")
                    user = await authService.authenticate(AuthMethod.PIN, {
                        pin,
                    })
                }
            } else if (preferredMethod === AuthMethod.PIN) {
                if (!pin) {
                    logger.warn("PIN required but not provided")
                }
                user = await authService.authenticate(AuthMethod.PIN, { pin })
            } else {
                user = await authService.authenticate(AuthMethod.GOOGLE)
            }

            if (!user) {
                logger.warn("Authentication failed - no user returned")
            }

            logger.info("Login successful", {
                userId: user?.id,
                email: user?.email,
            })
            set({
                user,
                isAuthenticated: true,
                isLoading: false,
                preferredAuthMethod: preferredMethod,
            })
            PerformanceMonitoringService.endMeasure("login_flow")
        } catch (error) {
            logger.error("Login failed:", error)
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            })
            PerformanceMonitoringService.endMeasure("login_flow")
            throw error
        }
    },

    logout: async () => {
        try {
            logger.info("Logout process started")
            set({ isLoading: true })

            await GoogleAuthService.signOut()
            await TokenService.clearUserData?.()

            logger.info("Logout successful")
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            })
        } catch (error) {
            logger.error("Logout failed:", error)
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            })
        }
    },

    checkAuthStatus: async () => {
        PerformanceMonitoringService.startMeasure("auth_status_check")
        try {
            logger.debug("Checking authentication status")
            // First check for stored user data (for PIN/biometric auth)
            const userData = await TokenService.getUserData?.()

            // Then check Google auth status
            const isGoogleAuthenticated =
                await GoogleAuthService.isAuthenticated()

            if (isGoogleAuthenticated) {
                logger.debug("Google authentication is valid")
                const googleUser = await GoogleAuthService.getCurrentUser()

                if (googleUser) {
                    const user: IUser = {
                        id: googleUser.id,
                        name: googleUser.name || "User",
                        email: googleUser.email,
                    }

                    logger.info("User authenticated via Google", {
                        email: user.email,
                    })
                    // Store user data for PIN/biometric auth
                    await TokenService.storeUserData?.(user)

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        preferredAuthMethod: AuthMethod.GOOGLE,
                    })
                    PerformanceMonitoringService.endMeasure("auth_status_check")
                    return
                }
            } else if (userData) {
                logger.debug("Local authentication data found")
                const isPinSet = await authService.isPinSet()
                const isBiometricAvailable =
                    await authService.isBiometricAvailable()

                const preferredMethod = isBiometricAvailable
                    ? AuthMethod.BIOMETRIC
                    : isPinSet
                      ? AuthMethod.PIN
                      : AuthMethod.GOOGLE

                logger.info("User authenticated via local auth data", {
                    email: userData.email,
                })
                set({
                    user: userData,
                    isAuthenticated: true,
                    isLoading: false,
                    preferredAuthMethod: preferredMethod,
                })
                PerformanceMonitoringService.endMeasure("auth_status_check")
                return
            }

            logger.debug("No valid authentication found")
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            })
            PerformanceMonitoringService.endMeasure("auth_status_check")
        } catch (error) {
            logger.error("Auth check failed:", error)
            await ErrorTrackingService.handleError(
                new Error(
                    `Auth check error: ${
                        error instanceof Error ? error.message : String(error)
                    }`,
                ),
            )
            set({ user: null, isAuthenticated: false })
            PerformanceMonitoringService.endMeasure("auth_status_check")
        } finally {
            set({ isLoading: false })
        }
    },

    setupPin: async (pin: string) => {
        try {
            logger.info("Setting up PIN")
            set({ isLoading: true })
            const success = await authService.setupPin(pin)
            if (success) {
                logger.info("PIN setup successful")
                set({ preferredAuthMethod: AuthMethod.PIN })
            } else {
                logger.warn("PIN setup failed")
            }
            return success
        } catch (error) {
            logger.error("PIN setup failed:", error)
            return false
        } finally {
            set({ isLoading: false })
        }
    },
}))
