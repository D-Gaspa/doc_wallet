import { BiometricAuthService } from "../../services/auth/biometricAuth"
import { PinAuthService } from "../../services/auth/pinAuth"
import { GoogleAuthService } from "../../services/auth/googleAuth"
import { TokenService } from "../../services/auth/tokenService.ts"
import { AuthService } from "../../services/auth/authService.ts"
import { AuthMethod } from "../../types/auth.ts"

jest.mock("../../services/auth/biometricAuth")
jest.mock("../../services/auth/pinAuth")
jest.mock("../../services/auth/googleAuth")
jest.mock("../../services/auth/tokenService.ts")

describe("AuthService", () => {
    let authService: AuthService

    beforeEach(() => {
        authService = new AuthService()
        jest.clearAllMocks()
        ;(
            BiometricAuthService.prototype.isBiometricsAvailable as jest.Mock
        ).mockResolvedValue(true)
        ;(PinAuthService.prototype.isPinSet as jest.Mock).mockResolvedValue(
            true,
        )
    })

    test("getPreferredAuthMethod should prefer biometrics when available", async () => {
        const method = await authService.getPreferredAuthMethod()

        expect(method).toBe(AuthMethod.BIOMETRIC)
        expect(
            BiometricAuthService.prototype.isBiometricsAvailable,
        ).toHaveBeenCalled()
        expect(PinAuthService.prototype.isPinSet).not.toHaveBeenCalled() // Should short-circuit
    })

    test("getPreferredAuthMethod should fallback to PIN when biometrics unavailable", async () => {
        ;(
            BiometricAuthService.prototype.isBiometricsAvailable as jest.Mock
        ).mockResolvedValue(false)

        const method = await authService.getPreferredAuthMethod()

        expect(method).toBe(AuthMethod.PIN)
        expect(
            BiometricAuthService.prototype.isBiometricsAvailable,
        ).toHaveBeenCalled()
        expect(PinAuthService.prototype.isPinSet).toHaveBeenCalled()
    })

    test("getPreferredAuthMethod should fallback to Google when biometrics and PIN unavailable", async () => {
        ;(
            BiometricAuthService.prototype.isBiometricsAvailable as jest.Mock
        ).mockResolvedValue(false)
        ;(PinAuthService.prototype.isPinSet as jest.Mock).mockResolvedValue(
            false,
        )

        const method = await authService.getPreferredAuthMethod()

        expect(method).toBe(AuthMethod.GOOGLE)
    })

    test("authenticate with biometrics should return user when successful", async () => {
        const mockUser = {
            id: "123",
            name: "Test User",
            email: "test@example.com",
        }
        ;(
            BiometricAuthService.prototype
                .authenticateWithBiometrics as jest.Mock
        ).mockResolvedValue(true)
        ;(TokenService.getUserData as jest.Mock).mockResolvedValue(mockUser)

        const result = await authService.authenticate(AuthMethod.BIOMETRIC)

        expect(result).toEqual(mockUser)
        expect(
            BiometricAuthService.prototype.authenticateWithBiometrics,
        ).toHaveBeenCalled()
        expect(TokenService.getUserData).toHaveBeenCalled()
    })

    test("authenticate with PIN should verify PIN and return user when successful", async () => {
        const mockUser = {
            id: "123",
            name: "Test User",
            email: "test@example.com",
        }
        ;(PinAuthService.prototype.verifyPin as jest.Mock).mockResolvedValue(
            true,
        )
        ;(TokenService.getUserData as jest.Mock).mockResolvedValue(mockUser)

        const result = await authService.authenticate(AuthMethod.PIN, {
            pin: "1234",
        })

        expect(result).toEqual(mockUser)
        expect(PinAuthService.prototype.verifyPin).toHaveBeenCalledWith("1234")
        expect(TokenService.getUserData).toHaveBeenCalled()
    })

    test("authenticate with invalid PIN should return null", async () => {
        ;(PinAuthService.prototype.verifyPin as jest.Mock).mockResolvedValue(
            false,
        )

        const result = await authService.authenticate(AuthMethod.PIN, {
            pin: "1234",
        })

        expect(result).toBeNull()
        expect(PinAuthService.prototype.verifyPin).toHaveBeenCalledWith("1234")
        expect(TokenService.getUserData).not.toHaveBeenCalled()
    })

    test("authenticate with Google should sign in and store user data", async () => {
        const mockGoogleUser = {
            id: "123",
            name: "Test User",
            email: "test@example.com",
            photo: "http://photo.url",
        }
        const mockAuthResponse = {
            user: mockGoogleUser,
            tokens: {
                accessToken: "access_token",
                refreshToken: "refresh_token",
                expiresAt: 12345678,
            },
        }

        ;(GoogleAuthService.signIn as jest.Mock).mockResolvedValue(
            mockAuthResponse,
        )
        ;(TokenService.storeUserData as jest.Mock).mockResolvedValue(true)

        const result = await authService.authenticate(AuthMethod.GOOGLE)

        expect(result).toEqual({
            id: "123",
            name: "Test User",
            email: "test@example.com",
        })
        expect(GoogleAuthService.signIn).toHaveBeenCalled()
        expect(TokenService.storeUserData).toHaveBeenCalledWith({
            id: "123",
            name: "Test User",
            email: "test@example.com",
        })
    })
})
