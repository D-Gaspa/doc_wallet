import { PinAuthService } from "../../../services/auth/pinAuth"
import * as Keychain from "react-native-keychain"

jest.mock("react-native-keychain", () => ({
    setGenericPassword: jest.fn().mockResolvedValue(true),
    getGenericPassword: jest.fn(),
    resetGenericPassword: jest.fn().mockResolvedValue(true),
    ACCESSIBLE: {
        WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
    },
}))

describe("PinAuthService", () => {
    let pinAuthService: PinAuthService
    let mockStoredPin: string

    beforeEach(() => {
        pinAuthService = new PinAuthService()
        jest.clearAllMocks()
    })

    const setupPin = async (pin: string) => {
        const result = await pinAuthService.createPin(pin)
        expect(result).toBe(true)
        mockStoredPin = (Keychain.setGenericPassword as jest.Mock).mock
            .calls[0][1]
        return mockStoredPin
    }

    const mockGetGenericPassword = (
        pin: string | null,
        attempts: string = "0"
    ) => {
        ;(Keychain.getGenericPassword as jest.Mock).mockImplementation(
            ({ service }: { service: string }) => {
                if (service === "com.doc_wallet.auth.pin") {
                    return pin
                        ? Promise.resolve({
                              username: "pin_auth",
                              password: pin,
                          })
                        : Promise.resolve(false)
                }
                return Promise.resolve({
                    username: "attempts",
                    password: attempts,
                })
            }
        )
    }

    test("createPin should store a hashed pin and reset attempts", async () => {
        await setupPin("1234") // Use the helper

        expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
            "pin_auth",
            expect.not.stringContaining("1234"),
            expect.any(Object)
        )
        expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
            "attempts",
            "0",
            expect.any(Object)
        )
    })

    test("verifyPin should return true for correct PIN", async () => {
        await setupPin("1234")
        mockGetGenericPassword(mockStoredPin)

        const result = await pinAuthService.verifyPin("1234")
        expect(result).toBe(true)
    })

    test("verifyPin should return false for incorrect PIN and increment attempts", async () => {
        await setupPin("1234")
        mockGetGenericPassword(mockStoredPin)

        const result = await pinAuthService.verifyPin("4321")

        expect(result).toBe(false)
        expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
            "attempts",
            "1",
            expect.any(Object)
        )
    })

    test("isPinSet should check if PIN exists", async () => {
        mockGetGenericPassword(null) // Mock no PIN
        let result = await pinAuthService.isPinSet()
        expect(result).toBe(false)

        mockGetGenericPassword("hashed_pin") // Mock PIN exists
        result = await pinAuthService.isPinSet()
        expect(result).toBe(true)
    })
})
