import {
    errorCodes,
    isErrorWithCode,
    pick,
    pickDirectory,
    types,
    keepLocalCopy,
    DocumentPickerResponse,
    DirectoryPickerResponse,
} from "@react-native-documents/picker"
import { LoggingService } from "../monitoring/loggingService"
import { PerformanceMonitoringService } from "../monitoring/performanceMonitoringService"
import {
    DocumentType,
    ImportOptions,
    ImportFileResult,
} from "../../types/document"
import { FileToCopy } from "@react-native-documents/picker/src/keepLocalCopy.ts"
import type { NonEmptyArray } from "@react-native-documents/picker/src/types.ts"
import * as FileSystem from "expo-file-system"

const logger = LoggingService.getLogger("DocumentImport")

export class DocumentImport {
    /**
     * Import documents with specific file types
     * @param options Import options
     * @returns Array of document picker results
     */
    async importDocument(
        options: ImportOptions = {},
    ): Promise<ImportFileResult[]> {
        PerformanceMonitoringService.startMeasure("import_document")

        try {
            const {
                allowMultiple = false,
                fileTypes = [types.pdf, types.images, types.docx],
                allowVirtualFiles = true,
            } = options

            logger.debug("Importing document with types:", fileTypes)

            const results = await pick({
                allowMultiSelection: allowMultiple,
                allowVirtualFiles,
                type: fileTypes,
            })

            logger.debug("Imported documents:", results)

            const invalidFiles = results.filter(
                (file) => !file.hasRequestedType,
            )
            if (invalidFiles.length > 0) {
                logger.warn(
                    "User selected files with invalid types:",
                    invalidFiles.map((f) => f.name || "unknown file"),
                )
            }

            const processedResults = await this.processImportResults(
                results,
                allowVirtualFiles,
            )

            logger.debug("Imported processed documents:", processedResults)

            PerformanceMonitoringService.endMeasure("import_document")
            return processedResults
        } catch (error) {
            if (isErrorWithCode(error)) {
                if (error.code === errorCodes.OPERATION_CANCELED) {
                    logger.debug("User canceled document import")
                    PerformanceMonitoringService.endMeasure("import_document")
                    return []
                }

                if (error.code === errorCodes.UNABLE_TO_OPEN_FILE_TYPE) {
                    logger.error(
                        "Unable to open this file type. The system doesn't support it or permissions are missing.",
                        error,
                    )
                    throw new Error(
                        "Unable to open this file type. Please try a different file format or download it to your device first.",
                    )
                }

                logger.error(`Document import error: ${error.code}`, error)
            } else {
                logger.error("Document import error:", error)
            }
            PerformanceMonitoringService.endMeasure("import_document")
            throw error
        }
    }

    /**
     * Import specifically images (photos, screenshots, etc.)
     * @param allowMultiple Whether to allow multiple selection
     * @returns Array of imported image files
     */
    async importImage(
        allowMultiple: boolean = false,
    ): Promise<ImportFileResult[]> {
        PerformanceMonitoringService.startMeasure("import_image")

        try {
            logger.debug("Importing image from gallery")

            const results = await pick({
                allowMultiSelection: allowMultiple,
                type: types.images,
            })

            const processedResults = await this.processImportResults(
                results,
                false,
            )

            PerformanceMonitoringService.endMeasure("import_image")
            return processedResults
        } catch (error) {
            if (isErrorWithCode(error)) {
                if (error.code === errorCodes.OPERATION_CANCELED) {
                    logger.debug("User canceled image import")
                    PerformanceMonitoringService.endMeasure("import_image")
                    return []
                }

                if (error.code === errorCodes.UNABLE_TO_OPEN_FILE_TYPE) {
                    logger.error("Unable to open this image type", error)
                    throw new Error(
                        "Unable to open this image. Please try a different image format.",
                    )
                }

                logger.error(`Image import error: ${error.code}`, error)
            } else {
                logger.error("Image import error:", error)
            }
            PerformanceMonitoringService.endMeasure("import_image")
            throw error
        }
    }

    /**
     * Import PDF documents specifically
     * @param allowMultiple Whether to allow multiple selection
     * @returns Array of imported PDF files
     */
    async importPDF(
        allowMultiple: boolean = false,
    ): Promise<ImportFileResult[]> {
        PerformanceMonitoringService.startMeasure("import_pdf")

        try {
            logger.debug("Importing PDF documents")

            const results = await pick({
                allowMultiSelection: allowMultiple,
                type: types.pdf,
            })

            const processedResults = await this.processImportResults(
                results,
                false,
            )

            PerformanceMonitoringService.endMeasure("import_pdf")
            return processedResults
        } catch (error) {
            if (isErrorWithCode(error)) {
                if (error.code === errorCodes.OPERATION_CANCELED) {
                    logger.debug("User canceled PDF import")
                    PerformanceMonitoringService.endMeasure("import_pdf")
                    return []
                }

                if (error.code === errorCodes.UNABLE_TO_OPEN_FILE_TYPE) {
                    logger.error("Unable to open this PDF file", error)
                    throw new Error(
                        "Unable to open this PDF. The file might be corrupted or protected.",
                    )
                }

                logger.error(`PDF import error: ${error.code}`, error)
            } else {
                logger.error("PDF import error:", error)
            }
            PerformanceMonitoringService.endMeasure("import_pdf")
            throw error
        }
    }

    /**
     * Import documents from cloud or virtual storage (Google Drive, Dropbox, etc.)
     * @param fileTypes Array of file type filters
     * @returns Array of processed file results
     */
    async importVirtualDocument(
        fileTypes: string[] = [types.pdf, types.images, types.docx],
    ): Promise<ImportFileResult[]> {
        PerformanceMonitoringService.startMeasure("import_virtual_document")

        try {
            logger.debug("Importing virtual document")

            const results = await pick({
                allowVirtualFiles: true,
                type: fileTypes,
            })

            const processedResults = await this.processImportResults(
                results,
                true,
            )

            PerformanceMonitoringService.endMeasure("import_virtual_document")
            return processedResults
        } catch (error) {
            if (isErrorWithCode(error)) {
                if (error.code === errorCodes.OPERATION_CANCELED) {
                    logger.debug("User canceled virtual document import")
                    PerformanceMonitoringService.endMeasure(
                        "import_virtual_document",
                    )
                    return []
                }

                if (error.code === errorCodes.UNABLE_TO_OPEN_FILE_TYPE) {
                    logger.error("Unable to open this cloud document", error)
                    throw new Error(
                        "Unable to open this cloud document. Try downloading it to your device first.",
                    )
                }

                logger.error(
                    `Virtual document import error: ${error.code}`,
                    error,
                )
            } else {
                logger.error("Virtual document import error:", error)
            }
            PerformanceMonitoringService.endMeasure("import_virtual_document")
            throw error
        }
    }

    /**
     * Detects if a file is from Google Drive
     * @param uri File uri to check
     * @returns Boolean indicating if it's a Google Drive file
     */
    private isGoogleDriveUri(uri: string): boolean {
        return (
            uri.startsWith("content://") &&
            (uri.includes("com.google.android.apps.docs") ||
                uri.includes("com.google.android.gm"))
        )
    }

    /**
     * Try to create a local copy using direct file system methods
     * @param uri Source URI
     * @param tempFile Destination temp file path
     * @returns Success status
     */
    private async tryDirectCopy(
        uri: string,
        tempFile: string,
    ): Promise<boolean> {
        try {
            logger.debug(`Attempting direct copy from ${uri} to ${tempFile}`)

            await FileSystem.copyAsync({
                from: uri,
                to: tempFile,
            })

            const fileInfo = await FileSystem.getInfoAsync(tempFile, {
                size: true,
            })

            const success =
                fileInfo.exists &&
                fileInfo.size !== undefined &&
                fileInfo.size > 0
            logger.debug(
                `Direct copy ${success ? "successful" : "failed"}: ${tempFile}`,
            )

            return success
        } catch (error) {
            logger.debug(
                `Direct copy failed: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            )
            return false
        }
    }

    /**
     * Create a local copy of file using picker library
     * @param file The source file result from document picker
     * @returns Local URI if successful, null if failed
     */
    private async createLocalCopyOfFile(
        file: DocumentPickerResponse,
    ): Promise<string | null> {
        try {
            if (!file.uri) {
                logger.error("No URI provided for file")
                return null
            }

            if (!file.name) {
                logger.error("No filename provided for file")
                return null
            }

            const tempFilePath = `${FileSystem.cacheDirectory}temp_direct_${file.name}`

            // First try direct copy as it's faster
            const directCopySuccess = await this.tryDirectCopy(
                file.uri,
                tempFilePath,
            )
            if (directCopySuccess) {
                return tempFilePath
            }

            // If direct copy fails, try keepLocalCopy which handles various content providers better
            logger.debug("Direct copy failed, attempting keepLocalCopy...")

            let fileToCopy: FileToCopy

            // Special handling for Google Drive files that support conversion
            if (
                this.isGoogleDriveUri(file.uri) &&
                file.isVirtual &&
                file.convertibleToMimeTypes &&
                file.convertibleToMimeTypes.length > 0
            ) {
                const conversion = file.convertibleToMimeTypes[0]
                logger.debug(
                    `Using conversion for Google Drive file: ${conversion.mimeType}`,
                )

                fileToCopy = {
                    uri: file.uri,
                    fileName: `${file.name || `file_${Date.now()}`}.${
                        conversion.extension || "bin"
                    }`,
                    convertVirtualFileToType: conversion.mimeType,
                }
            } else {
                // Standard file handling
                fileToCopy = {
                    uri: file.uri,
                    fileName: file.name || `file_${Date.now()}`,
                }
            }

            logger.debug(
                `Attempting keepLocalCopy for: ${fileToCopy.uri} as ${fileToCopy.fileName}`,
            )

            // This strange non-empty array type is required by the function definition
            const nonEmptyArray: NonEmptyArray<FileToCopy> = [fileToCopy]

            const copyResults = await keepLocalCopy({
                destination: "cachesDirectory",
                files: nonEmptyArray,
            })

            if (copyResults[0].status === "success") {
                logger.debug(
                    `keepLocalCopy successful: ${copyResults[0].localUri}`,
                )
                return copyResults[0].localUri
            } else {
                logger.error(
                    `keepLocalCopy failed: ${copyResults[0].copyError}`,
                )
                return null
            }
        } catch (error) {
            logger.error("Failed to create local copy of file", error)
            return null
        }
    }

    /**
     * Process document picker results
     * @param results Document picker results
     * @param handleVirtualFiles Whether to process virtual files for special conversions
     * @returns Processed file results
     */
    private async processImportResults(
        results: DocumentPickerResponse[],
        handleVirtualFiles: boolean,
    ): Promise<ImportFileResult[]> {
        if (results.length === 0) {
            return []
        }

        try {
            const filesToProcess = [...results]
            const processedResults: ImportFileResult[] = []

            // Process all files by creating local copies
            for (const file of filesToProcess) {
                // Skip virtual files if not handling them
                if (file.isVirtual === true && !handleVirtualFiles) {
                    logger.debug(
                        `Skipping virtual file ${
                            file.name || "unnamed"
                        } as handleVirtualFiles is false`,
                    )
                    continue
                }

                // Create a local copy for all files
                const localUri = await this.createLocalCopyOfFile(file)

                if (localUri) {
                    // Successfully created local copy
                    processedResults.push({
                        uri: file.uri, // Keep original URI for reference
                        localUri: localUri, // Local URI for actual use
                        name: file.name || `file_${Date.now()}`,
                        size: file.size,
                        type: this.determineDocumentType(file.type),
                        mimeType: file.type,
                    })

                    logger.debug(
                        `Successfully processed file: ${file.name || "unnamed"}`,
                    )
                } else {
                    logger.error(
                        `Failed to create local copy for file: ${
                            file.name || "unnamed file"
                        }`,
                    )
                }
            }

            return processedResults
        } catch (error) {
            logger.error("Error processing import results", error)
            throw error
        }
    }

    /**
     * Select a directory
     * @param requestLongTermAccess Whether to request long-term access
     * @returns Directory selection result or null if canceled
     */
    async selectDirectory(
        requestLongTermAccess: boolean = false,
    ): Promise<DirectoryPickerResponse | null> {
        try {
            logger.debug("Selecting directory")

            return await pickDirectory({
                requestLongTermAccess,
            })
        } catch (error) {
            if (
                isErrorWithCode(error) &&
                error.code === errorCodes.OPERATION_CANCELED
            ) {
                logger.debug("User canceled directory selection")
                return null
            }
            logger.error("Directory selection error:", error)
            throw error
        }
    }

    /**
     * Determine document type based on MIME type or file extension
     * @param mimeType MIME type string
     * @returns DocumentType enum value
     */
    private determineDocumentType(mimeType: string | null): DocumentType {
        if (!mimeType) return DocumentType.UNKNOWN

        if (mimeType === "application/pdf") {
            return DocumentType.PDF
        }

        if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
            return DocumentType.IMAGE
        }

        if (mimeType === "image/png") {
            return DocumentType.IMAGE_PNG
        }

        // Add more types as needed

        return DocumentType.UNKNOWN
    }

    /**
     * Get a file's extension from its name or URI
     * @param nameOrUri Filename or URI
     * @returns File extension (lowercase) or empty string
     */
    getFileExtension(nameOrUri: string): string {
        const parts = nameOrUri.split(".")
        return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : ""
    }

    /**
     * Get a file's base name from its URI
     * @param uri File URI
     * @returns Base filename without path
     */
    getFileNameFromUri(uri: string): string {
        return uri.split("/").pop() || `file_${Date.now()}`
    }
}

export const documentImport = new DocumentImport()
