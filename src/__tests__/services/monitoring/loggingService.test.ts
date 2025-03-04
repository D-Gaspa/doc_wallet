import {
    LogConfig,
    LoggingService,
} from "../../../services/monitoring/loggingService"
import { ILogParams, LogLevel } from "../../../types/monitoring"

describe("LoggingService", () => {
    let originalConsole: {
        log: typeof console.log
        info: typeof console.info
        warn: typeof console.warn
        error: typeof console.error
    }

    beforeEach(() => {
        // Store original console methods
        originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
        }

        // Mock console methods
        console.log = jest.fn()
        console.info = jest.fn()
        console.warn = jest.fn()
        console.error = jest.fn()
    })

    afterEach(() => {
        // Restore original console methods
        console.log = originalConsole.log
        console.info = originalConsole.info
        console.warn = originalConsole.warn
        console.error = originalConsole.error
    })

    test("should log with timestamp and level prefix", () => {
        // Force enable console output for testing
        const originalConfig = { ...LogConfig }
        LogConfig.enableConsoleOutput = true
        LogConfig.minLevel = LogLevel.DEBUG

        LoggingService.debug("Debug message")
        LoggingService.info("Info message")
        LoggingService.warn("Warning message")
        LoggingService.error("Error message")

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("[DEBUG]"),
            "Debug message"
        )
        expect(console.info).toHaveBeenCalledWith(
            expect.stringContaining("[INFO]"),
            "Info message"
        )
        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining("[WARN]"),
            "Warning message"
        )
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining("[ERROR]"),
            "Error message"
        )

        // Restore original config
        Object.assign(LogConfig, originalConfig)
    })

    test("should respect minimum log level", () => {
        // Set minimum level to WARN
        const originalConfig = { ...LogConfig }
        LogConfig.enableConsoleOutput = true
        LogConfig.minLevel = LogLevel.WARN

        LoggingService.debug("Debug message")
        LoggingService.info("Info message")
        LoggingService.warn("Warning message")
        LoggingService.error("Error message")

        expect(console.log).not.toHaveBeenCalled()
        expect(console.info).not.toHaveBeenCalled()
        expect(console.warn).toHaveBeenCalled()
        expect(console.error).toHaveBeenCalled()

        // Restore original config
        Object.assign(LogConfig, originalConfig)
    })

    test("should pass optional parameters to console methods", () => {
        // Force enable console output for testing
        const originalConfig = { ...LogConfig }
        LogConfig.enableConsoleOutput = true
        LogConfig.minLevel = LogLevel.DEBUG

        const params: ILogParams[] = [{ test: "value" }, 123]
        LoggingService.debug("Debug message", ...params)

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("[DEBUG]"),
            "Debug message",
            { test: "value" },
            123
        )

        // Restore original config
        Object.assign(LogConfig, originalConfig)
    })

    test("getLogger should create tagged logger", () => {
        // Force enable console output for testing
        const originalConfig = { ...LogConfig }
        LogConfig.enableConsoleOutput = true
        LogConfig.minLevel = LogLevel.DEBUG

        const testLogger = LoggingService.getLogger("TestComponent")
        testLogger.info("Test message")

        expect(console.info).toHaveBeenCalledWith(
            expect.stringContaining("[INFO]"),
            "[TestComponent] Test message"
        )

        // Restore original config
        Object.assign(LogConfig, originalConfig)
    })
})
