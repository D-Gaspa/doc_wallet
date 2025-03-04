import { LoggingService } from "./loggingService"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { isDevelopment } from "../../config/env"
import {
    IPerformanceMetadata,
    IPerformanceMetric,
    IPerformanceStats,
} from "../../types/monitoring"

const PERF_METRICS_KEY = "com.doc_wallet.performance_metrics"

const isPerformanceAPIAvailable = () => {
    return (
        typeof performance !== "undefined" &&
        typeof performance.mark === "function" &&
        typeof performance.measure === "function" &&
        typeof performance.getEntriesByName === "function"
    )
}

export class PerformanceMonitoringService {
    private static measures: Record<string, number[]> = {}
    private static isEnabled = isDevelopment
    private static logger = LoggingService.getLogger("Performance")
    private static metricsBuffer: IPerformanceMetric[] = []
    private static bufferSize = 20
    // Add a timing map for fallback
    private static timingMap: Record<string, number> = {}

    // Enable/disable performance monitoring
    static setEnabled(enabled: boolean): void {
        this.isEnabled = enabled
        if (!enabled) {
            this.timingMap = {}
        }
    }

    static startMeasure(operationName: string): void {
        if (!this.isEnabled) return

        try {
            if (isPerformanceAPIAvailable()) {
                performance.mark(`${operationName}_start`)
            } else {
                // Fallback to Date.now() when performance API unavailable
                this.timingMap[`${operationName}_start`] = Date.now()
            }
        } catch (err) {
            this.logger.error(`Failed to start measure '${operationName}'`, err)
        }
    }

    // End timing and record the measurement
    static endMeasure(
        operationName: string,
        metadata?: IPerformanceMetadata
    ): number | null {
        if (!this.isEnabled) return null

        try {
            let duration: number | null = null

            if (isPerformanceAPIAvailable()) {
                performance.mark(`${operationName}_end`)
                performance.measure(
                    operationName,
                    `${operationName}_start`,
                    `${operationName}_end`
                )

                const entries = performance.getEntriesByName(operationName)
                if (entries.length > 0) {
                    duration = entries[entries.length - 1].duration
                }
            } else {
                // Fallback calculation using Date.now()
                const endTime = Date.now()
                const startTime = this.timingMap[`${operationName}_start`]

                if (startTime) {
                    duration = endTime - startTime
                    delete this.timingMap[`${operationName}_start`] // Clean up
                }
            }

            if (duration !== null) {
                // Store the measurement
                if (!this.measures[operationName]) {
                    this.measures[operationName] = []
                }
                this.measures[operationName].push(duration)

                // Add to buffer for potential persistence
                this.addToMetricsBuffer({
                    operationName,
                    duration,
                    timestamp: new Date().toISOString(),
                    metadata,
                })

                // Log if in development
                if (isDevelopment) {
                    this.logger.debug(
                        `${operationName} took ${duration.toFixed(2)}ms`
                    )
                }

                return duration
            }
            return null
        } catch (err) {
            this.logger.error(`Failed to end measure '${operationName}'`, err)
            return null
        }
    }

    // Get statistics for a specific operation
    static getStats(operationName: string): IPerformanceStats | null {
        const measurements = this.measures[operationName]
        if (!measurements || measurements.length === 0) {
            return null
        }

        return {
            min: Math.min(...measurements),
            max: Math.max(...measurements),
            avg:
                measurements.reduce((sum, val) => sum + val, 0) /
                measurements.length,
            count: measurements.length,
        }
    }

    // Retrieve stored performance metrics
    static async getStoredMetrics(): Promise<IPerformanceMetric[]> {
        try {
            // Flush any buffered metrics first
            await this.flushMetricsBuffer()

            const metricsJson = await AsyncStorage.getItem(PERF_METRICS_KEY)
            return metricsJson ? JSON.parse(metricsJson) : []
        } catch (error) {
            this.logger.error("Failed to retrieve stored metrics", error)
            return []
        }
    }

    // Clear stored metrics
    static async clearStoredMetrics(): Promise<void> {
        try {
            await AsyncStorage.removeItem(PERF_METRICS_KEY)
            this.logger.info("Performance metrics cleared")
        } catch (error) {
            this.logger.error("Failed to clear performance metrics", error)
        }
    }

    static clearMeasurements(): void {
        this.measures = {}
        this.timingMap = {}

        try {
            if (isPerformanceAPIAvailable()) {
                performance.clearMarks()
                performance.clearMeasures()
            }
        } catch (err) {
            this.logger.error("Failed to clear performance measurements", err)
        }
    }

    private static addToMetricsBuffer(metric: IPerformanceMetric): void {
        this.metricsBuffer.push(metric)

        // Flush buffer if it reaches the limit
        if (this.metricsBuffer.length >= this.bufferSize) {
            this.flushMetricsBuffer().then(() => {})
        }
    }

    private static async flushMetricsBuffer(): Promise<void> {
        if (this.metricsBuffer.length === 0) return

        try {
            // Get existing metrics
            const existingMetricsJson = await AsyncStorage.getItem(
                PERF_METRICS_KEY
            )
            const existingMetrics: IPerformanceMetric[] = existingMetricsJson
                ? JSON.parse(existingMetricsJson)
                : []

            // Add new metrics and limit to 100 entries
            const updatedMetrics = [
                ...this.metricsBuffer,
                ...existingMetrics,
            ].slice(0, 100)

            // Save updated metrics
            await AsyncStorage.setItem(
                PERF_METRICS_KEY,
                JSON.stringify(updatedMetrics)
            )

            // Clear the buffer
            this.metricsBuffer = []
        } catch (error) {
            this.logger.error("Failed to flush metrics buffer", error)
        }
    }
}
