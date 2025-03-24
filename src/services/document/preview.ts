import {
    viewDocument,
    ViewDocumentOptions,
    errorCodes,
    isErrorWithCode,
} from "@react-native-documents/viewer"
import * as FileSystem from "expo-file-system"
import { AppState, Platform } from "react-native"
import { LoggingService } from "../monitoring/loggingService"
import { PerformanceMonitoringService } from "../monitoring/performanceMonitoringService"
import { ErrorTrackingService } from "../monitoring/errorTrackingService"
import { DocumentType } from "../../types/document"
import { generateUniqueId } from "../../utils"

const logger = LoggingService.getLogger("DocumentPreview")

/**
 * Service for previewing documents using the document viewer
 */
export class DocumentPreview {
    private _currentAppStateSubscription?: { remove: () => void }

    /**
     * View a document by its URI
     * @param uri URI of the document to view
     * @param mimeType Optional MIME type of the document (recommended for Android)
     * @param onClose checks when user returns to the app
     * @returns Promise that resolves when document is closed or rejects on error
     */
    async viewDocumentByUri(
        uri: string,
        mimeType?: string,
        onClose?: () => void
    ): Promise<void> {
        PerformanceMonitoringService.startMeasure("view_document")

        try {
            logger.debug(`Opening document preview for URI: ${uri}`)

            const fileInfo = await FileSystem.getInfoAsync(uri)
            if (!fileInfo.exists) {
                logger.error(`File does not exist: ${uri}`)
            }

            const options: ViewDocumentOptions = { uri }

            if (mimeType) {
                options.mimeType = mimeType
            } else {
                const extension = uri.split(".").pop()?.toLowerCase()
                if (extension === "pdf") {
                    options.mimeType = "application/pdf"
                } else if (extension === "jpg" || extension === "jpeg") {
                    options.mimeType = "image/jpeg"
                } else if (extension === "png") {
                    options.mimeType = "image/png"
                }
            }

            if (Platform.OS === "ios") {
                options.headerTitle = uri.split("/").pop() || "Document"
            } else if (Platform.OS === "android") {
                options.grantPermissions = "read"
            }

            if (onClose) {
                const subscription = AppState.addEventListener(
                    "change",
                    (nextAppState) => {
                        if (nextAppState === "active") {
                            subscription.remove()
                            onClose()
                        }
                    }
                )

                this._currentAppStateSubscription = subscription
            }

            await viewDocument(options)

            logger.debug("Document preview closed successfully")
            PerformanceMonitoringService.endMeasure("view_document")
            return
        } catch (error) {
            if (this._currentAppStateSubscription) {
                this._currentAppStateSubscription.remove()
                this._currentAppStateSubscription = undefined
            }
            if (isErrorWithCode(error)) {
                if (error.code === errorCodes.OPERATION_CANCELED) {
                    logger.debug("User canceled document preview")
                    PerformanceMonitoringService.endMeasure("view_document")
                    return
                } else if (error.code === errorCodes.UNABLE_TO_OPEN_FILE_TYPE) {
                    logger.warn("Unable to open file type", error)
                    PerformanceMonitoringService.endMeasure("view_document")
                    throw new Error(
                        "This file type cannot be previewed by the system"
                    )
                } else if (error.code === errorCodes.IN_PROGRESS) {
                    logger.warn(
                        "Another document preview is already in progress"
                    )
                    PerformanceMonitoringService.endMeasure("view_document")
                    throw new Error("Another document preview is already open")
                }
                logger.error(`Document preview error: ${error.code}`, error)
            } else {
                logger.error("Document preview error:", error)
            }
            PerformanceMonitoringService.endMeasure("view_document")
            throw error
        }
    }

    /**
     * View a document using a bookmark (for long-term access)
     * @param bookmark Bookmark string from a previous open operation
     * @param mimeType Optional MIME type for the document
     * @returns Promise that resolves when document is closed or rejects on error
     */
    async viewDocumentByBookmark(
        bookmark: string,
        mimeType?: string
    ): Promise<void> {
        PerformanceMonitoringService.startMeasure("view_document_bookmark")

        try {
            logger.debug("Opening document preview with bookmark")

            const options: ViewDocumentOptions = { bookmark }

            if (mimeType) {
                options.mimeType = mimeType
            }

            // iOS specific options
            if (Platform.OS === "ios") {
                options.headerTitle = "Document"
            }

            await viewDocument(options)

            logger.debug("Bookmark document preview closed successfully")
            PerformanceMonitoringService.endMeasure("view_document_bookmark")
            return
        } catch (error) {
            if (isErrorWithCode(error)) {
                if (error.code === errorCodes.OPERATION_CANCELED) {
                    logger.debug("User canceled document preview")
                    PerformanceMonitoringService.endMeasure(
                        "view_document_bookmark"
                    )
                    return
                }
                logger.error(
                    `Bookmark document preview error: ${error.code}`,
                    error
                )
            } else {
                logger.error("Bookmark document preview error:", error)
            }
            PerformanceMonitoringService.endMeasure("view_document_bookmark")
            throw error
        }
    }

    /**
     * Get appropriate MIME type for a document type
     * @param type DocumentType enum value
     * @returns MIME type string or undefined
     */
    getMimeTypeForDocumentType(type: DocumentType): string | undefined {
        switch (type) {
            case DocumentType.PDF:
                return "application/pdf"
            case DocumentType.IMAGE:
                return "image/jpeg"
            case DocumentType.IMAGE_PNG:
                return "image/png"
            default:
                return undefined
        }
    }

    /**
     * Check if a file type can be previewed by the system
     * This is a best-effort guess as different systems support different file types
     * @param filename Filename with extension to check
     * @returns Boolean indicating if the file is likely to be preview-able
     */
    canPreviewFileType(filename: string): boolean {
        if (!filename) return false

        const extension = filename.split(".").pop()?.toLowerCase()
        if (!extension) return false

        const previewableExtensions = [
            "pdf",
            "doc",
            "docx",
            "ppt",
            "pptx",
            "xls",
            "xlsx",
            "txt",
            "rtf",
            "jpg",
            "jpeg",
            "png",
            "gif",
            "webp",
            "mp3",
            "mp4",
            "mov",
            "wav",
            "m4a",
            "csv",
            "json",
            "xml",
            "html",
            "htm",
        ]

        return previewableExtensions.includes(extension)
    }

    /**
     * Get a more user-friendly error message for preview errors
     * @param error Error from viewDocument
     * @returns User-friendly error message
     */
    getErrorMessage(error: unknown): string {
        if (isErrorWithCode(error)) {
            switch (error.code) {
                case errorCodes.UNABLE_TO_OPEN_FILE_TYPE:
                    return "This file type cannot be previewed. You may need to install an app that can open this file type."
                case errorCodes.IN_PROGRESS:
                    return "Another document is already being previewed. Please close it first."
                case errorCodes.OPERATION_CANCELED:
                    return "Preview was canceled."
                default:
                    return `Error previewing document: ${
                        error.message || "Unknown error"
                    }`
            }
        }

        return "Error previewing document. Please try again."
    }

    /**
     * Create a temporary file for preview purposes
     * Useful when you need to copy a file to cache for preview
     * @param sourceUri Source file URI
     * @param preferredExtension Optional extension for the temp file
     * @returns URI of the temporary file
     */
    async createTemporaryPreviewFile(
        sourceUri: string,
        preferredExtension?: string
    ): Promise<string> {
        try {
            const fileInfo = await FileSystem.getInfoAsync(sourceUri)
            if (!fileInfo.exists) {
                logger.error(`Source file does not exist: ${sourceUri}`)
            }

            const extension =
                preferredExtension || sourceUri.split(".").pop() || "tmp"

            // Generate a unique filename using our custom function instead of Date.now()
            const uniqueId = generateUniqueId()
            const tempFilename = `preview_${uniqueId}.${extension}`
            const tempUri = `${FileSystem.cacheDirectory}${tempFilename}`

            await FileSystem.copyAsync({
                from: sourceUri,
                to: tempUri,
            })

            logger.debug(`Created temporary preview file: ${tempUri}`)

            return tempUri
        } catch (error) {
            logger.error("Failed to create temporary preview file", error)
            throw new Error(`Failed to prepare file for preview ${error}`)
        }
    }

    /**
     * Cleanup temporary preview files
     * Call this periodically to free up cache storage
     */
    async cleanupTemporaryPreviewFiles(): Promise<void> {
        try {
            if (!FileSystem.cacheDirectory) {
                logger.warn("Cache directory not available, skipping cleanup")
                return
            }

            const files = await FileSystem.readDirectoryAsync(
                FileSystem.cacheDirectory
            )

            const previewFiles = files.filter((filename) =>
                filename.startsWith("preview_")
            )

            for (const filename of previewFiles) {
                const fileUri = `${FileSystem.cacheDirectory}${filename}`
                await FileSystem.deleteAsync(fileUri, { idempotent: true })
                logger.debug(`Deleted temporary preview file: ${filename}`)
            }

            logger.info(
                `Cleaned up ${previewFiles.length} temporary preview files`
            )
        } catch (error) {
            logger.error("Failed to cleanup temporary preview files", error)
            await ErrorTrackingService.handleError(error as Error, false)
        }
    }
}

export const documentPreview = new DocumentPreview()
