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

const logger = LoggingService.getLogger("DocumentImport")

export class DocumentImport {
    /**
     * Import documents with specific file types
     * @param options Import options
     * @returns Array of document picker results
     */
    async importDocument(
        options: ImportOptions = {}
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

            const invalidFiles = results.filter(
                (file) => !file.hasRequestedType
            )
            if (invalidFiles.length > 0) {
                logger.warn(
                    "User selected files with invalid types:",
                    invalidFiles.map((f) => f.name || "unknown file")
                )
            }

            const processedResults = await this.processImportResults(
                results,
                allowVirtualFiles
            )

            PerformanceMonitoringService.endMeasure("import_document")
            return processedResults
        } catch (error) {
            if (isErrorWithCode(error)) {
                if (error.code === errorCodes.OPERATION_CANCELED) {
                    logger.debug("User canceled document import")
                    PerformanceMonitoringService.endMeasure("import_document")
                    return []
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
        allowMultiple: boolean = false
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
                false
            )

            PerformanceMonitoringService.endMeasure("import_image")
            return processedResults
        } catch (error) {
            if (
                isErrorWithCode(error) &&
                error.code === errorCodes.OPERATION_CANCELED
            ) {
                logger.debug("User canceled image import")
                PerformanceMonitoringService.endMeasure("import_image")
                return []
            }
            logger.error("Image import error:", error)
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
        allowMultiple: boolean = false
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
                false
            )

            PerformanceMonitoringService.endMeasure("import_pdf")
            return processedResults
        } catch (error) {
            if (
                isErrorWithCode(error) &&
                error.code === errorCodes.OPERATION_CANCELED
            ) {
                logger.debug("User canceled PDF import")
                PerformanceMonitoringService.endMeasure("import_pdf")
                return []
            }
            logger.error("PDF import error:", error)
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
        fileTypes: string[] = [types.pdf, types.images, types.docx]
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
                true
            )

            PerformanceMonitoringService.endMeasure("import_virtual_document")
            return processedResults
        } catch (error) {
            if (
                isErrorWithCode(error) &&
                error.code === errorCodes.OPERATION_CANCELED
            ) {
                logger.debug("User canceled virtual document import")
                PerformanceMonitoringService.endMeasure(
                    "import_virtual_document"
                )
                return []
            }
            logger.error("Virtual document import error:", error)
            PerformanceMonitoringService.endMeasure("import_virtual_document")
            throw error
        }
    }

    /**
     * Process document picker results
     * @param results Document picker results
     * @param handleVirtualFiles Whether to process virtual files
     * @returns Processed file results
     */
    private async processImportResults(
        results: DocumentPickerResponse[],
        handleVirtualFiles: boolean
    ): Promise<ImportFileResult[]> {
        if (results.length === 0) {
            return []
        }

        try {
            const filesToProcess = [...results]
            const processedResults: ImportFileResult[] = []

            const virtualFiles = filesToProcess.filter(
                (file) => file.isVirtual === true
            )
            const regularFiles = filesToProcess.filter(
                (file) => file.isVirtual !== true
            )

            for (const file of regularFiles) {
                processedResults.push({
                    uri: file.uri,
                    name: file.name || `file_${Date.now()}`,
                    size: file.size,
                    type: this.determineDocumentType(file.type),
                    mimeType: file.type,
                })
            }

            if (handleVirtualFiles && virtualFiles.length > 0) {
                const filesToCopy = virtualFiles.map((file) => {
                    const hasConversions =
                        file.convertibleToMimeTypes &&
                        file.convertibleToMimeTypes.length > 0

                    if (hasConversions && file.convertibleToMimeTypes?.[0]) {
                        // We can convert this virtual file to a specific mimetype
                        const virtualFileMeta = file.convertibleToMimeTypes[0]
                        return {
                            uri: file.uri,
                            fileName: `${file.name || `file_${Date.now()}`}.${
                                virtualFileMeta.extension || "tmp"
                            }`,
                            convertVirtualFileToType: virtualFileMeta.mimeType,
                        }
                    } else {
                        // No conversion needed/available
                        return {
                            uri: file.uri,
                            fileName: file.name || `file_${Date.now()}`,
                        }
                    }
                })

                if (filesToCopy.length > 0) {
                    logger.debug(
                        `Making local copies of ${filesToCopy.length} virtual files`
                    )

                    const copyResults = await keepLocalCopy({
                        destination: "cachesDirectory",
                        files: filesToCopy as NonEmptyArray<FileToCopy>,
                    })

                    // Process the copied files
                    for (let i = 0; i < copyResults.length; i++) {
                        const copyResult = copyResults[i]
                        const originalFile = virtualFiles[i]

                        if (copyResult.status === "success") {
                            processedResults.push({
                                uri: originalFile.uri, // Keep the original URI for reference
                                localUri: copyResult.localUri, // Add the local URI for actual use
                                name: filesToCopy[i].fileName,
                                size: originalFile.size,
                                type: this.determineDocumentType(
                                    originalFile.type
                                ),
                                mimeType: originalFile.type,
                            })
                        } else {
                            logger.error(
                                `Failed to copy virtual file: ${copyResult.copyError}`
                            )
                        }
                    }
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
        requestLongTermAccess: boolean = false
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

        // Could add more types here as needed

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
