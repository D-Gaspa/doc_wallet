import * as FileSystem from "expo-file-system"
import { DocumentType, IDocument } from "../../types/document"
import { DocumentEncryptionService } from "../security/documentEncryption"
import { LoggingService } from "../monitoring/loggingService"
import { PerformanceMonitoringService } from "../monitoring/performanceMonitoringService"

interface FileMetadata {
    exists: boolean
    uri?: string
    isDirectory?: boolean
}

/**
 * Service for managing document storage, including saving, retrieving, and deleting documents
 */
export class DocumentStorageService {
    private readonly encryptionService: DocumentEncryptionService
    private readonly logger = LoggingService.getLogger("DocumentStorage")
    private readonly documentDirectory: string
    private readonly cacheDirectory: string
    private readonly encryptedDirectory: string
    private readonly documentsDirectory: string

    constructor() {
        this.encryptionService = new DocumentEncryptionService()
        this.documentDirectory = FileSystem.documentDirectory || ""
        this.cacheDirectory = FileSystem.cacheDirectory || ""
        this.encryptedDirectory = `${this.documentDirectory}encrypted/`
        this.documentsDirectory = `${this.documentDirectory}documents/` // New persistent directory for documents
    }

    static async create(): Promise<DocumentStorageService> {
        const service = new DocumentStorageService()
        await service.ensureDirectoriesExist()
        return service
    }

    private async ensureDirectoriesExist(): Promise<void> {
        try {
            await this.ensureDirectoryExists(this.encryptedDirectory)
            await this.ensureDirectoryExists(this.documentsDirectory) // Ensure documents directory exists
            this.logger.debug("Storage directories initialized")
        } catch (error) {
            this.logger.error("Failed to create storage directories", error)
            throw new Error("Failed to initialize document storage")
        }
    }

    private async ensureDirectoryExists(dirUri: string): Promise<void> {
        try {
            const dirInfo = await FileSystem.getInfoAsync(dirUri)
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dirUri, {
                    intermediates: true,
                })
                this.logger.debug(`Created directory: ${dirUri}`)
            }
        } catch (error) {
            this.logger.error(`Failed to create directory ${dirUri}`, error)
            throw error
        }
    }

    /**
     * Save a document file to storage
     * @param sourceUri The URI of the file to save (from document picker or camera)
     * @param documentId The document ID to associate with this file
     * @param shouldEncrypt Whether to encrypt the file
     * @param filename Optional filename (if not provided, will be extracted from sourceUri)
     * @returns The stored document file metadata
     */
    async saveFile(
        sourceUri: string,
        documentId: string,
        shouldEncrypt: boolean = true,
        filename?: string,
    ): Promise<{ uri: string; metadata: FileMetadata }> {
        PerformanceMonitoringService.startMeasure(`save_file_${documentId}`)

        try {
            this.logger.debug(`Saving file for document ${documentId}`)

            const extractedFilename =
                filename ||
                sourceUri.split("/").pop() ||
                `document_${documentId}`

            const sanitizedFilename = extractedFilename.replace(
                /[/:*?"<>|\\]/g,
                "_",
            )

            // Verify we have a file we can work with
            const fileInfo = await FileSystem.getInfoAsync(sourceUri, {
                size: true,
            })
            if (
                !fileInfo.exists ||
                (fileInfo.size !== undefined && fileInfo.size === 0)
            ) {
                throw new Error(`Cannot access file: ${sanitizedFilename}`)
            }

            // Determine the final location for the file
            let finalUri: string

            // If source is from cache, move to permanent storage first
            if (sourceUri.includes(this.cacheDirectory)) {
                // Create the target path in the documents directory
                const permanentPath = `${this.documentsDirectory}${documentId}_${sanitizedFilename}`

                // Copy from cache to permanent location
                await FileSystem.copyAsync({
                    from: sourceUri,
                    to: permanentPath,
                })

                // Verify copy was successful
                const permFileInfo = await FileSystem.getInfoAsync(
                    permanentPath,
                    { size: true },
                )
                if (
                    !permFileInfo.exists ||
                    (permFileInfo.size !== undefined && permFileInfo.size === 0)
                ) {
                    throw new Error("Failed to create permanent copy of file")
                }

                finalUri = permanentPath
                this.logger.debug(
                    `Created permanent copy of file at: ${permanentPath}`,
                )

                // Clean up the cache file if we successfully copied it
                try {
                    await FileSystem.deleteAsync(sourceUri, {
                        idempotent: true,
                    })
                    this.logger.debug(`Cleaned up cache file: ${sourceUri}`)
                } catch (cleanupError) {
                    // Just log cleanup errors, don't fail
                    this.logger.debug(
                        `Failed to clean up cache file: ${sourceUri}`,
                        cleanupError,
                    )
                }
            } else {
                // Source is already from a permanent location
                finalUri = sourceUri
            }

            // Now handle encryption if needed - this encrypts in place at finalUri
            if (shouldEncrypt) {
                const success = await this.encryptionService.encryptDocument(
                    documentId,
                    finalUri,
                )

                if (!success) {
                    throw new Error("File encryption failed")
                }

                this.logger.debug(`File encrypted for document ${documentId}`)
            }

            // Verify the final file still exists
            const savedFileInfo = await FileSystem.getInfoAsync(finalUri, {
                size: true,
            })

            if (
                !savedFileInfo.exists ||
                (savedFileInfo.size !== undefined && savedFileInfo.size === 0)
            ) {
                throw new Error("File was not saved properly")
            }

            this.logger.info(
                `File saved successfully for document ${documentId}`,
            )

            const metadata: FileMetadata = {
                exists: savedFileInfo.exists,
                uri: finalUri,
            }

            PerformanceMonitoringService.endMeasure(`save_file_${documentId}`)
            return {
                uri: finalUri,
                metadata,
            }
        } catch (error) {
            this.logger.error(
                `Failed to save file for document ${documentId}`,
                error,
            )
            PerformanceMonitoringService.endMeasure(`save_file_${documentId}`)
            throw error
        }
    }

    /**
     * Get a file from storage
     * @param documentId The document ID associated with the file
     * @param filename The filename to retrieve
     * @returns The file URI and metadata
     */
    async getFile(
        documentId: string,
        filename: string,
    ): Promise<{ uri: string; metadata: FileMetadata }> {
        PerformanceMonitoringService.startMeasure(`get_file_${documentId}`)

        try {
            this.logger.debug(`Getting file for document ${documentId}`)

            // Check in encrypted directory first
            let fileUri = `${this.encryptedDirectory}${documentId}_${filename}`
            let fileInfo = await FileSystem.getInfoAsync(fileUri, {
                size: true,
            })

            // If not found, check in documents directory
            if (!fileInfo.exists) {
                fileUri = `${this.documentsDirectory}${documentId}_${filename}`
                fileInfo = await FileSystem.getInfoAsync(fileUri, {
                    size: true,
                })

                // If still not found, check the legacy location
                if (!fileInfo.exists) {
                    fileUri = `${this.documentDirectory}${documentId}_${filename}`
                    fileInfo = await FileSystem.getInfoAsync(fileUri, {
                        size: true,
                    })

                    if (!fileInfo.exists) {
                        this.logger.error(
                            `File not found for document ${documentId}`,
                        )
                    }
                }
            }

            const metadata: FileMetadata = {
                exists: fileInfo.exists,
                uri: fileUri,
            }

            this.logger.debug(
                `File retrieved successfully for document ${documentId}`,
            )
            PerformanceMonitoringService.endMeasure(`get_file_${documentId}`)

            return {
                uri: fileUri,
                metadata,
            }
        } catch (error) {
            this.logger.error(
                `Failed to get file for document ${documentId}`,
                error,
            )
            PerformanceMonitoringService.endMeasure(`get_file_${documentId}`)
            throw error
        }
    }

    /**
     * Check if a file exists in storage
     * @param documentId The document ID associated with the file
     * @param filename The filename to check
     * @returns Boolean indicating if the file exists
     */
    async fileExists(documentId: string, filename: string): Promise<boolean> {
        try {
            // Check encrypted directory
            let fileUri = `${this.encryptedDirectory}${documentId}_${filename}`
            let fileInfo = await FileSystem.getInfoAsync(fileUri)
            if (fileInfo.exists) return true

            // Check documents directory
            fileUri = `${this.documentsDirectory}${documentId}_${filename}`
            fileInfo = await FileSystem.getInfoAsync(fileUri)
            if (fileInfo.exists) return true

            // Check legacy directory
            fileUri = `${this.documentDirectory}${documentId}_${filename}`
            fileInfo = await FileSystem.getInfoAsync(fileUri)
            return fileInfo.exists
        } catch (error) {
            this.logger.error(
                `Failed to check if file exists for document ${documentId}`,
                error,
            )
            return false
        }
    }

    /**
     * Delete a document file from storage
     * @param documentId The document ID associated with the file
     * @param filename The filename to delete
     * @returns Boolean indicating success
     */
    async deleteFile(documentId: string, filename: string): Promise<boolean> {
        PerformanceMonitoringService.startMeasure(`delete_file_${documentId}`)

        try {
            this.logger.debug(`Deleting file for document ${documentId}`)

            // Try to delete from encrypted directory
            let fileUri = `${this.encryptedDirectory}${documentId}_${filename}`
            let fileInfo = await FileSystem.getInfoAsync(fileUri)

            if (fileInfo.exists) {
                await FileSystem.deleteAsync(fileUri)
                // Also delete the encryption key
                await this.encryptionService.deleteEncryptedDocument(documentId)

                this.logger.info(
                    `Encrypted file deleted for document ${documentId}`,
                )
                PerformanceMonitoringService.endMeasure(
                    `delete_file_${documentId}`,
                )
                return true
            }

            // Try to delete from documents directory
            fileUri = `${this.documentsDirectory}${documentId}_${filename}`
            fileInfo = await FileSystem.getInfoAsync(fileUri)

            if (fileInfo.exists) {
                await FileSystem.deleteAsync(fileUri)
                this.logger.info(
                    `Unencrypted file deleted for document ${documentId}`,
                )
                PerformanceMonitoringService.endMeasure(
                    `delete_file_${documentId}`,
                )
                return true
            }

            // Try legacy location
            fileUri = `${this.documentDirectory}${documentId}_${filename}`
            fileInfo = await FileSystem.getInfoAsync(fileUri)

            if (fileInfo.exists) {
                await FileSystem.deleteAsync(fileUri)
                this.logger.info(
                    `Legacy file deleted for document ${documentId}`,
                )
                PerformanceMonitoringService.endMeasure(
                    `delete_file_${documentId}`,
                )
                return true
            }

            this.logger.warn(
                `File not found for deletion: document ${documentId}, filename ${filename}`,
            )
            PerformanceMonitoringService.endMeasure(`delete_file_${documentId}`)
            return false
        } catch (error) {
            this.logger.error(
                `Failed to delete file for document ${documentId}`,
                error,
            )
            PerformanceMonitoringService.endMeasure(`delete_file_${documentId}`)
            return false
        }
    }

    /**
     * Import and store a document from picker or camera
     * @param document Document data
     * @param sourceUri Source URI of the file
     * @param encrypt Whether to encrypt the file
     * @returns Updated document with file metadata
     */
    async importAndStoreDocument(
        document: IDocument,
        sourceUri: string,
        encrypt: boolean = true,
    ): Promise<IDocument> {
        const documentId = document.id
        const filename = sourceUri.split("/").pop() || `document_${documentId}`

        try {
            const { uri, metadata } = await this.saveFile(
                sourceUri,
                documentId,
                encrypt,
                filename,
            )

            if (!metadata.exists) {
                throw new Error(`Failed to save document ${filename}`)
            }

            // Return the document with content pointing to our local copy
            // and sourceUri updated to the permanent file location
            return {
                ...document,
                id: documentId,
                sourceUri: uri, // The permanent URI, not the original source
                title: document.title || filename,
                content: encrypt ? `encrypted:${documentId}` : uri,
                metadata: {
                    createdAt:
                        document.metadata.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    type: document.metadata.type || DocumentType.UNKNOWN,
                },
                tags: document.tags || [],
            }
        } catch (error) {
            this.logger.error(
                `Failed to import and store document for ${sourceUri}`,
                error,
            )
            throw error
        }
    }

    /**
     * Prepare a document for preview
     * @param document The document to preview
     * @returns URI that can be used for preview
     */
    async getDocumentTempUri(document: IDocument): Promise<string> {
        try {
            this.logger.debug("Document to preview:", document)

            if (!document.content) {
                this.logger.error("Document has no content to preview")
                throw new Error("Document has no content to preview")
            }

            // Handle encrypted vs non-encrypted documents
            if (document.content.startsWith("encrypted:")) {
                // For encrypted documents, we need to:
                // 1. Find the encrypted file
                // 2. Decrypt it to a temporary location

                const documentId = document.id

                // First check in the documents directory for files with the document ID prefix
                let documentFiles: string[] = []
                try {
                    documentFiles = await FileSystem.readDirectoryAsync(
                        this.documentsDirectory,
                    )
                } catch (error) {
                    this.logger.debug(
                        `Could not read documents directory: ${error}`,
                    )
                }

                // Then check in the encrypted directory
                let encryptedFiles: string[] = []
                try {
                    encryptedFiles = await FileSystem.readDirectoryAsync(
                        this.encryptedDirectory,
                    )
                } catch (error) {
                    this.logger.debug(
                        `Could not read encrypted directory: ${error}`,
                    )
                }

                // Check both directories for files with the document ID prefix
                const allFiles = [...documentFiles, ...encryptedFiles]
                const documentFile = allFiles.find((file) =>
                    file.startsWith(`${documentId}_`),
                )

                if (!documentFile) {
                    // Try another approach - check for the file using the title
                    const titleBasedName = `${documentId}_${document.title?.replace(
                        /[/:*?"<>|\\]/g,
                        "_",
                    )}`

                    let fileUri = `${this.documentsDirectory}${titleBasedName}`
                    let fileInfo = await FileSystem.getInfoAsync(fileUri)

                    if (!fileInfo.exists) {
                        fileUri = `${this.encryptedDirectory}${titleBasedName}`
                        fileInfo = await FileSystem.getInfoAsync(fileUri)

                        if (!fileInfo.exists) {
                            this.logger.error(
                                `Encrypted file not found for document ${documentId}`,
                            )
                            throw new Error("Encrypted file not found")
                        }
                    }

                    // Found the file by constructed name
                    const sanitizedFilename = titleBasedName.replace(
                        /[/:*?"<>|\\]/g,
                        "_",
                    )
                    const previewUri = `${this.cacheDirectory}preview_${sanitizedFilename}`

                    // Check if a preview already exists
                    const previewExists = await FileSystem.getInfoAsync(
                        previewUri,
                    )
                    if (previewExists.exists) {
                        this.logger.debug(
                            `Using existing preview file at ${previewUri}`,
                        )
                        return previewUri
                    }

                    // Decrypt the file to the preview location
                    const success =
                        await this.encryptionService.decryptFileForPreview(
                            documentId,
                            fileUri,
                            previewUri,
                        )

                    if (!success) {
                        this.logger.error(
                            "Document was not decrypted successfully",
                        )
                        throw new Error(
                            "Failed to decrypt document for preview",
                        )
                    }

                    this.logger.debug(
                        `Created decrypted preview file at ${previewUri}`,
                    )
                    return previewUri
                }

                // Found a file in one of the directories
                let fileUri: string
                if (documentFiles.includes(documentFile)) {
                    fileUri = `${this.documentsDirectory}${documentFile}`
                } else {
                    fileUri = `${this.encryptedDirectory}${documentFile}`
                }

                // Create a preview filename
                const sanitizedFilename = documentFile.replace(
                    /[/:*?"<>|\\]/g,
                    "_",
                )
                const previewUri = `${this.cacheDirectory}preview_${sanitizedFilename}`

                // Check if a preview already exists
                const previewExists = await FileSystem.getInfoAsync(previewUri)
                if (previewExists.exists) {
                    this.logger.debug(
                        `Using existing preview file at ${previewUri}`,
                    )
                    return previewUri
                }

                // Decrypt the file to the preview location
                const success =
                    await this.encryptionService.decryptFileForPreview(
                        documentId,
                        fileUri,
                        previewUri,
                    )

                if (!success) {
                    this.logger.error("Document was not decrypted successfully")
                    throw new Error("Failed to decrypt document for preview")
                }

                this.logger.debug(
                    `Created decrypted preview file at ${previewUri}`,
                )
                return previewUri
            } else if (document.sourceUri) {
                // Use the source URI directly if it exists and content is not encrypted
                return document.sourceUri
            } else {
                // Fallback to content if no sourceUri (unlikely but handling the case)
                return document.content
            }
        } catch (error) {
            this.logger.error("Failed to prepare document for preview", error)
            throw error
        }
    }

    /**
     * Delete a specific preview file
     * @param previewUri URI of the preview file to delete
     * @returns Whether the deletion was successful
     */
    async deletePreviewFile(previewUri: string): Promise<boolean> {
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

    /**
     * Clean up temporary preview files
     */
    async cleanupPreviewFiles(): Promise<void> {
        try {
            const cacheFiles = await FileSystem.readDirectoryAsync(
                this.cacheDirectory,
            )
            const previewFiles = cacheFiles.filter((file) =>
                file.startsWith("preview_"),
            )

            for (const file of previewFiles) {
                await FileSystem.deleteAsync(`${this.cacheDirectory}${file}`, {
                    idempotent: true,
                })
            }

            this.logger.debug(
                `Cleaned up ${previewFiles.length} temporary preview files`,
            )
        } catch (error) {
            this.logger.error("Failed to clean up preview files", error)
        }
    }
}

export const documentStorage = DocumentStorageService.create()
