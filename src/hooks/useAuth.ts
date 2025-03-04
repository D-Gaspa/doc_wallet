import { useEffect } from "react"
import { useAuthStore } from "../store"
import { GoogleAuthService } from "../services/auth/googleAuth.ts"
import { LoggingService } from "../services/monitoring/loggingService"

const logger = LoggingService.getLogger("UseAuth")

export const useAuth = () => {
    const { user, isAuthenticated, isLoading, login, logout, checkAuthStatus } =
        useAuthStore()

    // Check auth status when component mounts
    useEffect(() => {
        logger.debug("Initializing authentication")
        // Preload App Auth configuration
        GoogleAuthService.preloadConfig().then((r) => r)
        checkAuthStatus().then((r) => r)
    }, [])

    const loginWithGoogle = async () => {
        try {
            logger.debug("Attempting login with Google")
            // This keeps our interface consistent but allows Google Auth
            await login()
            logger.info("Google login successful")
            return true
        } catch (error) {
            logger.error("Login with Google failed:", error)
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
