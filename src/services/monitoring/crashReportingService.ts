import { LoggingService } from "./loggingService"
import { CrashReport, IAppState } from "../../types/monitoring"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"

const CRASH_FLAG_KEY = "com.doc_wallet.last_crash_flag"
const CRASH_REPORT_KEY = "com.doc_wallet.crash_reports"
const MAX_CRASH_REPORTS = 10

export class CrashReportingService {
    private static logger = LoggingService.getLogger("CrashReporting")

    // Initialize crash detection - call this early in-app startup
    static async checkForPreviousCrash(): Promise<boolean> {
        try {
            const crashFlag = await AsyncStorage.getItem(CRASH_FLAG_KEY)

            if (crashFlag === "true") {
                // App crashed during the previous session
                this.logger.warn("Detected crash in previous session")

                // Clear the flag
                await AsyncStorage.setItem(CRASH_FLAG_KEY, "false")
                return true
            }

            // Set the flag for this session
            await AsyncStorage.setItem(CRASH_FLAG_KEY, "true")
            return false
        } catch (error) {
            this.logger.error("Error checking for previous crash", error)
            return false
        }
    }

    // Call this in app's cleanup/shutdown logic
    static async markGracefulShutdown(): Promise<void> {
        try {
            await AsyncStorage.setItem(CRASH_FLAG_KEY, "false")
        } catch (error) {
            this.logger.error("Failed to mark graceful shutdown", error)
        }
    }

    // Save crash information for later reporting
    static async saveCrashReport(
        error: Error,
        appState?: IAppState,
    ): Promise<void> {
        try {
            const crashReport: CrashReport = {
                timestamp: new Date().toISOString(),
                name: error.name,
                message: error.message,
                stack: error.stack,
                isFatal: true,
                context: {
                    platform: Platform.OS,
                    version: Platform.Version,
                    // Add more device info as needed
                },
                appState,
            }

            // Get existing crash reports
            const reportsJson = await AsyncStorage.getItem(CRASH_REPORT_KEY)
            const reports: CrashReport[] = reportsJson
                ? JSON.parse(reportsJson)
                : []

            // Add new report and limit the number stored
            const updatedReports = [crashReport, ...reports].slice(
                0,
                MAX_CRASH_REPORTS,
            )

            // Save updated reports
            await AsyncStorage.setItem(
                CRASH_REPORT_KEY,
                JSON.stringify(updatedReports),
            )

            this.logger.info("Crash report saved")
        } catch (err) {
            this.logger.error("Failed to save crash report", err)
        }
    }

    static async getCrashReports(): Promise<CrashReport[]> {
        try {
            const reportsJson = await AsyncStorage.getItem(CRASH_REPORT_KEY)
            return reportsJson ? JSON.parse(reportsJson) : []
        } catch (err) {
            this.logger.error("Failed to retrieve crash reports", err)
            return []
        }
    }

    static async clearCrashReports(): Promise<void> {
        try {
            await AsyncStorage.removeItem(CRASH_REPORT_KEY)
            this.logger.info("Crash reports cleared")
        } catch (err) {
            this.logger.error("Failed to clear crash reports", err)
        }
    }
}
