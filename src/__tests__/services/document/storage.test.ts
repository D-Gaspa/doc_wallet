import * as FileSystem from "expo-file-system"

jest.mock("expo-file-system", () => ({
    documentDirectory: "file:///document/",
    cacheDirectory: "file:///cache/",
    makeDirectoryAsync: jest
        .fn()
        .mockImplementation(() => Promise.resolve(undefined)),
    getInfoAsync: jest.fn().mockImplementation(() =>
        Promise.resolve({
            exists: true,
            uri: "file:///document/encrypted/",
            isDirectory: true,
        })
    ),
    deleteAsync: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    copyAsync: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    readDirectoryAsync: jest
        .fn()
        .mockImplementation(() => Promise.resolve(["file1.pdf", "file2.jpg"])),
    readAsStringAsync: jest
        .fn()
        .mockImplementation(() => Promise.resolve("file-content")),
    writeAsStringAsync: jest
        .fn()
        .mockImplementation(() => Promise.resolve(undefined)),
    EncodingType: {
        Base64: "base64",
    },
}))

jest.mock("../../../services/security/documentEncryption", () => ({
    DocumentEncryptionService: jest.fn().mockImplementation(() => ({
        encryptDocument: jest
            .fn()
            .mockImplementation(() => Promise.resolve(true)),
        decryptDocument: jest
            .fn()
            .mockImplementation(() => Promise.resolve("decrypted content")),
        decryptFileForPreview: jest
            .fn()
            .mockImplementation(() => Promise.resolve(true)),
        deleteEncryptedDocument: jest
            .fn()
            .mockImplementation(() => Promise.resolve(true)),
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

import { DocumentType, IDocument } from "../../../types/document"
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
    documentsDirectory: string
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

            ;(
                FileSystem.makeDirectoryAsync as jest.Mock
            ).mockImplementationOnce(() =>
                Promise.reject(new Error("Failed to create directory"))
            )

            await expect(DocumentStorageService.create()).rejects.toThrow(
                "Failed to initialize document storage"
            )
        })
    })

    describe("saveFile", () => {
        it("should handle cache file source correctly", async () => {
            const sourceUri = "file:///cache/temp_file.pdf"
            const documentId = "doc123"

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({ exists: true, uri: sourceUri, size: 12345 })
            )

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({
                    exists: true,
                    uri: "file:///document/documents/doc123_temp_file.pdf",
                    size: 12345,
                })
            )

            await documentStorage.saveFile(sourceUri, documentId, true)

            expect(FileSystem.copyAsync).toHaveBeenCalledWith({
                from: sourceUri,
                to: expect.stringContaining("documents/doc123_temp_file.pdf"),
            })

            expect(FileSystem.deleteAsync).toHaveBeenCalledWith(sourceUri, {
                idempotent: true,
            })
        })

        it("should handle invalid source file", async () => {
            const sourceUri = "file:///temp/test.pdf"
            const documentId = "doc123"

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({ exists: true, uri: sourceUri, size: 0 })
            )

            await expect(
                documentStorage.saveFile(sourceUri, documentId)
            ).rejects.toThrow("Cannot access file")
        })
    })

    describe("getFile", () => {
        it("should retrieve a file from documents directory", async () => {
            const documentId = "doc123"
            const filename = "test.pdf"

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({
                    exists: true,
                    uri: "file:///document/documents/doc123_test.pdf",
                    size: 1024,
                })
            )

            const result = await documentStorage.getFile(documentId, filename)

            expect(result).toEqual({
                uri: expect.stringContaining("doc123_test.pdf"),
                metadata: {
                    exists: true,
                    uri: expect.stringContaining("doc123_test.pdf"),
                },
            })

            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith("get_file_doc123")
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("get_file_doc123")
        })

        it("should retrieve a file from encrypted directory if not in documents", async () => {
            const documentId = "doc123"
            const filename = "test.pdf"

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({
                    exists: false,
                    uri: "file:///document/documents/doc123_test.pdf",
                })
            )

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({
                    exists: true,
                    uri: "file:///document/encrypted/doc123_test.pdf",
                    size: 1024,
                })
            )

            const result = await documentStorage.getFile(documentId, filename)

            expect(result).toEqual({
                uri: expect.stringContaining(
                    "file:///document/documents/doc123_test.pdf"
                ),
                metadata: {
                    exists: true,
                    uri: expect.stringContaining(
                        "file:///document/documents/doc123_test.pdf"
                    ),
                },
            })
        })

        it("should check legacy location if file not found in primary locations", async () => {
            const documentId = "doc123"
            const filename = "test.pdf"

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({
                    exists: false,
                    uri: "file:///document/documents/doc123_test.pdf",
                })
            )

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({
                    exists: false,
                    uri: "file:///document/encrypted/doc123_test.pdf",
                })
            )

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({
                    exists: true,
                    uri: "file:///document/doc123_test.pdf",
                    size: 1024,
                })
            )

            const result = await documentStorage.getFile(documentId, filename)

            expect(result).toEqual({
                uri: "file:///document/doc123_test.pdf",
                metadata: {
                    exists: true,
                    uri: "file:///document/doc123_test.pdf",
                },
            })
        })

        it("should return metadata with exists: false when file not found", async () => {
            const documentId = "doc123"
            const filename = "missing.pdf"

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementation(() =>
                Promise.resolve({
                    exists: false,
                    uri: expect.stringContaining("doc123_missing.pdf"),
                })
            )

            const result = await documentStorage.getFile(documentId, filename)

            expect(result.metadata.exists).toBe(false)
        })
    })

    describe("importAndStoreDocument", () => {
        it("should import, store and return updated document for PDF", async () => {
            // Updated document structure with required metadata field
            const document: Partial<IDocument> = {
                id: "doc123",
                title: "Test Document",
                sourceUri: "",
                metadata: {
                    createdAt: "",
                    updatedAt: "",
                },
            }
            const sourceUri = "file:///temp/document.pdf"

            jest.spyOn(documentStorage, "saveFile").mockImplementationOnce(() =>
                Promise.resolve({
                    uri: "file:///document/documents/doc123_document.pdf",
                    metadata: {
                        exists: true,
                        uri: "file:///document/documents/doc123_document.pdf",
                    },
                })
            )

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({
                    exists: true,
                    uri: sourceUri,
                    size: 12345,
                })
            )

            const result = await documentStorage.importAndStoreDocument(
                document as IDocument,
                sourceUri,
                true
            )

            expect(result).toMatchObject({
                id: "doc123",
                title: "Test Document",
                content: "encrypted:doc123",
                sourceUri: "file:///document/documents/doc123_document.pdf",
                metadata: expect.objectContaining({
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                    type: expect.any(String),
                }),
            })

            expect(documentStorage.saveFile).toHaveBeenCalledWith(
                sourceUri,
                "doc123",
                true,
                "document.pdf"
            )
        })

        it("should handle errors during import", async () => {
            // Updated document structure with required metadata field
            const document: Partial<IDocument> = {
                id: "doc123",
                title: "Error Doc",
                sourceUri: "",
                metadata: {
                    createdAt: "",
                    updatedAt: "",
                },
            }
            const sourceUri = "file:///temp/doc.pdf"

            jest.spyOn(documentStorage, "saveFile").mockImplementationOnce(() =>
                Promise.reject(new Error("Import error"))
            )

            await expect(
                documentStorage.importAndStoreDocument(
                    document as IDocument,
                    sourceUri
                )
            ).rejects.toThrow("Import error")
        })
    })

    describe("getDocumentTempUri", () => {
        it("should return direct content path for non-encrypted documents", async () => {
            // Updated document structure with required metadata field
            const document: IDocument = {
                id: "doc123",
                title: "Non-encrypted",
                content: "file:///document/doc123_file.pdf",
                sourceUri: "file:///document/doc123_file.pdf",
                tags: [],
                metadata: {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    type: DocumentType.PDF,
                },
            }

            const result = await documentStorage.getDocumentTempUri(document)
            expect(result).toBe("file:///document/doc123_file.pdf")
        })

        it("should create a preview copy for encrypted documents", async () => {
            // Updated document structure with required metadata field
            const document: IDocument = {
                id: "doc123",
                title: "Encrypted",
                content: "encrypted:doc123",
                sourceUri: "file:///document/encrypted/doc123_file.pdf",
                tags: [],
                metadata: {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    type: DocumentType.PDF,
                },
            }

            ;(
                FileSystem.readDirectoryAsync as jest.Mock
            ).mockImplementationOnce(() =>
                Promise.resolve(["doc123_file.pdf", "other.pdf"])
            )

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({
                    exists: true,
                    uri: "file:///document/documents/doc123_file.pdf",
                })
            )

            mockEncryptionService.decryptFileForPreview.mockImplementationOnce(
                () => Promise.resolve(true)
            )

            const result = await documentStorage.getDocumentTempUri(document)
            expect(result).toMatch(/preview_.*\.pdf/)
        })
    })

    describe("deleteFile", () => {
        it("should delete file from encrypted directory and return true", async () => {
            const documentId = "doc123"
            const filename = "test.pdf"

            // Mock file existing in encrypted directory
            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.resolve({
                    exists: true,
                    uri: "file:///document/encrypted/doc123_test.pdf",
                })
            )

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
        })
    })

    // Other tests remain similar but with updated document structure
})
