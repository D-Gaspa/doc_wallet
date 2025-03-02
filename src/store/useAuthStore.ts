import { create } from "zustand"
import type { IAuthState } from "../types/auth"
import type { IUser } from "../types/user"
import { GoogleAuthService } from "../services/auth/googleAuth.ts"

export const useAuthStore = create<IAuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,

    login: async () => {
        try {
            set({ isLoading: true })
            const authResponse = await GoogleAuthService.signIn()

            const user: IUser = {
                id: authResponse.user.id,
                name: authResponse.user.name || "User",
                email: authResponse.user.email,
            }

            // Update store with authenticated user
            set({
                user,
                isAuthenticated: true,
                isLoading: false,
            })
        } catch (error) {
            console.error("Login failed:", error)
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            })
            throw error // It is going to be re-throw to let UI handle error display
        }
    },
    // TODO: Implement logout logic
    logout: async () => {
        try {
            set({ isLoading: true })

            // Sign out from Google and revoke tokens
            await GoogleAuthService.signOut()

            // Update store
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
            // TODO: Check for other types of authentication than google
            const isAuthenticated = await GoogleAuthService.isAuthenticated()

            if (isAuthenticated) {
                const googleUser = await GoogleAuthService.getCurrentUser()

                if (googleUser) {
                    const user: IUser = {
                        id: googleUser.id,
                        name: googleUser.name || "User",
                        email: googleUser.email,
                    }

                    // Set authenticated state
                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                    })
                    return
                }
            }

            // If any check fails, set not authenticated
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
}))
