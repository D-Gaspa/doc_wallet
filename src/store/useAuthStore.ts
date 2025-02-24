import { create } from "zustand"
import type { IAuthState, IUser } from "./types"

export const useAuthStore = create<IAuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,

    // TODO: Implement login logic
    login: async () => {},

    // TODO: Implement logout logic
    logout: () => {},

    // TODO: Implement check Auth status
    checkAuthStatus: async () => {
        try {
            set({ isLoading: true })
            // Check if user is already logged in
            const isValid = false // Replace with actual validation

            if (isValid) {
                // Fetch user data
                const user: IUser = {
                    id: "1",
                    name: "Test User",
                    email: "user@example.com",
                }
                set({ user, isAuthenticated: true })
            } else {
                set({ user: null, isAuthenticated: false })
            }
        } catch (error) {
            console.error("Auth check failed:", error)
            set({ user: null, isAuthenticated: false })
        } finally {
            set({ isLoading: false })
        }
    },
}))
