import { useAuthStore } from "../../store"
import { AuthService } from "../../services/auth/authService"
import { GoogleAuthService } from "../../services/auth/googleAuth"
import { TokenService } from "../../services/auth/token"
import { AuthMethod } from "../../types/auth"

jest.mock("../../services/auth/authService")
jest.mock("../../services/auth/googleAuth")
jest.mock("../../services/auth/token")

describe("useAuthStore", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useAuthStore.getState()
        useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            preferredAuthMethod: AuthMethod.PIN,
        })
    })

    test("login should authenticate user with preferred method", async () => {
        const mockUser = {
            id: "123",
            name: "Test User",
            email: "test@example.com",
        }

        ;(
            AuthService.prototype.getPreferredAuthMethod as jest.Mock
        ).mockResolvedValue(AuthMethod.PIN)
        ;(AuthService.prototype.authenticate as jest.Mock).mockResolvedValue(
            mockUser
        )

        const store = useAuthStore.getState()
        await store.login("1234")

        expect(AuthService.prototype.getPreferredAuthMethod).toHaveBeenCalled()
        expect(AuthService.prototype.authenticate).toHaveBeenCalledWith(
            AuthMethod.PIN,
            { pin: "1234" }
        )

        // Check that store was updated correctly
        const updatedState = useAuthStore.getState()
        expect(updatedState.user).toEqual(mockUser)
        expect(updatedState.isAuthenticated).toBe(true)
        expect(updatedState.isLoading).toBe(false)
        expect(updatedState.preferredAuthMethod).toBe(AuthMethod.PIN)
    })

    test("login should try fallback if biometric auth fails", async () => {
        const mockUser = {
            id: "123",
            name: "Test User",
            email: "test@example.com",
        }

        // Set up the mock to fail on biometric, succeed on PIN
        ;(
            AuthService.prototype.getPreferredAuthMethod as jest.Mock
        ).mockResolvedValue(AuthMethod.BIOMETRIC)
        ;(AuthService.prototype.authenticate as jest.Mock).mockImplementation(
            (method) => {
                if (method === AuthMethod.BIOMETRIC) {
                    return Promise.resolve(null) // Biometric fails
                } else if (method === AuthMethod.PIN) {
                    return Promise.resolve(mockUser) // PIN succeeds
                }
                return Promise.resolve(null)
            }
        )

        const store = useAuthStore.getState()
        await store.login("1234")

        // Check that both methods were called
        expect(AuthService.prototype.authenticate).toHaveBeenCalledTimes(2)

        // Verify the methods were called with correct parameters (order doesn't matter)
        const calls = (AuthService.prototype.authenticate as jest.Mock).mock
            .calls
        const biometricCall = calls.find(
            (call) => call[0] === AuthMethod.BIOMETRIC
        )
        const pinCall = calls.find((call) => call[0] === AuthMethod.PIN)

        expect(biometricCall).toBeTruthy()
        expect(pinCall).toBeTruthy()
        expect(pinCall[1]).toEqual({ pin: "1234" })

        // Check that store was updated correctly
        const updatedState = useAuthStore.getState()
        expect(updatedState.user).toEqual(mockUser)
        expect(updatedState.isAuthenticated).toBe(true)
    })

    test("logout should sign out and clear user data", async () => {
        // First set up authenticated state
        useAuthStore.setState({
            user: { id: "123", name: "Test User", email: "test@example.com" },
            isAuthenticated: true,
            isLoading: false,
        })
        ;(GoogleAuthService.signOut as jest.Mock).mockResolvedValue(undefined)
        ;(TokenService.clearUserData as jest.Mock).mockResolvedValue(true)

        const store = useAuthStore.getState()
        await store.logout()

        expect(GoogleAuthService.signOut).toHaveBeenCalled()
        expect(TokenService.clearUserData).toHaveBeenCalled()

        // Check that store was updated correctly
        const updatedState = useAuthStore.getState()
        expect(updatedState.user).toBeNull()
        expect(updatedState.isAuthenticated).toBe(false)
        expect(updatedState.isLoading).toBe(false)
    })

    test("checkAuthStatus should check Google and stored credentials", async () => {
        const mockUser = {
            id: "123",
            name: "Test User",
            email: "test@example.com",
        }

        ;(GoogleAuthService.isAuthenticated as jest.Mock).mockResolvedValue(
            true
        )
        ;(GoogleAuthService.getCurrentUser as jest.Mock).mockResolvedValue({
            id: "123",
            name: "Test User",
            email: "test@example.com",
            photo: null,
        })
        ;(TokenService.storeUserData as jest.Mock).mockResolvedValue(true)

        const store = useAuthStore.getState()
        await store.checkAuthStatus()

        expect(GoogleAuthService.isAuthenticated).toHaveBeenCalled()
        expect(GoogleAuthService.getCurrentUser).toHaveBeenCalled()
        expect(TokenService.storeUserData).toHaveBeenCalled()

        // Check that store was updated correctly
        const updatedState = useAuthStore.getState()
        expect(updatedState.user).toEqual(mockUser)
        expect(updatedState.isAuthenticated).toBe(true)
        expect(updatedState.preferredAuthMethod).toBe(AuthMethod.GOOGLE)
    })

    test("setupPin should create PIN and update preferred method", async () => {
        ;(AuthService.prototype.setupPin as jest.Mock).mockResolvedValue(true)

        const store = useAuthStore.getState()
        const result = await store.setupPin("1234")

        expect(result).toBe(true)
        expect(AuthService.prototype.setupPin).toHaveBeenCalledWith("1234")

        // Check that store was updated correctly
        const updatedState = useAuthStore.getState()
        expect(updatedState.preferredAuthMethod).toBe(AuthMethod.PIN)
    })
})
