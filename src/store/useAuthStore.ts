import { create } from "zustand"
import { persist } from "zustand/middleware"
import { AuthMethod } from "../types/auth"
import type { IUser, IUserCredentials } from "../types/user"
import { GoogleAuthService } from "../services/auth/googleAuth"
import { AuthService } from "../services/auth/authService"
import { TokenService } from "../services/auth/tokenService"
import { LoggingService } from "../services/monitoring/loggingService"
import { PerformanceMonitoringService } from "../services/monitoring/performanceMonitoringService"
import { ErrorTrackingService } from "../services/monitoring/errorTrackingService"
import { databaseAuth } from "../services/auth/databaseAuthAdapter"
import { asyncStorageMiddleware } from "./middleware/persist"
import { useDocStore } from "./useDocStore"
import { useFolderStore } from "./useFolderStore"
import { useNotificationStore } from "./useNotificationStore"
import { useFavoriteDocumentsStore } from "./useFavoriteDocumentsStore"
import { useTagStore } from "./useTagStore"

const authService = new AuthService()
const logger = LoggingService.getLogger("AuthStore")

const MOCK_USERS: IUserCredentials[] = [
    {
        id: "user-1",
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        createdAt: new Date("2023-01-01").toISOString(),
    },
]

if (databaseAuth && typeof databaseAuth.setMockUsers === "function") {
    databaseAuth.setMockUsers(MOCK_USERS)
} else {
    logger.warn(
        "databaseAuth adapter or setMockUsers not available for initialization.",
    )
}

interface AuthStateForStore {
    user: IUser | null
    isAuthenticated: boolean
    isLoading: boolean
    preferredAuthMethod: AuthMethod

    loginWithEmailPassword: (email: string, password: string) => Promise<IUser>
    registerUser: (
        data: Omit<IUserCredentials, "id" | "createdAt">,
    ) => Promise<boolean>
    login: (pin?: string) => Promise<IUser | null>
    logout: () => Promise<void>
    checkAuthStatus: () => Promise<void>
    setupPin: (pin: string) => Promise<boolean>
}

const loadAllUserData = async (userId: string) => {
    logger.debug(`Starting data load for user ${userId}`)
    try {
        await Promise.all([
            useDocStore.getState().loadDocuments(userId),
            useFolderStore.getState().loadFolders(userId),
            useNotificationStore.getState().loadData(userId),
            useFavoriteDocumentsStore.getState().loadData(userId),
            useTagStore.getState().loadData(userId),
        ])
        logger.info(`Finished loading data for user ${userId}`)
    } catch (error) {
        logger.error(
            `Error loading data for user ${userId} during login/check:`,
            error,
        )
    }
}

const saveAllUserData = async (userId: string) => {
    logger.debug(`Starting data save for user ${userId}`)
    try {
        await Promise.all([
            useDocStore.getState().saveDocuments(userId),
            useFolderStore.getState().saveFolders(userId),
            useNotificationStore.getState().saveData(userId),
            useFavoriteDocumentsStore.getState().saveData(userId),
            useTagStore.getState().saveData(userId),
        ])
        logger.info(`Finished saving data for user ${userId}`)
    } catch (error) {
        logger.error(
            `Error saving data for user ${userId} during logout:`,
            error,
        )
    }
}

const resetAllUserDataStores = () => {
    logger.debug("Resetting all user-specific data stores")
    useDocStore.getState().reset()
    useFolderStore.getState().reset()
    useNotificationStore.getState().reset()
    useFavoriteDocumentsStore.getState().reset()
    useTagStore.getState().reset()
}

export const useAuthStore = create<AuthStateForStore>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            preferredAuthMethod: AuthMethod.PIN,

            loginWithEmailPassword: async (
                email: string,
                password: string,
            ): Promise<IUser> => {
                PerformanceMonitoringService.startMeasure("login_email_flow")
                try {
                    logger.info("Email/password login started")
                    set({ isLoading: true })

                    const verifiedUser = await databaseAuth.verifyCredentials(
                        email,
                        password,
                    )

                    if (!verifiedUser) {
                        logger.warn(
                            "Login failed - invalid credentials via adapter",
                        )
                        set({ isLoading: false })
                        throw new Error("Invalid email or password")
                    }

                    await TokenService.storeUserData?.(verifiedUser)

                    await loadAllUserData(verifiedUser.id)

                    logger.info("Email/password login successful via adapter", {
                        /*...*/
                    })
                    set({
                        user: verifiedUser,
                        isAuthenticated: true,
                        isLoading: false,
                        preferredAuthMethod: AuthMethod.EMAIL_PASSWORD,
                    })
                    PerformanceMonitoringService.endMeasure("login_email_flow")
                    return verifiedUser
                } catch (error) {
                    set({ isLoading: false })
                    PerformanceMonitoringService.endMeasure("login_email_flow")
                    throw error
                }
            },

            login: async (pin?: string): Promise<IUser | null> => {
                PerformanceMonitoringService.startMeasure("login_flow")
                try {
                    logger.info("Login process started (non-email)")
                    set({ isLoading: true })

                    const preferredMethod =
                        await authService.getPreferredAuthMethod()
                    logger.debug(
                        `Using preferred auth method: ${preferredMethod}`,
                    )

                    let user: IUser | null = null

                    switch (preferredMethod) {
                        case AuthMethod.BIOMETRIC:
                            logger.debug("Attempting biometric authentication")
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
                            break
                        case AuthMethod.PIN:
                            if (!pin) {
                                /* handle missing pin */
                                throw new Error("PIN is required")
                            }
                            logger.debug("Attempting PIN authentication")
                            user = await authService.authenticate(
                                AuthMethod.PIN,
                                { pin },
                            )
                            break
                        case AuthMethod.GOOGLE:
                            logger.debug("Attempting Google authentication")
                            user = await authService.authenticate(
                                AuthMethod.GOOGLE,
                            )
                            break
                        default:
                            logger.warn(
                                `Unsupported auth method: ${preferredMethod}`,
                            )
                            throw new Error("Unsupported authentication method")
                    }

                    if (!user) {
                        logger.warn("Authentication failed - no user returned")
                        set({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                        })
                        PerformanceMonitoringService.endMeasure("login_flow")
                        throw new Error("Authentication failed")
                    }

                    logger.info("Login successful (non-email)", {
                        userId: user.id,
                        email: user.email,
                    })

                    if (preferredMethod === AuthMethod.GOOGLE) {
                        await TokenService.storeUserData?.(user)
                    }

                    await loadAllUserData(user.id)

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        preferredAuthMethod: preferredMethod,
                    })

                    PerformanceMonitoringService.endMeasure("login_flow")
                    return user
                } catch (error) {
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    })
                    PerformanceMonitoringService.endMeasure("login_flow")
                    throw error
                }
            },

            registerUser: async (
                data: Omit<IUserCredentials, "id" | "createdAt">,
            ): Promise<boolean> => {
                try {
                    logger.info("User registration started via adapter")
                    set({ isLoading: true })

                    const newUser = await databaseAuth.addUser(data)

                    if (!newUser) {
                        logger.warn(
                            "Registration failed via adapter - user likely exists or error occurred",
                        )
                        set({ isLoading: false })

                        throw new Error(
                            "Email already registered or registration failed.",
                        )
                    }

                    logger.info("User registration successful via adapter", {
                        userId: newUser.id,
                        email: newUser.email,
                    })
                    set({ isLoading: false })

                    return true
                } catch (error) {
                    set({ isLoading: false })
                    throw error
                }
            },

            logout: async () => {
                const currentUser = get().user
                PerformanceMonitoringService.startMeasure("logout_flow")
                try {
                    logger.info("Logout process started")
                    set({ isLoading: true })

                    if (currentUser) {
                        await saveAllUserData(currentUser.id)
                    } else {
                        logger.warn(
                            "Logout called but no current user found to save data for.",
                        )
                    }

                    await GoogleAuthService.signOut()
                    await TokenService.clearUserData?.()
                    await TokenService.clearTokens?.()

                    resetAllUserDataStores()

                    logger.info(
                        "Logout successful - state cleared and data saved",
                    )
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        preferredAuthMethod: AuthMethod.PIN,
                    })
                } catch (error) {
                    logger.error("Logout failed:", error)

                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    })
                    try {
                        resetAllUserDataStores()
                    } catch (resetError) {
                        logger.error(
                            "Error resetting stores during failed logout:",
                            resetError,
                        )
                    }
                } finally {
                    set({ isLoading: false })
                    PerformanceMonitoringService.endMeasure("logout_flow")
                }
            },

            checkAuthStatus: async () => {
                PerformanceMonitoringService.startMeasure("auth_status_check")
                try {
                    logger.debug("Checking authentication status")
                    set({ isLoading: true })

                    const userData = await TokenService.getUserData?.()
                    const isGoogleAuthenticated =
                        await GoogleAuthService.isAuthenticated()
                    let authenticatedUser: IUser | null = null
                    let finalAuthMethod: AuthMethod = AuthMethod.EMAIL_PASSWORD

                    if (isGoogleAuthenticated) {
                        const googleUser =
                            await GoogleAuthService.getCurrentUser()
                        if (googleUser) {
                            authenticatedUser = {
                                id: googleUser.id,
                                name: googleUser.name || "User",
                                email: googleUser.email,
                                profileImage: googleUser.photo || undefined,
                            }
                            finalAuthMethod = AuthMethod.GOOGLE
                            logger.info(
                                "AuthCheck: User authenticated via Google token",
                                { email: authenticatedUser.email },
                            )

                            await TokenService.storeUserData?.(
                                authenticatedUser,
                            )
                        } else {
                            logger.warn(
                                "AuthCheck: Google authenticated but failed to get user details.",
                            )
                        }
                    }

                    if (!authenticatedUser && userData) {
                        authenticatedUser = userData
                        const isPinSet = await authService.isPinSet()
                        const isBiometricAvailable =
                            await authService.isBiometricAvailable()
                        finalAuthMethod = isBiometricAvailable
                            ? AuthMethod.BIOMETRIC
                            : isPinSet
                            ? AuthMethod.PIN
                            : AuthMethod.EMAIL_PASSWORD
                        logger.info(
                            "AuthCheck: User authenticated via stored local user data",
                            { email: authenticatedUser.email },
                        )
                    }

                    if (authenticatedUser) {
                        await loadAllUserData(authenticatedUser.id)

                        set({
                            user: authenticatedUser,
                            isAuthenticated: true,
                            isLoading: false,
                            preferredAuthMethod: finalAuthMethod,
                        })
                    } else {
                        logger.debug("AuthCheck: No valid authentication found")

                        resetAllUserDataStores()
                        set({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                            preferredAuthMethod: AuthMethod.EMAIL_PASSWORD,
                        })
                    }
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

                    resetAllUserDataStores()
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    })
                } finally {
                    set({ isLoading: false })
                    PerformanceMonitoringService.endMeasure("auth_status_check")
                }
            },

            setupPin: async (pin: string): Promise<boolean> => {
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
            name: "auth-storage",
            storage: asyncStorageMiddleware,
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                preferredAuthMethod: state.preferredAuthMethod,
            }),
        },
    ),
)
