/**
 * Complete test suite for DocumentStorageService
 */

// We need to set up mocks BEFORE importing the service class
import * as FileSystem from "expo-file-system"

// Mock all dependencies before any imports
jest.mock("expo-file-system", () => ({
    documentDirectory: "file:///document/",
    cacheDirectory: "file:///cache/",
    makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
    getInfoAsync: jest
        .fn()
        .mockResolvedValue({
            exists: true,
            uri: "file:///document/encrypted/",
            isDirectory: true,
        }),
    deleteAsync: jest.fn().mockResolvedValue(undefined),
    copyAsync: jest.fn().mockResolvedValue(undefined),
    readDirectoryAsync: jest.fn().mockResolvedValue(["file1.pdf", "file2.jpg"]),
}))

jest.mock("../../../services/security/documentEncryption", () => ({
    DocumentEncryptionService: jest.fn().mockImplementation(() => ({
        encryptDocument: jest.fn().mockResolvedValue(true),
        decryptDocument: jest.fn().mockResolvedValue("decrypted content"),
        deleteEncryptedDocument: jest.fn().mockResolvedValue(true),
        keyPrefix: "mock_encryption_key_",
        logger: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        },
    })),
}))

jest.mock("../../../services/monitoring/loggingService", () => ({
    LoggingService: {
        getLogger: jest.fn().mockReturnValue({
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        }),
    },
}))

jest.mock("../../../services/monitoring/performanceMonitoringService", () => ({
    PerformanceMonitoringService: {
        startMeasure: jest.fn(),
        endMeasure: jest.fn(),
    },
}))

// Now import the classes AFTER mocking
import { DocumentType } from "../../../types/document"
import { DocumentStorageService } from "../../../services/document/storage"
import { DocumentEncryptionService } from "../../../services/security/documentEncryption"
import { PerformanceMonitoringService } from "../../../services/monitoring/performanceMonitoringService"

// Define type for private access
type DocumentStorageServiceWithPrivateAccess = {
    encryptionService: DocumentEncryptionService
    logger: {
        debug: (message: string, ...args: unknown[]) => void
        info: (message: string, ...args: unknown[]) => void
        warn: (message: string, ...args: unknown[]) => void
        error: (message: string, error?: unknown) => void
    }
}

describe("DocumentStorageService", () => {
    let documentStorage: DocumentStorageService
    let mockEncryptionService: jest.Mocked<DocumentEncryptionService>

    beforeAll(() => {
        ;(FileSystem.getInfoAsync as jest.Mock).mockImplementation(
            async (path: string) => {
                if (path.includes("encrypted")) {
                    return { exists: true, uri: path, isDirectory: true }
                }
                return { exists: true, uri: path, isDirectory: true }
            }
        )
    })

    beforeEach(async () => {
        jest.clearAllMocks()

        ;(FileSystem.getInfoAsync as jest.Mock).mockImplementation(
            async (path: string) => {
                if (path.includes("encrypted")) {
                    return { exists: true, uri: path, isDirectory: true }
                }
                return { exists: true, uri: path, isDirectory: true }
            }
        )

        documentStorage = await DocumentStorageService.create()

        mockEncryptionService = (
            documentStorage as unknown as DocumentStorageServiceWithPrivateAccess
        ).encryptionService as jest.Mocked<DocumentEncryptionService>
    })

    describe("initialization", () => {
        it("should initialize correctly", () => {
            expect(documentStorage).toBeDefined()
        })

        it("should create necessary directories on initialization", async () => {
            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(
                async (path: string) => {
                    if (path === "file:///document/encrypted/") {
                        return { exists: false, uri: path, isDirectory: false }
                    }
                    return { exists: true, uri: path, isDirectory: true }
                }
            )

            await DocumentStorageService.create()

            expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
                "file:///document/encrypted/",
                { intermediates: true }
            )
        })

        it("should handle directory creation errors", async () => {
            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(
                async () => ({
                    exists: false,
                    uri: "file:///document/encrypted/",
                })
            )

            ;(FileSystem.makeDirectoryAsync as jest.Mock).mockRejectedValueOnce(
                new Error("Failed to create directory")
            )

            await expect(DocumentStorageService.create()).rejects.toThrow(
                "Failed to initialize document storage"
            )
        })
    })

    describe("saveFile", () => {
        it("should save a file and return metadata", async () => {
            const sourceUri = "file:///temp/test.pdf"
            const documentId = "doc123"

            // Mock file existence check
            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({ exists: true, uri: sourceUri })
            )

            // Mock saved file info
            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({
                    exists: true,
                    uri: "file:///document/encrypted/doc123_test.pdf",
                })
            )

            const result = await documentStorage.saveFile(
                sourceUri,
                documentId,
                true
            )

            expect(FileSystem.copyAsync).toHaveBeenCalledWith({
                from: sourceUri,
                to: "file:///document/encrypted/doc123_test.pdf",
            })

            expect(mockEncryptionService.encryptDocument).toHaveBeenCalled()

            expect(result).toEqual({
                uri: "file:///document/encrypted/doc123_test.pdf",
                metadata: {
                    exists: true,
                    uri: "file:///document/encrypted/doc123_test.pdf",
                },
            })

            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith("save_file_doc123")
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("save_file_doc123")
        })

        it("should save without encryption when specified", async () => {
            const sourceUri = "file:///temp/test.pdf"
            const documentId = "doc123"

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({ exists: true, uri: sourceUri })
            )

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({
                    exists: true,
                    uri: "file:///document/doc123_test.pdf",
                })
            )

            await documentStorage.saveFile(
                sourceUri,
                documentId,
                false,
                "test.pdf"
            )

            expect(FileSystem.copyAsync).toHaveBeenCalledWith({
                from: sourceUri,
                to: "file:///document/doc123_test.pdf",
            })

            expect(mockEncryptionService.encryptDocument).not.toHaveBeenCalled()
        })

        it("should return metadata with exists: false when source file does not exist", async () => {
            const sourceUri = "file:///temp/missing.pdf"
            const documentId = "doc123"

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: false,
                uri: sourceUri,
            })
            const loggerSpy = jest.spyOn(
                (
                    documentStorage as unknown as {
                        logger: {
                            error: (message: string, error?: unknown) => void
                        }
                    }
                ).logger,
                "error"
            )

            const result = await documentStorage.saveFile(sourceUri, documentId)

            expect(result).toEqual({
                uri: "",
                metadata: { exists: false },
            })

            expect(loggerSpy).toHaveBeenCalledWith(
                `Source file does not exist: ${sourceUri}`
            )
        })

        it("should handle file copy errors", async () => {
            const sourceUri = "file:///temp/test.pdf"
            const documentId = "doc123"

            // Mock file existence check
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri: sourceUri,
            })

            // Mock copy failure
            ;(FileSystem.copyAsync as jest.Mock).mockRejectedValueOnce(
                new Error("Copy failed")
            )

            await expect(
                documentStorage.saveFile(sourceUri, documentId)
            ).rejects.toThrow("Copy failed")
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("save_file_doc123")
        })
    })

    describe("getFile", () => {
        it("should retrieve a file from encrypted directory", async () => {
            const documentId = "doc123"
            const filename = "test.pdf"

            // Mock file existence check in encrypted directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri: "file:///document/encrypted/doc123_test.pdf",
                size: 1024,
            })

            const result = await documentStorage.getFile(documentId, filename)

            expect(result).toEqual({
                uri: "file:///document/encrypted/doc123_test.pdf",
                metadata: {
                    exists: true,
                    uri: "file:///document/encrypted/doc123_test.pdf",
                },
            })

            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith("get_file_doc123")
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("get_file_doc123")
        })

        it("should retrieve a file from document directory if not in encrypted", async () => {
            const documentId = "doc123"
            const filename = "test.pdf"

            // Mock file not existing in encrypted directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: false,
                uri: "file:///document/encrypted/doc123_test.pdf",
            })

            // Mock file existing in regular document directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri: "file:///document/doc123_test.pdf",
                size: 1024,
            })

            const result = await documentStorage.getFile(documentId, filename)

            expect(result).toEqual({
                uri: "file:///document/doc123_test.pdf",
                metadata: {
                    exists: true,
                    uri: "file:///document/doc123_test.pdf",
                },
            })
        })

        it("should throw error when file not found in any directory", async () => {
            const documentId = "doc123"
            const filename = "missing.pdf"

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: false,
                uri: "file:///document/encrypted/doc123_missing.pdf",
            })

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: false,
                uri: "file:///document/doc123_missing.pdf",
            })

            const loggerSpy = jest.spyOn(
                (
                    documentStorage as unknown as {
                        logger: {
                            error: (message: string, error?: unknown) => void
                        }
                    }
                ).logger,
                "error"
            )

            const result = await documentStorage.getFile(documentId, filename)

            expect(result.metadata).toEqual({
                exists: false,
                uri: "file:///document/doc123_missing.pdf",
            })

            expect(loggerSpy).toHaveBeenCalledWith(
                `File not found for document ${documentId}`
            )
        })
    })

    describe("fileExists", () => {
        it("should return true when file exists in encrypted directory", async () => {
            const documentId = "doc123"
            const filename = "test.pdf"

            // Mock file existing in encrypted directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri: "file:///document/encrypted/doc123_test.pdf",
            })

            const result = await documentStorage.fileExists(
                documentId,
                filename
            )

            expect(result).toBe(true)
        })

        it("should return true when file exists in document directory", async () => {
            const documentId = "doc123"
            const filename = "test.pdf"

            // Mock file not existing in encrypted directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: false,
                uri: "file:///document/encrypted/doc123_test.pdf",
            })

            // Mock file existing in document directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri: "file:///document/doc123_test.pdf",
            })

            const result = await documentStorage.fileExists(
                documentId,
                filename
            )

            expect(result).toBe(true)
        })

        it("should return false when file does not exist in either directory", async () => {
            const documentId = "doc123"
            const filename = "missing.pdf"

            // Mock file not existing in encrypted directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: false,
                uri: "file:///document/encrypted/doc123_missing.pdf",
            })

            // Mock file not existing in document directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: false,
                uri: "file:///document/doc123_missing.pdf",
            })

            const result = await documentStorage.fileExists(
                documentId,
                filename
            )

            expect(result).toBe(false)
        })

        it("should handle errors and return false", async () => {
            const documentId = "doc123"
            const filename = "test.pdf"

            // Mock error when checking
            ;(FileSystem.getInfoAsync as jest.Mock).mockRejectedValueOnce(
                new Error("Check failed")
            )

            const result = await documentStorage.fileExists(
                documentId,
                filename
            )

            expect(result).toBe(false)
        })
    })

    describe("deleteFile", () => {
        it("should delete file from encrypted directory and return true", async () => {
            const documentId = "doc123"
            const filename = "test.pdf"

            // Mock file existing in encrypted directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri: "file:///document/encrypted/doc123_test.pdf",
            })

            const result = await documentStorage.deleteFile(
                documentId,
                filename
            )

            expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
                "file:///document/encrypted/doc123_test.pdf"
            )
            expect(
                mockEncryptionService.deleteEncryptedDocument
            ).toHaveBeenCalledWith(documentId)
            expect(result).toBe(true)

            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith("delete_file_doc123")
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("delete_file_doc123")
        })

        it("should delete file from document directory and return true", async () => {
            const documentId = "doc123"
            const filename = "test.pdf"

            // Mock file not existing in encrypted directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: false,
                uri: "file:///document/encrypted/doc123_test.pdf",
            })

            // Mock file existing in document directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri: "file:///document/doc123_test.pdf",
            })

            const result = await documentStorage.deleteFile(
                documentId,
                filename
            )

            expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
                "file:///document/doc123_test.pdf"
            )
            expect(
                mockEncryptionService.deleteEncryptedDocument
            ).not.toHaveBeenCalled()
            expect(result).toBe(true)
        })

        it("should return false when file not found", async () => {
            const documentId = "doc123"
            const filename = "missing.pdf"

            // Mock file not existing in either directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: false,
                uri: "file:///document/encrypted/doc123_missing.pdf",
            })

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: false,
                uri: "file:///document/doc123_missing.pdf",
            })

            const result = await documentStorage.deleteFile(
                documentId,
                filename
            )

            expect(FileSystem.deleteAsync).not.toHaveBeenCalled()
            expect(result).toBe(false)
        })

        it("should handle errors and return false", async () => {
            const documentId = "doc123"
            const filename = "test.pdf"

            // Mock file existing in encrypted directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri: "file:///document/encrypted/doc123_test.pdf",
            })

            // Mock delete failure
            ;(FileSystem.deleteAsync as jest.Mock).mockRejectedValueOnce(
                new Error("Delete failed")
            )

            const result = await documentStorage.deleteFile(
                documentId,
                filename
            )

            expect(result).toBe(false)
        })
    })

    describe("createDocumentMetadata", () => {
        it("should create metadata object with correct properties", () => {
            const documentId = "doc123"
            const fileMetadata = {
                exists: true,
                uri: "file:///document/doc123_test.pdf",
            }
            const type = DocumentType.PDF

            const result = documentStorage.createDocumentMetadata(
                documentId,
                fileMetadata,
                type
            )

            expect(result).toEqual([
                {
                    id: "doc123_path",
                    documentId: "doc123",
                    key: "filePath",
                    value: "file:///document/doc123_test.pdf",
                    type: "string",
                    isSearchable: false,
                    isSystem: true,
                },
                {
                    id: "doc123_type",
                    documentId: "doc123",
                    key: "fileType",
                    value: type,
                    type: "string",
                    isSearchable: true,
                    isSystem: true,
                },
            ])
        })
    })

    describe("importAndStoreDocument", () => {
        it("should import, store and return updated document for PDF", async () => {
            const document = { title: "Test Document" }
            const sourceUri = "file:///temp/document.pdf"
            const mockTimestamp = 1672531200000

            const originalDateNow = Date.now

            Date.now = jest.fn(() => mockTimestamp)

            jest.spyOn(documentStorage, "saveFile").mockResolvedValue({
                uri: "file:///document/encrypted/123_document.pdf",
                metadata: {
                    exists: true,
                    uri: "file:///document/encrypted/123_document.pdf",
                },
            })

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
                exists: true,
                uri: sourceUri,
            })

            const result = await documentStorage.importAndStoreDocument(
                document,
                sourceUri,
                true
            )

            expect(result).toMatchObject({
                id: mockTimestamp.toString(),
                title: "Test Document",
                content: `encrypted:${mockTimestamp}`,
                type: DocumentType.PDF,
                tags: [],
            })

            expect(documentStorage.saveFile).toHaveBeenCalledWith(
                sourceUri,
                mockTimestamp.toString(),
                true,
                "document.pdf"
            )

            Date.now = originalDateNow
        })

        it("should detect image types correctly", async () => {
            // Mock saveFile implementation
            const realSaveFile = documentStorage.saveFile
            documentStorage.saveFile = jest
                .fn()
                .mockImplementation(async (sourceUri, documentId) => {
                    return {
                        uri: `file:///document/encrypted/${documentId}_file.jpg`,
                        metadata: {
                            exists: true,
                            uri: `file:///document/encrypted/${documentId}_file.jpg`,
                        },
                    }
                })

            // Test JPG
            let result = await documentStorage.importAndStoreDocument(
                { title: "Image 1" },
                "file:///temp/image.jpg"
            )
            expect(result.type).toBe(DocumentType.IMAGE)

            // Test PNG
            result = await documentStorage.importAndStoreDocument(
                { title: "Image 2" },
                "file:///temp/image.png"
            )
            expect(result.type).toBe(DocumentType.IMAGE_PNG)

            // Restore the original method
            documentStorage.saveFile = realSaveFile
        })

        it("should use document ID if provided", async () => {
            // Mock saveFile implementation
            const realSaveFile = documentStorage.saveFile
            documentStorage.saveFile = jest
                .fn()
                .mockImplementation(async (sourceUri, documentId) => {
                    return {
                        uri: `file:///document/encrypted/${documentId}_file.pdf`,
                        metadata: {
                            exists: true,
                            uri: `file:///document/encrypted/${documentId}_file.pdf`,
                        },
                    }
                })

            const result = await documentStorage.importAndStoreDocument(
                { id: "custom-id", title: "Custom ID Doc" },
                "file:///temp/doc.pdf"
            )

            expect(result.id).toBe("custom-id")

            // Restore the original method
            documentStorage.saveFile = realSaveFile
        })

        it("should handle errors during import", async () => {
            // Mock saveFile to throw error
            const realSaveFile = documentStorage.saveFile
            documentStorage.saveFile = jest
                .fn()
                .mockRejectedValue(new Error("Import error"))

            await expect(
                documentStorage.importAndStoreDocument(
                    { title: "Error Doc" },
                    "file:///temp/doc.pdf"
                )
            ).rejects.toThrow("Import error")

            // Restore the original method
            documentStorage.saveFile = realSaveFile
        })
    })

    describe("prepareDocumentForPreview", () => {
        it("should return content directly for non-encrypted documents", async () => {
            const document = {
                id: "doc123",
                title: "Non-encrypted",
                content: "file:///document/doc123_file.pdf",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                type: DocumentType.PDF,
                tags: [],
            }

            const result = await documentStorage.prepareDocumentForPreview(
                document
            )

            expect(result).toBe("file:///document/doc123_file.pdf")
        })

        it("should create a preview copy for encrypted documents", async () => {
            const document = {
                id: "doc123",
                title: "Encrypted",
                content: "encrypted:doc123",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                type: DocumentType.PDF,
                tags: [],
            }

            // Mock reading directory to find the file
            ;(FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValueOnce(
                ["doc123_file.pdf", "other.pdf"]
            )

            const result = await documentStorage.prepareDocumentForPreview(
                document
            )

            expect(FileSystem.copyAsync).toHaveBeenCalledWith({
                from: "file:///document/encrypted/doc123_file.pdf",
                to: "file:///cache/preview_doc123_file.pdf",
            })

            expect(result).toBe("file:///cache/preview_doc123_file.pdf")
        })

        it("should detect image types correctly", async () => {
            jest.spyOn(documentStorage, "saveFile").mockImplementation(
                async (sourceUri, documentId) => {
                    return {
                        uri: `file:///document/encrypted/${documentId}_file.jpg`,
                        metadata: {
                            exists: true,
                            uri: `file:///document/encrypted/${documentId}_file.jpg`,
                        },
                    }
                }
            )

            const mockTimestamp = 1672531200000
            const originalDateNow = Date.now
            Date.now = jest.fn(() => mockTimestamp)

            const jpegResult = await documentStorage.importAndStoreDocument(
                { title: "Test Image" },
                "file:///temp/image.jpeg",
                true
            )

            expect(jpegResult.type).toBe(DocumentType.IMAGE)

            const jpgResult = await documentStorage.importAndStoreDocument(
                { title: "Test Image" },
                "file:///temp/image.jpg",
                true
            )

            expect(jpgResult.type).toBe(DocumentType.IMAGE)

            const pngResult = await documentStorage.importAndStoreDocument(
                { title: "Test Image" },
                "file:///temp/image.png",
                true
            )

            expect(pngResult.type).toBe(DocumentType.IMAGE_PNG)

            Date.now = originalDateNow
            jest.restoreAllMocks()
        })
    })

    describe("cleanupPreviewFiles", () => {
        it("should delete all preview files", async () => {
            // Mock reading directory with some preview files
            ;(FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValueOnce(
                ["preview_doc1.pdf", "preview_doc2.jpg", "other_file.txt"]
            )

            await documentStorage.cleanupPreviewFiles()

            // Should only delete the preview files
            expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(2)
            expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
                "file:///cache/preview_doc1.pdf",
                { idempotent: true }
            )
            expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
                "file:///cache/preview_doc2.jpg",
                { idempotent: true }
            )
        })

        it("should handle errors during cleanup", async () => {
            // Mock reading directory to throw error
            ;(FileSystem.readDirectoryAsync as jest.Mock).mockRejectedValueOnce(
                new Error("Read error")
            )

            // Should not throw but log the error
            await expect(
                documentStorage.cleanupPreviewFiles()
            ).resolves.not.toThrow()
        })
    })
})
