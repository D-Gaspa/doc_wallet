import { LoggingService } from "./loggingService"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"
import { ErrorRecord, IAppContext } from "../../types/monitoring"

const ERROR_STORAGE_KEY = "com.doc_wallet.errors"
const MAX_STORED_ERRORS = 50

export class ErrorTrackingService {
    private static isInitialized = false
    private static logger = LoggingService.getLogger("ErrorTracking")

    static init(): void {
        if (this.isInitialized) return

        // Set up global error handler for JS errors
        const originalHandler = ErrorUtils.getGlobalHandler()
        ErrorUtils.setGlobalHandler((error, isFatal) => {
            this.handleError(error, isFatal).then((r) => r)

            // Call original handler in development for better debugging
            if (__DEV__) {
                originalHandler(error, isFatal)
            }
        })

        // Handle unhandled promise rejections
        // Only add this listener if it's available in the environment
        if (
            typeof global !== "undefined" &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            typeof (global as any).addEventListener === "function"
        ) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(global as any).addEventListener(
                "unhandledrejection",
                (event: unknown) => {
                    // Safely try to extract reason from the event
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const rejectionEvent = event as any
                        const reason = rejectionEvent.reason

                        // Create an appropriate error object
                        const error =
                            reason instanceof Error
                                ? reason
                                : new Error(
                                      typeof reason === "string"
                                          ? reason
                                          : "Unhandled Promise rejection",
                                  )

                        this.handleError(error).then((r) => r)
                    } catch (processingError) {
                        // If we can't properly process the event, create a generic error
                        this.handleError(
                            new Error("Failed to process unhandled rejection"),
                        ).then((r) => r)
                        this.logger.error(
                            "Error processing unhandled rejection event",
                            processingError,
                        )
                    }
                },
            )
        }

        this.isInitialized = true
        this.logger.info("Initialized")
    }

    static async handleError(error: Error, isFatal?: boolean): Promise<void> {
        const errorRecord: ErrorRecord = {
            timestamp: new Date().toISOString(),
            name: error.name,
            message: error.message,
            stack: error.stack,
            isFatal,
            context: {
                platform: Platform.OS,
                version: Platform.Version,
            },
        }

        // Log the error
        this.logger.error(
            `${isFatal ? "FATAL " : ""}ERROR: ${error.message}`,
            errorRecord,
        )

        // Store critical/fatal errors for future reporting
        if (
            isFatal ||
            error.name === "SecurityError" ||
            error.name === "SyntaxError"
        ) {
            await this.storeError(errorRecord)
        }
    }

    static async getStoredErrors(): Promise<ErrorRecord[]> {
        try {
            const data = await AsyncStorage.getItem(ERROR_STORAGE_KEY)
            return data ? JSON.parse(data) : []
        } catch (error) {
            this.logger.error("Failed to retrieve stored errors", error)
            return []
        }
    }

    static async clearStoredErrors(): Promise<void> {
        try {
            await AsyncStorage.removeItem(ERROR_STORAGE_KEY)
            this.logger.info("Cleared stored errors")
        } catch (error) {
            this.logger.error("Failed to clear stored errors", error)
        }
    }

    // Create a contextual error
    static createError(message: string, context?: IAppContext): Error {
        const error = new Error(message)
        ;(error as Error & { context?: IAppContext }).context = context
        return error
    }

    private static async storeError(errorRecord: ErrorRecord): Promise<void> {
        try {
            // Get existing errors
            const existingData = await AsyncStorage.getItem(ERROR_STORAGE_KEY)
            const existingErrors: ErrorRecord[] = existingData
                ? JSON.parse(existingData)
                : []

            // Add new error and limit the number stored
            const updatedErrors = [errorRecord, ...existingErrors].slice(
                0,
                MAX_STORED_ERRORS,
            )

            // Store updated list
            await AsyncStorage.setItem(
                ERROR_STORAGE_KEY,
                JSON.stringify(updatedErrors),
            )
        } catch (storageError) {
            // If we can't store the error, at least log it
            this.logger.error("Failed to store error", storageError)
        }
    }
}
