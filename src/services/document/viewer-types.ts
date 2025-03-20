/**
 * This file contains type definitions to re-exports manually for the @react-native-documents/viewer package
 * this happens because there is an error in library exporting of errors (a ticket has been opened)
 */

export const errorCodes = {
    OPERATION_CANCELED: "OPERATION_CANCELED",
    IN_PROGRESS: "ASYNC_OP_IN_PROGRESS",
    UNABLE_TO_OPEN_FILE_TYPE: "UNABLE_TO_OPEN_FILE_TYPE",
} as const

export interface NativeModuleError extends Error {
    code: (typeof errorCodes)[keyof typeof errorCodes]
}

export function isErrorWithCode(error: unknown): error is NativeModuleError {
    return (
        error !== null &&
        typeof error === "object" &&
        "code" in error &&
        typeof error.code === "string"
    )
}
