import { useEffect } from "react"
import { useAuthStore } from "../store"
import { GoogleAuthService } from "../services/auth/googleAuth.ts"

export const useAuth = () => {
    const { user, isAuthenticated, isLoading, login, logout, checkAuthStatus } =
        useAuthStore()

    // Check auth status when component mounts
    useEffect(() => {
        // Preload App Auth configuration
        GoogleAuthService.preloadConfig()
        checkAuthStatus()
    }, [])

    const loginWithGoogle = async () => {
        try {
            // We're using the same login function but ignoring the parameters
            // This keeps our interface consistent but allows Google Auth
            await login()
            return true
        } catch (error) {
            console.error("Login with Google failed:", error)
            return false
        }
    }

    return {
        user,
        isAuthenticated,
        isLoading,
        loginWithGoogle,
        logout,
        checkAuthStatus,
    }
}
