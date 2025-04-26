// store/useAuthStore.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { AuthMethod, IAuthState } from "../types/auth"
import type { IUser, IUserCredentials } from "../types/user"
import { GoogleAuthService } from "../services/auth/googleAuth"
import { AuthService } from "../services/auth/authService"
import { TokenService } from "../services/auth/tokenService"
import { LoggingService } from "../services/monitoring/loggingService"
import { PerformanceMonitoringService } from "../services/monitoring/performanceMonitoringService"
import { ErrorTrackingService } from "../services/monitoring/errorTrackingService"

const authService = new AuthService()
const logger = LoggingService.getLogger("AuthStore")

// Mock users for development - in production, this would come from a real API
const MOCK_USERS: IUserCredentials[] = [
    {
        id: "user-1",
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        createdAt: new Date("2023-01-01").toISOString(),
    },
]

export const useAuthStore = create<IAuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            preferredAuthMethod: AuthMethod.PIN,
            registeredUsers: MOCK_USERS,

            // Email/Password login
            loginWithEmailPassword: async (email: string, password: string) => {
                try {
                    logger.info("Email/password login started")
                    set({ isLoading: true })

                    // Find user in mock data
                    const user = get().registeredUsers.find(
                        (u) =>
                            u.email.toLowerCase() === email.toLowerCase() &&
                            u.password === password,
                    )

                    if (!user) {
                        logger.warn("Login failed - invalid credentials")
                        set({ isLoading: false })
                        // Instead of throwing, return null or a result object
                        return Promise.reject(
                            new Error("Invalid email or password"),
                        )
                    }

                    // Create safe user object without password
                    const safeUser: IUser = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                    }

                    // Store user data for later auth
                    await TokenService.storeUserData?.(safeUser)

                    logger.info("Email/password login successful", {
                        userId: safeUser.id,
                        email: safeUser.email,
                    })

                    set({
                        user: safeUser,
                        isAuthenticated: true,
                        isLoading: false,
                        preferredAuthMethod: AuthMethod.EMAIL_PASSWORD,
                    })

                    return safeUser
                } catch (error) {
                    logger.error("Login failed:", error)
                    set({ isLoading: false })
                    // Return a rejected promise instead of throwing
                    return Promise.reject(error)
                }
            },

            // Register a new user
            registerUser: async (
                userData: Omit<IUserCredentials, "id" | "createdAt">,
            ) => {
                try {
                    logger.info("User registration started")
                    set({ isLoading: true })

                    // Check if email already exists
                    const emailExists = get().registeredUsers.some(
                        (u) =>
                            u.email.toLowerCase() ===
                            userData.email.toLowerCase(),
                    )

                    if (emailExists) {
                        logger.warn(
                            "Registration failed - email already exists",
                        )
                        set({ isLoading: false })
                        return Promise.reject(
                            new Error("Email already registered"),
                        )
                    }

                    // Create new user
                    const newUser: IUserCredentials = {
                        id: `user-${Date.now()}`,
                        ...userData,
                        createdAt: new Date().toISOString(),
                    }

                    // Add to registered users
                    set((state) => ({
                        registeredUsers: [...state.registeredUsers, newUser],
                        isLoading: false,
                    }))

                    logger.info("User registration successful", {
                        userId: newUser.id,
                        email: newUser.email,
                    })

                    return true
                } catch (error) {
                    logger.error("Registration failed:", error)
                    set({ isLoading: false })
                    return Promise.reject(error)
                }
            },

            // Original login method with auth service
            login: async (pin?: string) => {
                PerformanceMonitoringService.startMeasure("login_flow")
                try {
                    logger.info("Login process started")
                    set({ isLoading: true })

                    const preferredMethod =
                        await authService.getPreferredAuthMethod()
                    logger.debug(
                        `Using preferred auth method: ${preferredMethod}`,
                    )

                    let user: IUser | null = null

                    if (preferredMethod === AuthMethod.BIOMETRIC) {
                        user = await authService.authenticate(
                            AuthMethod.BIOMETRIC,
                        )
                        if (!user && pin) {
                            logger.debug(
                                "Biometric auth failed, trying PIN fallback",
                            )
                            user = await authService.authenticate(
                                AuthMethod.PIN,
                                { pin },
                            )
                        }
                    } else if (preferredMethod === AuthMethod.PIN) {
                        if (!pin) {
                            logger.warn("PIN required but not provided")
                            set({ isLoading: false })
                            PerformanceMonitoringService.endMeasure(
                                "login_flow",
                            )
                            return Promise.reject(new Error("PIN is required"))
                        }
                        user = await authService.authenticate(AuthMethod.PIN, {
                            pin,
                        })
                    } else {
                        user = await authService.authenticate(AuthMethod.GOOGLE)
                    }

                    if (!user) {
                        logger.warn("Authentication failed - no user returned")
                        set({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                        })
                        PerformanceMonitoringService.endMeasure("login_flow")
                        return Promise.reject(
                            new Error("Authentication failed"),
                        )
                    }

                    logger.info("Login successful", {
                        userId: user.id,
                        email: user.email,
                    })

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        preferredAuthMethod: preferredMethod,
                    })

                    PerformanceMonitoringService.endMeasure("login_flow")
                    return user
                } catch (error) {
                    logger.error("Login failed:", error)
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    })
                    PerformanceMonitoringService.endMeasure("login_flow")
                    return Promise.reject(error)
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
                        const googleUser =
                            await GoogleAuthService.getCurrentUser()

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
                            PerformanceMonitoringService.endMeasure(
                                "auth_status_check",
                            )
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
                        PerformanceMonitoringService.endMeasure(
                            "auth_status_check",
                        )
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
                                error instanceof Error
                                    ? error.message
                                    : String(error)
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
        }),
        {
            name: "auth-storage", // Name for the persisted storage
            // Only persist certain fields for security
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                preferredAuthMethod: state.preferredAuthMethod,
                // Don't persist sensitive data like full user object or credentials
            }),
        },
    ),
)
