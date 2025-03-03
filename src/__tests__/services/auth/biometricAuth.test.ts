import { BiometricAuthService } from "../../../services/auth/biometricAuth"
import * as LocalAuthentication from "expo-local-authentication"

jest.mock("expo-local-authentication", () => ({
    hasHardwareAsync: jest.fn(),
    isEnrolledAsync: jest.fn(),
    authenticateAsync: jest.fn(),
}))

describe("BiometricAuthService", () => {
    let biometricAuthService: BiometricAuthService

    beforeEach(() => {
        biometricAuthService = new BiometricAuthService()
        jest.clearAllMocks()
    })

    test("isBiometricsAvailable should return true when hardware and enrollment available", async () => {
        ;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(
            true
        )
        ;(LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(
            true
        )

        const result = await biometricAuthService.isBiometricsAvailable()

        expect(result).toBe(true)
        expect(LocalAuthentication.hasHardwareAsync).toHaveBeenCalled()
        expect(LocalAuthentication.isEnrolledAsync).toHaveBeenCalled()
    })

    test("isBiometricsAvailable should return false when hardware not available", async () => {
        ;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(
            false
        )
        ;(LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(
            true
        )

        const result = await biometricAuthService.isBiometricsAvailable()

        expect(result).toBe(false)
    })

    test("isBiometricsAvailable should return false when not enrolled", async () => {
        ;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(
            true
        )
        ;(LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(
            false
        )

        const result = await biometricAuthService.isBiometricsAvailable()

        expect(result).toBe(false)
    })

    test("authenticateWithBiometrics should return true on successful authentication", async () => {
        ;(LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue(
            { success: true }
        )

        const result = await biometricAuthService.authenticateWithBiometrics()

        expect(result).toBe(true)
        expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
            promptMessage: "Authenticate to access your documents",
            fallbackLabel: "Use PIN",
            disableDeviceFallback: false,
        })
    })

    test("authenticateWithBiometrics should return false on failed authentication", async () => {
        ;(LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue(
            { success: false }
        )

        const result = await biometricAuthService.authenticateWithBiometrics()

        expect(result).toBe(false)
    })
})
