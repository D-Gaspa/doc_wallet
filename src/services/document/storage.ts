import * as FileSystem from "expo-file-system"
import { DocumentType, IDocument } from "../../types/document" // Ensure IDocument includes storedFilename? field
import { DocumentEncryptionService } from "../security/documentEncryption"
import { LoggingService } from "../monitoring/loggingService"
import { PerformanceMonitoringService } from "../monitoring/performanceMonitoringService"

interface FileMetadata {
    exists: boolean
    uri: string
    isDirectory?: boolean
    size?: number
}

// noinspection ExceptionCaughtLocallyJS
/**
 * Service for managing document storage, including saving, retrieving, and deleting documents
 */
export class DocumentStorageService {
    // Make properties readonly but accessible within the class
    private readonly encryptionService: DocumentEncryptionService
    private readonly logger = LoggingService.getLogger("DocumentStorage")
    private readonly documentDirectory: string
    private readonly cacheDirectory: string
    private readonly encryptedDirectory: string
    private readonly documentsDirectory: string
    private isInitialized: Promise<boolean> // Promise to track initialization status

    constructor() {
        this.encryptionService = new DocumentEncryptionService()
        this.documentDirectory = FileSystem.documentDirectory ?? ""
        this.cacheDirectory = FileSystem.cacheDirectory ?? ""

        if (!this.documentDirectory) {
            this.logger.error(
                "FileSystem.documentDirectory is null! Storage functionality will be severely limited.",
            )
        }
        // Define storage subdirectories relative to the base document directory
        this.encryptedDirectory = this.documentDirectory
            ? `${this.documentDirectory}encrypted/`
            : ""
        this.documentsDirectory = this.documentDirectory
            ? `${this.documentDirectory}documents/`
            : ""

        if (!this.encryptedDirectory || !this.documentsDirectory) {
            this.logger.error(
                "Could not define storage subdirectories! Storage functionality will be severely limited.",
            )
        }
        // Start initialization asynchronously
        this.isInitialized = this.initializeDirectories()
    }

    // Public method to await initialization if needed elsewhere
    async ensureInitialized(): Promise<boolean> {
        return this.isInitialized
    }

    // Private method to handle the actual directory creation logic
    private async initializeDirectories(): Promise<boolean> {
        // Guard against attempting to create dirs if paths are invalid/missing
        if (
            !this.documentDirectory ||
            !this.encryptedDirectory ||
            !this.documentsDirectory
        ) {
            this.logger.error(
                "Cannot initialize directories - base paths missing.",
            )
            return false // Indicate initialization failed
        }
        try {
            // Use Promise.all for concurrent checks/creations
            await Promise.all([
                this.ensureDirectoryExists(this.encryptedDirectory),
                this.ensureDirectoryExists(this.documentsDirectory),
            ])
            this.logger.debug(
                "Storage directories checked/initialized successfully.",
            )
            return true // Indicate success
        } catch (error) {
            this.logger.error(
                "Failed to create storage directories during initialization",
                error,
            )
            return false // Indicate failure
        }
    }

    // ensureDirectoryExists remains private as it's an internal helper
    private async ensureDirectoryExists(dirUri: string): Promise<void> {
        if (!dirUri) return // Should not happen if initializeDirectories checks first
        try {
            const dirInfo = await FileSystem.getInfoAsync(dirUri)
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dirUri, {
                    intermediates: true,
                })
                this.logger.debug(`Created directory: ${dirUri}`)
            }
        } catch (error) {
            this.logger.error(
                `Failed to ensure directory exists ${dirUri}`,
                error,
            )
            throw error // Propagate error up
        }
    }

    /**
     * Save a document file to storage, ensuring consistency.
     */
    async saveFile(
        sourceUri: string,
        documentId: string,
        shouldEncrypt: boolean = true,
        filename?: string,
    ): Promise<{ uri: string; metadata: FileMetadata; finalFilename: string }> {
        const operationName = `save_file_${documentId}`
        PerformanceMonitoringService.startMeasure(operationName)

        // Await initialization before proceeding with file operations
        const initialized = await this.ensureInitialized()
        if (!initialized) {
            this.logger.error("Storage not initialized, cannot save file.")
            throw new Error("Storage service failed to initialize.")
        }
        const baseFilename =
            filename || sourceUri.split("/").pop() || `doc_${documentId}`
        const finalFilename = `${documentId}_${baseFilename.replace(
            /[/:*?"<>|\\]/g,
            "_",
        )}`

        try {
            this.logger.debug(
                `Processing file for doc ${documentId}. Target filename: ${finalFilename}`,
            )
            const sourceInfo = await FileSystem.getInfoAsync(sourceUri, {
                size: true,
            })
            if (
                !sourceInfo.exists ||
                (sourceInfo.size !== undefined && sourceInfo.size === 0)
            ) {
                throw new Error(
                    `Source file inaccessible or empty: ${sourceUri}`,
                )
            }

            let finalTargetUri: string
            let intermediateCopyPath: string | null = null
            const permanentUnencryptedPath = `${this.documentsDirectory}${finalFilename}`

            if (
                sourceUri.includes(
                    this.cacheDirectory || "ExponentFileCache",
                ) ||
                shouldEncrypt
            ) {
                intermediateCopyPath = permanentUnencryptedPath
                await FileSystem.copyAsync({
                    from: sourceUri,
                    to: intermediateCopyPath,
                })
                const copyInfo = await FileSystem.getInfoAsync(
                    intermediateCopyPath,
                    { size: true },
                )
                if (!copyInfo.exists || copyInfo.size === 0) {
                    throw new Error(`Failed intermediate copy`)
                }
                this.logger.debug(
                    `Intermediate copy created: ${intermediateCopyPath}`,
                )
                if (
                    sourceUri.includes(
                        this.cacheDirectory || "ExponentFileCache",
                    )
                ) {
                    await FileSystem.deleteAsync(sourceUri, {
                        idempotent: true,
                    }).catch((e) =>
                        this.logger.warn(
                            `Failed cache cleanup ${sourceUri}`,
                            e,
                        ),
                    )
                }
            } else {
                intermediateCopyPath = null // No intermediate copy made
                finalTargetUri = sourceUri // Tentatively use original (will be reassigned if encrypting)
                this.logger.debug(
                    `Using original source URI directly: ${finalTargetUri}`,
                )
            }

            if (shouldEncrypt) {
                finalTargetUri = `${this.encryptedDirectory}${finalFilename}`
                const fileToEncrypt = intermediateCopyPath ?? sourceUri // Encrypt the copy if made, else original

                this.logger.debug(
                    `Copying ${fileToEncrypt} to final encrypted destination ${finalTargetUri}`,
                )
                await FileSystem.copyAsync({
                    from: fileToEncrypt,
                    to: finalTargetUri,
                })
                const finalCopyInfo = await FileSystem.getInfoAsync(
                    finalTargetUri,
                    { size: true },
                )
                if (!finalCopyInfo.exists || finalCopyInfo.size === 0) {
                    throw new Error(
                        `Failed copy to final encrypted location ${finalTargetUri}`,
                    )
                }

                this.logger.debug(`Encrypting file in place: ${finalTargetUri}`)
                const success = await this.encryptionService.encryptDocument(
                    documentId,
                    finalTargetUri, // Encrypt the file at its final destination
                )
                if (!success) {
                    throw new Error("File encryption failed")
                }
                this.logger.debug(
                    `File encrypted successfully at: ${finalTargetUri}`,
                )

                // Clean up intermediate copy if it was created *and* wasn't the original source
                if (
                    intermediateCopyPath &&
                    intermediateCopyPath !== sourceUri
                ) {
                    await FileSystem.deleteAsync(intermediateCopyPath, {
                        idempotent: true,
                    }).catch((e) =>
                        this.logger.warn(
                            `Failed intermediate cleanup ${intermediateCopyPath}`,
                            e,
                        ),
                    )
                    this.logger.debug(
                        `Cleaned up intermediate unencrypted file: ${intermediateCopyPath}`,
                    )
                }
            } else {
                // If not encrypting, the final URI is the intermediate copy or original source
                finalTargetUri = intermediateCopyPath ?? sourceUri
                this.logger.debug(
                    `File saved without encryption: ${finalTargetUri}`,
                )
            }

            // --- Step 3: Final Verification ---
            const savedFileInfo = await FileSystem.getInfoAsync(
                finalTargetUri,
                { size: true },
            )
            if (
                !savedFileInfo.exists ||
                (savedFileInfo.size !== undefined && savedFileInfo.size === 0)
            ) {
                await FileSystem.deleteAsync(finalTargetUri, {
                    idempotent: true,
                }).catch((e) =>
                    this.logger.warn(`Cleanup failed ${finalTargetUri}`, e),
                )
                throw new Error(
                    `File verification failed after save process at ${finalTargetUri}`,
                )
            }

            this.logger.info(
                `File processed successfully for document ${documentId} at ${finalTargetUri}`,
            )
            const metadata: FileMetadata = {
                exists: savedFileInfo.exists,
                uri: finalTargetUri,
                size: savedFileInfo.size,
            }
            PerformanceMonitoringService.endMeasure(operationName)
            return {
                uri: finalTargetUri,
                metadata,
                finalFilename: finalFilename,
            }
        } catch (error) {
            this.logger.error(
                `Failed to save file for document ${documentId}`,
                error,
            )
            PerformanceMonitoringService.endMeasure(operationName)
            throw error
        }
    }

    async getDocumentTempUri(document: IDocument): Promise<string> {
        const operationName = `get_preview_uri_${document.id}`
        PerformanceMonitoringService.startMeasure(operationName)

        // Await initialization before proceeding
        const initialized = await this.ensureInitialized()
        if (!initialized) {
            this.logger.error("Storage not initialized, cannot get temp URI.")
            throw new Error("Storage service failed to initialize.")
        }

        try {
            this.logger.debug("Preparing preview for document:", document.id)
            if (!document.content && !document.sourceUri) {
                throw new Error(
                    "Document has no content reference for preview.",
                )
            }

            const filenameToFind = document.storedFilename
            if (!filenameToFind) {
                this.logger.error(
                    `Stored filename missing for document ${document.id}. Cannot reliably find file.`,
                )
                throw new Error(
                    `Stored filename is missing for document ${document.id}.`,
                )
            }

            let fileUri: string | null = null
            const pathsToCheck = [
                this.encryptedDirectory
                    ? `${this.encryptedDirectory}${filenameToFind}`
                    : null,
                this.documentsDirectory
                    ? `${this.documentsDirectory}${filenameToFind}`
                    : null,
                this.documentDirectory
                    ? `${this.documentDirectory}${filenameToFind}`
                    : null, // Legacy
            ].filter((p) => p !== null) as string[]

            for (const path of pathsToCheck) {
                try {
                    const fileInfo = await FileSystem.getInfoAsync(path)
                    if (fileInfo.exists) {
                        fileUri = path
                        this.logger.debug(
                            `Found file for preview at: ${fileUri}`,
                        )
                        break
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (e) {
                    /* ignore */
                }
            }

            if (!fileUri) {
                this.logger.error(
                    `File not found using stored filename: ${filenameToFind}`,
                )
                throw new Error(
                    `File for document ${document.id} not found in storage.`,
                )
            }

            const needsDecryption =
                document.content === `encrypted:${document.id}` &&
                fileUri.startsWith(this.encryptedDirectory)

            if (needsDecryption) {
                this.logger.debug(`Decrypting ${fileUri} for preview`)
                const previewFilename = `preview_${filenameToFind}`
                const previewUri = `${this.cacheDirectory}${previewFilename}`
                const previewExistsInfo = await FileSystem.getInfoAsync(
                    previewUri,
                    { size: true },
                )

                if (
                    previewExistsInfo.exists &&
                    previewExistsInfo.size &&
                    previewExistsInfo.size > 0
                ) {
                    this.logger.debug(
                        `Using existing preview file at ${previewUri}`,
                    )
                    PerformanceMonitoringService.endMeasure(operationName)
                    return previewUri
                }

                const success =
                    await this.encryptionService.decryptFileForPreview(
                        document.id,
                        fileUri,
                        previewUri,
                    )
                if (!success) {
                    this.logger.error(
                        `Decryption failed for document ${document.id}`,
                    )
                    throw new Error("Failed to decrypt document for preview")
                }

                this.logger.debug(
                    `Created decrypted preview file at ${previewUri}`,
                )
                PerformanceMonitoringService.endMeasure(operationName)
                return previewUri
            } else if (
                fileUri.startsWith(this.documentsDirectory) ||
                fileUri.startsWith(this.documentDirectory)
            ) {
                this.logger.debug(
                    `Using non-encrypted file directly: ${fileUri}`,
                )
                PerformanceMonitoringService.endMeasure(operationName)
                return fileUri
            } else if (
                document.sourceUri &&
                !document.content?.startsWith("encrypted:")
            ) {
                this.logger.warn(
                    `Using document.sourceUri as fallback for ${document.id}`,
                )
                PerformanceMonitoringService.endMeasure(operationName)
                return document.sourceUri
            } else {
                throw new Error(
                    `Unexpected state for document ${document.id} - file found at ${fileUri} but mismatch.`,
                )
            }
        } catch (error) {
            this.logger.error(
                `Failed to prepare document preview for ${document.id}:`,
                error,
            )
            PerformanceMonitoringService.endMeasure(operationName)
            throw error
        }
    }

    async getFile(
        documentId: string,
        storedFilename: string,
    ): Promise<{ uri: string; metadata: FileMetadata } | null> {
        if (!storedFilename) {
            this.logger.error(
                `Cannot get file: storedFilename missing for document ${documentId}`,
            )
            return null
        }
        const pathsToCheck = [
            this.encryptedDirectory
                ? `${this.encryptedDirectory}${storedFilename}`
                : null,
            this.documentsDirectory
                ? `${this.documentsDirectory}${storedFilename}`
                : null,
            this.documentDirectory
                ? `${this.documentDirectory}${storedFilename}`
                : null,
        ].filter((p) => p !== null) as string[]
        for (const path of pathsToCheck) {
            try {
                const fileInfo = await FileSystem.getInfoAsync(path, {
                    size: true,
                })
                if (fileInfo.exists) {
                    this.logger.debug(`File found for getFile at ${path}`)
                    return {
                        uri: path,
                        metadata: {
                            exists: true,
                            uri: path,
                            size: fileInfo.size,
                        },
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                /* Ignore */
            }
        }
        this.logger.warn(`File not found for getFile: ${storedFilename}`)
        return null
    }
    async deleteFile(
        documentId: string,
        storedFilename: string,
    ): Promise<boolean> {
        if (!storedFilename) {
            this.logger.error(
                `Cannot delete file: storedFilename missing for document ${documentId}`,
            )
            return false
        }
        const pathsToCheck = [
            this.encryptedDirectory
                ? `${this.encryptedDirectory}${storedFilename}`
                : null,
            this.documentsDirectory
                ? `${this.documentsDirectory}${storedFilename}`
                : null,
            this.documentDirectory
                ? `${this.documentDirectory}${storedFilename}`
                : null,
        ].filter((p) => p !== null) as string[]
        let deleted = false
        for (const path of pathsToCheck) {
            try {
                const fileInfo = await FileSystem.getInfoAsync(path)
                if (fileInfo.exists) {
                    await FileSystem.deleteAsync(path, { idempotent: true })
                    this.logger.info(`Deleted file at ${path}`)
                    deleted = true
                    if (path.startsWith(this.encryptedDirectory)) {
                        await this.encryptionService.deleteEncryptedDocument(
                            documentId,
                        )
                    }
                    break
                }
            } catch (error) {
                this.logger.error(`Failed to delete file at ${path}`, error)
                return false
            }
        }
        if (!deleted) {
            this.logger.warn(
                `File not found for deletion with storedFilename: ${storedFilename}`,
            )
        }
        return deleted
    }
    async importAndStoreDocument(
        document: Omit<IDocument, "storedFilename"> & { id: string },
        sourceUri: string,
        encrypt: boolean = true,
    ): Promise<IDocument> {
        const documentId = document.id
        const baseFilename =
            document.title || sourceUri.split("/").pop() || `doc_${documentId}`
        try {
            const {
                uri: finalUri,
                metadata,
                finalFilename,
            } = await this.saveFile(
                sourceUri,
                documentId,
                encrypt,
                baseFilename,
            )
            if (!metadata.exists) {
                throw new Error(`Failed to save document ${finalFilename}`)
            }
            return {
                ...document,
                id: documentId,
                sourceUri: finalUri,
                title: document.title || baseFilename,
                content: encrypt ? `encrypted:${documentId}` : finalUri,
                storedFilename: finalFilename,
                metadata: {
                    ...(document.metadata || {}),
                    createdAt:
                        document.metadata?.createdAt ||
                        new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    type: document.metadata?.type || DocumentType.UNKNOWN,
                },
                tags: document.tags || [],
                parameters: document.parameters || [],
            }
        } catch (error) {
            this.logger.error(
                `Failed to import and store document from ${sourceUri}`,
                error,
            )
            throw error
        }
    }
    async deletePreviewFile(previewUri: string): Promise<boolean> {
        if (
            !this.cacheDirectory ||
            !previewUri.startsWith(this.cacheDirectory)
        ) {
            this.logger.warn(
                `Attempted to delete non-cache file as preview: ${previewUri}`,
            )
            return false
        }
        try {
            this.logger.debug(`Deleting preview file: ${previewUri}`)
            const fileInfo = await FileSystem.getInfoAsync(previewUri)
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(previewUri, { idempotent: true })
                this.logger.debug(
                    `Preview file deleted successfully: ${previewUri}`,
                )
                return true
            }
            this.logger.debug(
                `Preview file not found for deletion: ${previewUri}`,
            )
            return false
        } catch (error) {
            this.logger.error(
                `Failed to delete preview file: ${previewUri}`,
                error,
            )
            return false
        }
    }
    async cleanupPreviewFiles(): Promise<void> {
        if (!this.cacheDirectory) return
        try {
            const cacheFiles = await FileSystem.readDirectoryAsync(
                this.cacheDirectory,
            )
            const previewFiles = cacheFiles.filter((file) =>
                file.startsWith("preview_"),
            )
            let deletedCount = 0
            for (const file of previewFiles) {
                try {
                    await FileSystem.deleteAsync(
                        `${this.cacheDirectory}${file}`,
                        { idempotent: true },
                    )
                    deletedCount++
                } catch (e) {
                    this.logger.warn(
                        `Failed to delete single preview file: ${file}`,
                        e,
                    )
                }
            }
            if (deletedCount > 0) {
                this.logger.debug(
                    `Cleaned up ${deletedCount} temporary preview files`,
                )
            }
        } catch (error) {
            this.logger.error("Failed to clean up preview files", error)
        }
    }
}

export const documentStorage = new DocumentStorageService()
