import { ErrorTrackingService } from "../../../services/monitoring/errorTrackingService"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ErrorRecord } from "../../../types/monitoring"

jest.mock("@react-native-async-storage/async-storage", () => ({
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(),
    removeItem: jest.fn(() => Promise.resolve()),
}))

// Mock LoggingService to avoid actual console logs during tests
jest.mock("../../../services/monitoring/loggingService", () => ({
    LoggingService: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        getLogger: () => ({
            error: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            debug: jest.fn(),
        }),
    },
    LogLevel: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
    },
    LogConfig: {
        minLevel: 0,
        enableConsoleOutput: false,
    },
}))

// Mock ErrorUtils
const mockSetGlobalHandler = jest.fn()
const mockGetGlobalHandler = jest.fn().mockReturnValue(jest.fn())

// @ts-expect-error - ErrorUtils is not defined in the types
global.ErrorUtils = {
    setGlobalHandler: mockSetGlobalHandler,
    getGlobalHandler: mockGetGlobalHandler,
}

describe("ErrorTrackingService", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        ErrorTrackingService["isInitialized"] = false
    })

    test("init should set up global error handler", () => {
        ErrorTrackingService.init()

        expect(mockGetGlobalHandler).toHaveBeenCalled()
        expect(mockSetGlobalHandler).toHaveBeenCalled()
        expect(ErrorTrackingService["isInitialized"]).toBe(true)
    })

    test("init should only initialize once", () => {
        ErrorTrackingService.init()
        mockGetGlobalHandler.mockClear()
        mockSetGlobalHandler.mockClear()

        ErrorTrackingService.init()

        expect(mockGetGlobalHandler).not.toHaveBeenCalled()
        expect(mockSetGlobalHandler).not.toHaveBeenCalled()
    })

    test("handleError should log and store fatal errors", async () => {
        const testError = new Error("Test fatal error")
        await ErrorTrackingService.handleError(testError, true)

        // Should store the error for fatal errors
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "com.doc_wallet.errors",
            expect.any(String)
        )

        const storedData = JSON.parse(
            (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
        )
        expect(storedData[0].message).toBe("Test fatal error")
        expect(storedData[0].isFatal).toBe(true)
    })

    test("handleError should not store non-critical errors", async () => {
        const testError = new Error("Test non-fatal error")
        await ErrorTrackingService.handleError(testError, false)

        // Should not store non-fatal, non-critical errors
        expect(AsyncStorage.setItem).not.toHaveBeenCalled()
    })

    test("getStoredErrors should retrieve and parse stored errors", async () => {
        const mockErrors: ErrorRecord[] = [
            {
                name: "Error",
                message: "Test error 1",
                timestamp: new Date().toISOString(),
            },
            {
                name: "TypeError",
                message: "Test error 2",
                timestamp: new Date().toISOString(),
            },
        ]

        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
            JSON.stringify(mockErrors)
        )

        const storedErrors = await ErrorTrackingService.getStoredErrors()

        expect(AsyncStorage.getItem).toHaveBeenCalledWith(
            "com.doc_wallet.errors"
        )
        expect(storedErrors).toEqual(mockErrors)
    })

    test("clearStoredErrors should remove all stored errors", async () => {
        await ErrorTrackingService.clearStoredErrors()

        expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
            "com.doc_wallet.errors"
        )
    })

    test("createError should create an error with context", () => {
        const context = { userId: "123", action: "login" }
        const error = ErrorTrackingService.createError("Test error", context)

        expect(error.message).toBe("Test error")

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((error as any).context).toEqual(context)
    })
})
