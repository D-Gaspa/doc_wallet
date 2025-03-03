import { create } from "zustand"
import { AuthMethod, IAuthState } from "../types/auth"
import type { IUser } from "../types/user"
import { GoogleAuthService } from "../services/auth/googleAuth.ts"
import { AuthService } from "../services/auth/authService"
import { TokenService } from "../services/auth/token"

const authService = new AuthService()

export const useAuthStore = create<IAuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    preferredAuthMethod: AuthMethod.PIN,

    login: async (pin?: string) => {
        try {
            set({ isLoading: true })

            const preferredMethod = await authService.getPreferredAuthMethod()
            let user: IUser | null = null

            if (preferredMethod === AuthMethod.BIOMETRIC) {
                user = await authService.authenticate(AuthMethod.BIOMETRIC)
                if (!user && pin) {
                    user = await authService.authenticate(AuthMethod.PIN, {
                        pin,
                    })
                }
            } else if (preferredMethod === AuthMethod.PIN) {
                if (!pin) {
                    throw new Error("PIN required")
                }
                user = await authService.authenticate(AuthMethod.PIN, { pin })
            } else {
                user = await authService.authenticate(AuthMethod.GOOGLE)
            }

            if (!user) {
                throw new Error("Authentication failed")
            }

            set({
                user,
                isAuthenticated: true,
                isLoading: false,
                preferredAuthMethod: preferredMethod,
            })
        } catch (error) {
            console.error("Login failed:", error)
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            })
            throw error
        }
    },

    logout: async () => {
        try {
            set({ isLoading: true })

            await GoogleAuthService.signOut()
            await TokenService.clearUserData?.()

            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            })
        } catch (error) {
            console.error("Logout failed:", error)
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            })
        }
    },

    checkAuthStatus: async () => {
        try {
            // First check for stored user data (for PIN/biometric auth)
            const userData = await TokenService.getUserData?.()

            // Then check Google auth status
            const isGoogleAuthenticated =
                await GoogleAuthService.isAuthenticated()
            if (isGoogleAuthenticated) {
                const googleUser = await GoogleAuthService.getCurrentUser()

                if (googleUser) {
                    const user: IUser = {
                        id: googleUser.id,
                        name: googleUser.name || "User",
                        email: googleUser.email,
                    }

                    // Store user data for PIN/biometric auth
                    await TokenService.storeUserData?.(user)

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        preferredAuthMethod: AuthMethod.GOOGLE,
                    })
                    return
                }
            } else if (userData) {
                const isPinSet = await authService.isPinSet()
                const isBiometricAvailable =
                    await authService.isBiometricAvailable()

                const preferredMethod = isBiometricAvailable
                    ? AuthMethod.BIOMETRIC
                    : isPinSet
                    ? AuthMethod.PIN
                    : AuthMethod.GOOGLE

                set({
                    user: userData,
                    isAuthenticated: true,
                    isLoading: false,
                    preferredAuthMethod: preferredMethod,
                })
                return
            }

            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            })
        } catch (error) {
            console.error("Auth check failed:", error)
            set({ user: null, isAuthenticated: false })
        } finally {
            set({ isLoading: false })
        }
    },

    setupPin: async (pin: string) => {
        try {
            set({ isLoading: true })
            const success = await authService.setupPin(pin)
            if (success) {
                set({ preferredAuthMethod: AuthMethod.PIN })
            }
            return success
        } catch (error) {
            console.error("PIN setup failed:", error)
            return false
        } finally {
            set({ isLoading: false })
        }
    },
}))
