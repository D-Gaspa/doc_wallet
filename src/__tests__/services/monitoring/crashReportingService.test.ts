import { CrashReportingService } from "../../../services/monitoring/crashReportingService"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { CrashReport } from "../../../types/monitoring"

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
}))

describe("CrashReportingService", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("checkForPreviousCrash should detect previous crash", async () => {
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("true")

        const result = await CrashReportingService.checkForPreviousCrash()

        expect(result).toBe(true)
        expect(AsyncStorage.getItem).toHaveBeenCalledWith(
            "com.doc_wallet.last_crash_flag",
        )
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "com.doc_wallet.last_crash_flag",
            "false",
        )
    })

    test("checkForPreviousCrash should return false when no previous crash", async () => {
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("false")

        const result = await CrashReportingService.checkForPreviousCrash()

        expect(result).toBe(false)
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "com.doc_wallet.last_crash_flag",
            "true",
        )
    })

    test("markGracefulShutdown should set flag to false", async () => {
        await CrashReportingService.markGracefulShutdown()

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "com.doc_wallet.last_crash_flag",
            "false",
        )
    })

    test("saveCrashReport should store crash report", async () => {
        const testError = new Error("Test crash")
        const appState = { screen: "Home", lastAction: "button_press" }

        await CrashReportingService.saveCrashReport(testError, appState)

        expect(AsyncStorage.getItem).toHaveBeenCalledWith(
            "com.doc_wallet.crash_reports",
        )
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "com.doc_wallet.crash_reports",
            expect.any(String),
        )

        // Check the stored data
        const storedData = JSON.parse(
            (AsyncStorage.setItem as jest.Mock).mock.calls[0][1],
        )
        expect(storedData[0].message).toBe("Test crash")
        expect(storedData[0].isFatal).toBe(true)
        expect(storedData[0].appState).toEqual(appState)
    })

    test("getCrashReports should retrieve and parse stored reports", async () => {
        const mockReports: CrashReport[] = [
            {
                name: "Error",
                message: "Test crash 1",
                timestamp: new Date().toISOString(),
                isFatal: true,
            },
            {
                name: "TypeError",
                message: "Test crash 2",
                timestamp: new Date().toISOString(),
                isFatal: true,
                appState: { screen: "Profile" },
            },
        ]

        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
            JSON.stringify(mockReports),
        )

        const reports = await CrashReportingService.getCrashReports()

        expect(AsyncStorage.getItem).toHaveBeenCalledWith(
            "com.doc_wallet.crash_reports",
        )
        expect(reports).toEqual(mockReports)
    })

    test("clearCrashReports should remove all crash reports", async () => {
        await CrashReportingService.clearCrashReports()

        expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
            "com.doc_wallet.crash_reports",
        )
    })
})
