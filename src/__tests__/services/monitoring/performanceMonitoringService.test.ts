import { PerformanceMonitoringService } from "../../../services/monitoring/performanceMonitoringService"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { IPerformanceMetric } from "../../../types/monitoring"

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

// Mock performance API
const mockMeasure = jest.fn()
const mockMark = jest.fn()
const mockGetEntriesByName = jest.fn()
const mockClearMarks = jest.fn()
const mockClearMeasures = jest.fn()

// Create a backup of the original performance object if it exists
const originalPerformance = global.performance

describe("PerformanceMonitoringService", () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Instead of direct assignment, use Object.defineProperty
        // This works around the readonly nature of global.performance
        Object.defineProperty(global, "performance", {
            configurable: true,
            value: {
                mark: mockMark,
                measure: mockMeasure,
                getEntriesByName: mockGetEntriesByName,
                clearMarks: mockClearMarks,
                clearMeasures: mockClearMeasures,
                now: jest.fn(),
                getEntries: jest.fn(),
                getEntriesByType: jest.fn(),
                timeOrigin: 0,
            },
        })

        // Reset private variables
        PerformanceMonitoringService["measures"] = {}
        PerformanceMonitoringService["metricsBuffer"] = []
        PerformanceMonitoringService.setEnabled(true)
    })

    afterEach(() => {
        // Restore the original performance object
        Object.defineProperty(global, "performance", {
            configurable: true,
            value: originalPerformance,
        })
    })

    test("startMeasure should create a mark", () => {
        PerformanceMonitoringService.startMeasure("test_operation")

        expect(mockMark).toHaveBeenCalledWith("test_operation_start")
    })

    test("endMeasure should create marks, measure, and return duration", () => {
        // Setup mock for getEntriesByName
        mockGetEntriesByName.mockReturnValue([{ duration: 42.5 }])

        const result = PerformanceMonitoringService.endMeasure("test_operation")

        expect(mockMark).toHaveBeenCalledWith("test_operation_end")
        expect(mockMeasure).toHaveBeenCalledWith(
            "test_operation",
            "test_operation_start",
            "test_operation_end"
        )
        expect(result).toBe(42.5)

        // Check that it was stored in measures
        expect(
            PerformanceMonitoringService["measures"]["test_operation"]
        ).toEqual([42.5])
    })

    test("endMeasure should accept metadata", () => {
        mockGetEntriesByName.mockReturnValue([{ duration: 42.5 }])

        const metadata = { userId: "123", action: "login" }
        PerformanceMonitoringService.endMeasure("test_operation", metadata)

        // Check that metadata is included in buffer
        const buffer = PerformanceMonitoringService["metricsBuffer"]
        expect(buffer[0].metadata).toEqual(metadata)
    })

    test("getStats should return null for unknown operation", () => {
        const result =
            PerformanceMonitoringService.getStats("unknown_operation")

        expect(result).toBeNull()
    })

    test("getStats should calculate statistics correctly", () => {
        // Setup some test measurements
        PerformanceMonitoringService["measures"]["test_op"] = [10, 20, 30]

        const stats = PerformanceMonitoringService.getStats("test_op")

        expect(stats).toEqual({
            min: 10,
            max: 30,
            avg: 20,
            count: 3,
        })
    })

    test("getStoredMetrics should retrieve metrics", async () => {
        // Mock the internal flushMetricsBuffer method - this is the key fix
        const originalFlushMethod =
            PerformanceMonitoringService["flushMetricsBuffer"]
        PerformanceMonitoringService["flushMetricsBuffer"] = jest
            .fn()
            .mockResolvedValue(undefined)

        // Mock AsyncStorage.getItem to return existing metrics
        const existingMetrics: IPerformanceMetric[] = [
            {
                operationName: "previous_op",
                duration: 100,
                timestamp: new Date().toISOString(),
            },
        ]

        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
            JSON.stringify(existingMetrics)
        )

        const metrics = await PerformanceMonitoringService.getStoredMetrics()

        // Should have called flushMetricsBuffer and AsyncStorage.getItem
        expect(
            PerformanceMonitoringService["flushMetricsBuffer"]
        ).toHaveBeenCalled()
        expect(AsyncStorage.getItem).toHaveBeenCalledWith(
            "com.doc_wallet.performance_metrics"
        )

        // Verify that we're returning what AsyncStorage.getItem gave us
        expect(metrics).toEqual(existingMetrics)

        // Restore the original flush method
        PerformanceMonitoringService["flushMetricsBuffer"] = originalFlushMethod
    })

    test("flushMetricsBuffer should store metrics in AsyncStorage", async () => {
        // Add a sample metric to buffer
        mockGetEntriesByName.mockReturnValue([{ duration: 25 }])
        PerformanceMonitoringService.endMeasure("buffered_op")

        // Direct call to private method (accessing via indexing)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (PerformanceMonitoringService as any).flushMetricsBuffer()

        // Should store the metrics
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "com.doc_wallet.performance_metrics",
            expect.any(String)
        )

        // Buffer should be empty after flush
        expect(PerformanceMonitoringService["metricsBuffer"]).toHaveLength(0)
    })

    test("clearStoredMetrics should remove all metrics", async () => {
        await PerformanceMonitoringService.clearStoredMetrics()

        expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
            "com.doc_wallet.performance_metrics"
        )
    })

    test("clearMeasurements should clear performance marks and internal state", () => {
        // Setup some test measurements first
        PerformanceMonitoringService["measures"]["test_op"] = [10, 20, 30]

        PerformanceMonitoringService.clearMeasurements()

        expect(mockClearMarks).toHaveBeenCalled()
        expect(mockClearMeasures).toHaveBeenCalled()
        expect(PerformanceMonitoringService["measures"]).toEqual({})
    })

    test("setEnabled should control monitoring status", () => {
        // Mock Date.now to track if it's called
        const originalDateNow = Date.now
        Date.now = jest.fn(() => 1234567890)

        PerformanceMonitoringService.setEnabled(false)
        mockMark.mockClear()
        ;(Date.now as jest.Mock).mockClear()

        PerformanceMonitoringService.startMeasure("disabled_test")

        // Performance.mark should not be called
        expect(mockMark).not.toHaveBeenCalled()

        // Date.now should not be called either (fallback shouldn't be used)
        expect(Date.now).not.toHaveBeenCalled()

        // Check that timing map is empty
        expect(
            Object.keys(PerformanceMonitoringService["timingMap"])
        ).toHaveLength(0)

        // Restore Date.now
        Date.now = originalDateNow
    })

    test("startMeasure should use Date.now fallback when performance API is not available", () => {
        // Temporarily remove the performance object to simulate environment without Performance API
        const originalPerformance = global.performance
        Object.defineProperty(global, "performance", {
            configurable: true,
            value: undefined,
        })

        // Mock Date.now
        const originalDateNow = Date.now
        Date.now = jest.fn(() => 1234567890)

        PerformanceMonitoringService.startMeasure("fallback_test")

        // Date.now should have been called
        expect(Date.now).toHaveBeenCalled()

        // Check that the start time was recorded in the timing map
        expect(
            PerformanceMonitoringService["timingMap"]["fallback_test_start"]
        ).toBe(1234567890)

        // Restore originals
        Object.defineProperty(global, "performance", {
            configurable: true,
            value: originalPerformance,
        })
        Date.now = originalDateNow
    })
})
