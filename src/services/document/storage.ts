import * as FileSystem from "expo-file-system"
import {
    DocumentType,
    IDocument,
    IDocumentMetadata,
} from "../../types/document"
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

    constructor() {
        this.encryptionService = new DocumentEncryptionService()
        this.documentDirectory = FileSystem.documentDirectory || ""
        this.cacheDirectory = FileSystem.cacheDirectory || ""
        this.encryptedDirectory = `${this.documentDirectory}encrypted/`
    }

    static async create(): Promise<DocumentStorageService> {
        const service = new DocumentStorageService()
        await service.ensureDirectoriesExist()
        return service
    }

    private async ensureDirectoriesExist(): Promise<void> {
        try {
            await this.ensureDirectoryExists(this.encryptedDirectory)
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
        filename?: string
    ): Promise<{ uri: string; metadata: FileMetadata }> {
        PerformanceMonitoringService.startMeasure(`save_file_${documentId}`)

        try {
            this.logger.debug(`Saving file for document ${documentId}`)

            const fileInfo = await FileSystem.getInfoAsync(sourceUri)
            if (fileInfo.exists) {
                const extractedFilename =
                    filename ||
                    sourceUri.split("/").pop() ||
                    `document_${documentId}`
                const baseDirectory = shouldEncrypt
                    ? this.encryptedDirectory
                    : this.documentDirectory
                const targetUri = `${baseDirectory}${documentId}_${extractedFilename}`
                this.logger.debug(
                    `Copying file from ${sourceUri} to ${targetUri}`
                )
                await FileSystem.copyAsync({
                    from: sourceUri,
                    to: targetUri,
                })
                const savedFileInfo = await FileSystem.getInfoAsync(targetUri, {
                    size: true,
                })
                if (shouldEncrypt) {
                    const encryptionKey =
                        Math.random().toString(36).substring(2, 15) +
                        Math.random().toString(36).substring(2, 15)

                    await this.encryptionService.encryptDocument(
                        documentId,
                        encryptionKey
                    )

                    this.logger.debug(
                        `Encryption key stored for document ${documentId}`
                    )
                }
                this.logger.info(
                    `File saved successfully for document ${documentId}`
                )
                const metadata: FileMetadata = {
                    exists: savedFileInfo.exists,
                    uri: targetUri,
                }
                PerformanceMonitoringService.endMeasure(
                    `save_file_${documentId}`
                )
                return {
                    uri: targetUri,
                    metadata,
                }
            } else {
                this.logger.error(`Source file does not exist: ${sourceUri}`)
                return {
                    uri: "",
                    metadata: { exists: false },
                }
            }
        } catch (error) {
            this.logger.error(
                `Failed to save file for document ${documentId}`,
                error
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
        filename: string
    ): Promise<{ uri: string; metadata: FileMetadata }> {
        PerformanceMonitoringService.startMeasure(`get_file_${documentId}`)

        try {
            this.logger.debug(`Getting file for document ${documentId}`)

            // Check in encrypted directory first
            let fileUri = `${this.encryptedDirectory}${documentId}_${filename}`
            let fileInfo = await FileSystem.getInfoAsync(fileUri, {
                size: true,
            })

            // If not found, check in document directory
            if (!fileInfo.exists) {
                fileUri = `${this.documentDirectory}${documentId}_${filename}`
                fileInfo = await FileSystem.getInfoAsync(fileUri, {
                    size: true,
                })

                if (!fileInfo.exists) {
                    this.logger.error(
                        `File not found for document ${documentId}`
                    )
                }
            }

            const metadata: FileMetadata = {
                exists: fileInfo.exists,
                uri: fileUri,
            }

            this.logger.debug(
                `File retrieved successfully for document ${documentId}`
            )
            PerformanceMonitoringService.endMeasure(`get_file_${documentId}`)

            return {
                uri: fileUri,
                metadata,
            }
        } catch (error) {
            this.logger.error(
                `Failed to get file for document ${documentId}`,
                error
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
            let fileUri = `${this.encryptedDirectory}${documentId}_${filename}`
            let fileInfo = await FileSystem.getInfoAsync(fileUri)

            if (fileInfo.exists) return true

            fileUri = `${this.documentDirectory}${documentId}_${filename}`
            fileInfo = await FileSystem.getInfoAsync(fileUri)

            return fileInfo.exists
        } catch (error) {
            this.logger.error(
                `Failed to check if file exists for document ${documentId}`,
                error
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
                    `Encrypted file deleted for document ${documentId}`
                )
                PerformanceMonitoringService.endMeasure(
                    `delete_file_${documentId}`
                )
                return true
            }

            // Try to delete from document directory
            fileUri = `${this.documentDirectory}${documentId}_${filename}`
            fileInfo = await FileSystem.getInfoAsync(fileUri)

            if (fileInfo.exists) {
                await FileSystem.deleteAsync(fileUri)
                this.logger.info(
                    `Unencrypted file deleted for document ${documentId}`
                )
                PerformanceMonitoringService.endMeasure(
                    `delete_file_${documentId}`
                )
                return true
            }

            this.logger.warn(
                `File not found for deletion: document ${documentId}, filename ${filename}`
            )
            PerformanceMonitoringService.endMeasure(`delete_file_${documentId}`)
            return false
        } catch (error) {
            this.logger.error(
                `Failed to delete file for document ${documentId}`,
                error
            )
            PerformanceMonitoringService.endMeasure(`delete_file_${documentId}`)
            return false
        }
    }

    /**
     * Create metadata for a document file
     * @param documentId The document ID
     * @param fileMetadata The file metadata
     * @param type The document type
     * @returns Document metadata object
     */
    createDocumentMetadata(
        documentId: string,
        fileMetadata: FileMetadata,
        type: DocumentType
    ): IDocumentMetadata[] {
        return [
            {
                id: `${documentId}_path`,
                documentId,
                key: "filePath",
                value: fileMetadata.uri,
                type: "string",
                isSearchable: false,
                isSystem: true,
            },
            {
                id: `${documentId}_type`,
                documentId,
                key: "fileType",
                value: type,
                type: "string",
                isSearchable: true,
                isSystem: true,
            },
        ]
    }

    /**
     * Import and store a document from picker or camera
     * @param document Document data
     * @param sourceUri Source URI of the file
     * @param encrypt Whether to encrypt the file
     * @returns Updated document with file metadata
     */
    async importAndStoreDocument(
        document: Partial<IDocument>,
        sourceUri: string,
        encrypt: boolean = true
    ): Promise<IDocument> {
        const documentId = document.id || Date.now().toString()
        const filename = sourceUri.split("/").pop() || `document_${documentId}`

        try {
            const extension = filename.split(".").pop()?.toLowerCase()
            let documentType = DocumentType.UNKNOWN

            if (extension === "pdf") {
                documentType = DocumentType.PDF
            } else if (["jpg", "jpeg", "png"].includes(extension || "")) {
                documentType =
                    extension === "png"
                        ? DocumentType.IMAGE_PNG
                        : DocumentType.IMAGE
            }

            const { metadata } = await this.saveFile(
                sourceUri,
                documentId,
                encrypt,
                filename
            )

            // TODO: Add the storing of the document type data
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const documentMetadata = this.createDocumentMetadata(
                documentId,
                metadata,
                documentType
            )

            return {
                id: documentId,
                title: document.title || filename,
                content: encrypt ? `encrypted:${documentId}` : sourceUri,
                createdAt: document.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                type: documentType,
                tags: document.tags || [],
            }
        } catch (error) {
            this.logger.error(
                `Failed to import and store document for ${sourceUri}`,
                error
            )
            throw error
        }
    }

    /**
     * Prepare a document for preview
     * @param document The document to preview
     * @returns URI that can be used for preview
     */
    async prepareDocumentForPreview(document: IDocument): Promise<string> {
        try {
            if (!document.content?.startsWith("encrypted:")) {
                return document.content
            }

            const documentId = document.content.split(":")[1]

            const files = await FileSystem.readDirectoryAsync(
                this.encryptedDirectory
            )
            const documentFile = files.find((file) =>
                file.startsWith(`${documentId}_`)
            )

            if (!documentFile) {
                this.logger.error("File not found for encrypted document")
            }

            const fileUri = `${this.encryptedDirectory}${documentFile}`

            const previewUri = `${this.cacheDirectory}preview_${documentFile}`

            await FileSystem.copyAsync({
                from: fileUri,
                to: previewUri,
            })

            this.logger.debug(`Created temporary preview file at ${previewUri}`)

            return previewUri
        } catch (error) {
            this.logger.error("Failed to prepare document for preview", error)
            throw error
        }
    }

    /**
     * Clean up temporary preview files
     */
    async cleanupPreviewFiles(): Promise<void> {
        try {
            const cacheFiles = await FileSystem.readDirectoryAsync(
                this.cacheDirectory
            )
            const previewFiles = cacheFiles.filter((file) =>
                file.startsWith("preview_")
            )

            for (const file of previewFiles) {
                await FileSystem.deleteAsync(`${this.cacheDirectory}${file}`, {
                    idempotent: true,
                })
            }

            this.logger.debug(
                `Cleaned up ${previewFiles.length} temporary preview files`
            )
        } catch (error) {
            this.logger.error("Failed to clean up preview files", error)
        }
    }
}

export const documentStorage = DocumentStorageService.create()
