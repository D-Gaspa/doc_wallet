import { DocumentStorageService } from "../../services/document/storage"
import { DocumentEncryptionService } from "../../services/security/documentEncryption"
import { DocumentType } from "../../types/document"
import { useDocStore } from "../../store"

// Mock dependencies
jest.mock("@react-native-async-storage/async-storage", () => ({
    getItem: jest.fn().mockImplementation(() => Promise.resolve(null)),
    setItem: jest.fn().mockImplementation(() => Promise.resolve()),
    removeItem: jest.fn().mockImplementation(() => Promise.resolve()),
    clear: jest.fn().mockImplementation(() => Promise.resolve()),
}))

jest.mock("expo-notifications", () => ({
    scheduleNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
}))

jest.mock("../../services/security/documentEncryption", () => {
    const mockEncryptService = {
        encryptDocument: jest
            .fn()
            .mockImplementation(() => Promise.resolve(true)),
        decryptDocument: jest
            .fn()
            .mockImplementation((id) =>
                Promise.resolve(`Decrypted content for ${id}`),
            ),
        decryptFileForPreview: jest
            .fn()
            .mockImplementation(() => Promise.resolve(true)),
        deleteEncryptedDocument: jest
            .fn()
            .mockImplementation(() => Promise.resolve(true)),
    }

    return {
        DocumentEncryptionService: jest.fn(() => mockEncryptService),
    }
})

// Mock the document storage service
jest.mock("../../services/document/storage", () => {
    const mockStorageService = {
        saveFile: jest.fn().mockImplementation(() =>
            Promise.resolve({
                uri: "file:///document/documents/mock-id_document.pdf",
                metadata: {
                    exists: true,
                    uri: "file:///document/documents/mock-id_document.pdf",
                },
            }),
        ),
        getFile: jest.fn().mockImplementation(() =>
            Promise.resolve({
                uri: "file:///document/documents/mock-id_document.pdf",
                metadata: {
                    exists: true,
                    uri: "file:///document/documents/mock-id_document.pdf",
                },
            }),
        ),
        deleteFile: jest.fn().mockImplementation(() => Promise.resolve(true)),
        getDocumentTempUri: jest
            .fn()
            .mockImplementation(() =>
                Promise.resolve("file:///cache/preview_document.pdf"),
            ),
        importAndStoreDocument: jest.fn().mockImplementation((doc) =>
            Promise.resolve({
                ...doc,
                content: doc.sourceUri ? `encrypted:${doc.id}` : doc.content,
                sourceUri: "file:///document/documents/mock-id_document.pdf",
                metadata: {
                    ...doc.metadata,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            }),
        ),
        cleanupPreviewFiles: jest
            .fn()
            .mockImplementation(() => Promise.resolve()),
        fileExists: jest.fn().mockImplementation(() => Promise.resolve(true)),
    }

    return {
        documentStorage: Promise.resolve(mockStorageService),
        DocumentStorageService: {
            create: jest
                .fn()
                .mockImplementation(() => Promise.resolve(mockStorageService)),
        },
    }
})

// Mock the utils module for generateUniqueId
jest.mock("../../utils", () => ({
    generateUniqueId: jest.fn().mockReturnValue("mock-id"),
}))

// Mock the monitoring services
jest.mock("../../services/monitoring/loggingService", () => ({
    LoggingService: {
        getLogger: jest.fn().mockReturnValue({
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        }),
    },
}))

jest.mock("../../services/monitoring/performanceMonitoringService", () => ({
    PerformanceMonitoringService: {
        startMeasure: jest.fn(),
        endMeasure: jest.fn(),
    },
}))

describe("Document Store", () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Reset store state
        useDocStore.getState().documents = []
        useDocStore.getState().selectedDocument = null
        useDocStore.getState().isLoading = false
        useDocStore.getState().error = null
    })

    describe("Basic document operations", () => {
        test("should add documents with encryption", async () => {
            const store = useDocStore.getState()
            const initialCount = store.documents.length

            const newDoc = await store.addDocument({
                title: "Test Document",
                content: "Test Content",
                sourceUri: "file:///temp/document.pdf",
                tags: [],
                metadata: {
                    createdAt: "",
                    updatedAt: "",
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            })

            // Verify document was added with the right properties
            const updatedStore = useDocStore.getState()
            expect(updatedStore.documents.length).toBe(initialCount + 1)
            expect(updatedStore.documents[0].title).toBe("Test Document")
            expect(updatedStore.documents[0].content).toBe(
                `encrypted:${newDoc.id}`,
            )
            expect(updatedStore.documents[0].sourceUri).toBe(
                "file:///document/documents/mock-id_document.pdf",
            )
        })

        test("should update documents with encryption", async () => {
            const store = useDocStore.getState()

            // Add a document first
            const doc = await store.addDocument({
                title: "Original Title",
                content: "Original Content",
                sourceUri: "file:///temp/document.pdf",
                tags: [],
                metadata: {
                    createdAt: "",
                    updatedAt: "",
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            })

            // Reset mock calls
            jest.clearAllMocks()

            // Update the document
            await store.updateDocument(doc.id, {
                id: doc.id,
                title: "Updated Title",
                content: "Updated Content",
                sourceUri: doc.sourceUri,
                metadata: {
                    ...doc.metadata,
                    updatedAt: Date.now.toString(),
                },
            })

            // Check document was updated
            const updatedStore = useDocStore.getState()
            const updatedDoc = updatedStore.documents.find(
                (d) => d.id === doc.id,
            )
            expect(updatedDoc?.title).toBe("Updated Title")
            expect(updatedDoc?.content).toBe(`encrypted:${doc.id}`)
        })

        test("should update document with new file", async () => {
            const store = useDocStore.getState()

            // Add a document first
            const doc = await store.addDocument({
                title: "Original Document",
                content: "Original Content",
                sourceUri: "file:///temp/original.pdf",
                tags: [],
                metadata: {
                    createdAt: "",
                    updatedAt: "",
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            })

            // Reset mock calls
            jest.clearAllMocks()

            // Update the document with a new file
            await store.updateDocument(doc.id, {
                id: doc.id,
                title: "Updated Document",
                sourceUri: "file:///temp/updated.pdf",
                metadata: {
                    ...doc.metadata,
                    updatedAt: new Date().toISOString(),
                },
            })

            // Verify the file was saved with the new source
            const documentStorage = await DocumentStorageService.create()
            expect(documentStorage.saveFile).toHaveBeenCalledWith(
                "file:///temp/updated.pdf",
                doc.id,
                true,
                expect.any(String),
            )

            // Check document was updated
            const updatedStore = useDocStore.getState()
            const updatedDoc = updatedStore.documents.find(
                (d) => d.id === doc.id,
            )
            expect(updatedDoc?.title).toBe("Updated Document")
            expect(updatedDoc?.content).toBe(`encrypted:${doc.id}`)
        })

        test("should delete documents and their encrypted content", async () => {
            const store = useDocStore.getState()

            const doc = await store.addDocument({
                title: "Test Document",
                content: "Test Content",
                sourceUri: "file:///temp/document.pdf",
                tags: [],
                metadata: {
                    createdAt: "",
                    updatedAt: "",
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            })

            const initialCount = useDocStore.getState().documents.length

            // Reset mocks
            jest.clearAllMocks()

            // Delete the document
            await store.deleteDocument(doc.id)

            // Check document was removed from store
            const updatedStore = useDocStore.getState()
            expect(updatedStore.documents.length).toBe(initialCount - 1)
            expect(
                updatedStore.documents.find((d) => d.id === doc.id),
            ).toBeUndefined()

            // Check file was deleted
            const documentStorage = await DocumentStorageService.create()
            expect(documentStorage.deleteFile).toHaveBeenCalled()
        })

        test("should select documents", async () => {
            const store = useDocStore.getState()

            // Add a document first
            const doc = await store.addDocument({
                title: "Test Document",
                content: "Test Content",
                sourceUri: "file:///temp/document.pdf",
                tags: [],
                metadata: {
                    createdAt: "",
                    updatedAt: "",
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            })

            // Select the document
            store.selectDocument(doc.id)

            // Check document was selected
            let updatedStore = useDocStore.getState()
            expect(updatedStore.selectedDocument).not.toBeNull()
            expect(updatedStore.selectedDocument?.title).toBe("Test Document")

            // Deselect the document
            store.selectDocument(null)
            updatedStore = useDocStore.getState()
            expect(updatedStore.selectedDocument).toBeNull()
        })

        test("should get decrypted content", async () => {
            const store = useDocStore.getState()

            // Add a document first
            const doc = await store.addDocument({
                title: "Test Document",
                content: "Sensitive Content",
                sourceUri: "file:///temp/document.pdf",
                tags: [],
                metadata: {
                    createdAt: "",
                    updatedAt: "",
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            })

            // Reset mocks
            jest.clearAllMocks()

            // Get decrypted content
            const decryptedContent = await store.getDecryptedContent(doc.id)

            // Check the decryption service was called
            const encryptionService = new DocumentEncryptionService()
            expect(encryptionService.decryptDocument).toHaveBeenCalledWith(
                doc.id,
            )

            // Check the correct content was returned
            expect(decryptedContent).toBe(`Decrypted content for ${doc.id}`)
        })
    })

    describe("Document preview and fetch", () => {
        test("should fetch document for viewing", async () => {
            const store = useDocStore.getState()

            const doc = await store.addDocument({
                title: "Test Document",
                content: "Test Content",
                sourceUri: "file:///temp/document.pdf",
                tags: [],
                metadata: {
                    createdAt: "",
                    updatedAt: "",
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            })

            // Reset mocks
            jest.clearAllMocks()

            const result = await store.fetchDocument(doc.id)

            expect(result).not.toBeNull()
            expect(result?.document.id).toBe(doc.id)
            expect(result?.previewUri).toBe(
                "file:///document/documents/mock-id_document.pdf",
            )
        })

        test("should return null when fetching non-existent document", async () => {
            const store = useDocStore.getState()

            // Fetch a non-existent document
            const result = await store.fetchDocument("non-existent-id")

            // Should return null
            expect(result).toBeNull()
        })

        test("should get document preview", async () => {
            const store = useDocStore.getState()

            // Add a document first
            const doc = await store.addDocument({
                title: "Test Document",
                content: "Test Content",
                sourceUri: "file:///temp/document.pdf",
                tags: [],
                metadata: {
                    createdAt: "",
                    updatedAt: "",
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            })

            // Reset mocks
            jest.clearAllMocks()

            // Get document preview
            const preview = await store.getDocumentPreview(doc.id)

            // Check the preview was created correctly
            expect(preview).not.toBeNull()
            expect(preview?.id).toBe(doc.id)
            expect(preview?.sourceUri).toBe(
                "file:///cache/preview_document.pdf",
            )
            expect(preview?.metadata.mimeType).toBe(DocumentType.PDF.toString())

            // Check that getDocumentTempUri was called
            const documentStorage = await DocumentStorageService.create()
            expect(documentStorage.getDocumentTempUri).toHaveBeenCalledWith(
                expect.objectContaining({ id: doc.id }),
            )
        })

        test("should return null when getting preview for non-existent document", async () => {
            const store = useDocStore.getState()

            // Get preview for non-existent document
            const preview = await store.getDocumentPreview("non-existent-id")

            // Should return null
            expect(preview).toBeNull()
        })

        test("should handle storage errors when getting preview", async () => {
            const store = useDocStore.getState()

            // Add a document first
            const doc = await store.addDocument({
                title: "Test Document",
                content: "Test Content",
                sourceUri: "file:///temp/document.pdf",
                tags: [],
                metadata: {
                    createdAt: "",
                    updatedAt: "",
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            })

            // Reset mocks and make getDocumentTempUri throw an error
            jest.clearAllMocks()
            const documentStorage = await DocumentStorageService.create()
            ;(
                documentStorage.getDocumentTempUri as jest.Mock
            ).mockImplementationOnce(() =>
                Promise.reject(new Error("Storage error")),
            )

            // Get document preview
            const preview = await store.getDocumentPreview(doc.id)

            // Should return null on error
            expect(preview).toBeNull()
        })
    })

    describe("Document cleanup", () => {
        test("should clean up temporary files", async () => {
            const store = useDocStore.getState()

            // Call cleanupTempFiles
            await store.cleanupTempFiles()

            // Check that the storage service's cleanupPreviewFiles was called
            const documentStorage = await DocumentStorageService.create()
            expect(documentStorage.cleanupPreviewFiles).toHaveBeenCalled()
        })

        test("should handle errors during cleanup", async () => {
            const store = useDocStore.getState()

            // Make cleanupPreviewFiles throw an error
            const documentStorage = await DocumentStorageService.create()
            ;(
                documentStorage.cleanupPreviewFiles as jest.Mock
            ).mockImplementationOnce(() =>
                Promise.reject(new Error("Cleanup error")),
            )

            // Call cleanupTempFiles
            await store.cleanupTempFiles()

            // Should not throw
            expect(documentStorage.cleanupPreviewFiles).toHaveBeenCalled()
        })
    })

    describe("Error handling", () => {
        test("should clear error state", () => {
            const store = useDocStore.getState()

            // Set an error
            useDocStore.setState({ error: "Test error" })
            expect(useDocStore.getState().error).toBe("Test error")

            // Clear the error
            store.clearError()
            expect(useDocStore.getState().error).toBeNull()
        })

        test("should handle add document errors", async () => {
            const store = useDocStore.getState()

            // Make importAndStoreDocument throw an error
            const documentStorage = await DocumentStorageService.create()
            ;(
                documentStorage.importAndStoreDocument as jest.Mock
            ).mockImplementationOnce(() =>
                Promise.reject(new Error("Import error")),
            )

            // Try to add a document
            await expect(
                store.addDocument({
                    title: "Error Document",
                    content: "Error Content",
                    sourceUri: "file:///temp/error.pdf",
                    tags: [],
                    metadata: {
                        createdAt: "",
                        updatedAt: "",
                        type: DocumentType.PDF,
                        mimeType: "application/pdf",
                    },
                }),
            ).rejects.toThrow("Import error")

            // Error state should be set
            expect(useDocStore.getState().error).not.toBeNull()
            expect(useDocStore.getState().isLoading).toBe(false)
        })

        test("should handle update document errors", async () => {
            const store = useDocStore.getState()

            // Add a document first
            const doc = await store.addDocument({
                title: "Original Document",
                content: "Original Content",
                sourceUri: "file:///temp/document.pdf",
                tags: [],
                metadata: {
                    createdAt: "",
                    updatedAt: "",
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            })

            // Reset mocks and make saveFile throw an error
            jest.clearAllMocks()
            const documentStorage = await DocumentStorageService.create()
            ;(documentStorage.saveFile as jest.Mock).mockImplementationOnce(
                () => Promise.reject(new Error("Update error")),
            )

            // Try to update the document
            await expect(
                store.updateDocument(doc.id, {
                    id: doc.id,
                    sourceUri: "file:///temp/error.pdf",
                    metadata: {
                        ...doc.metadata,
                        updatedAt: new Date().toISOString(),
                    },
                }),
            ).rejects.toThrow("Update error")

            // Error state should be set
            expect(useDocStore.getState().error).not.toBeNull()
            expect(useDocStore.getState().isLoading).toBe(false)
        })
    })

    describe("Selectors", () => {
        test("should get document by ID", async () => {
            const store = useDocStore.getState()

            // Add a document first
            const doc = await store.addDocument({
                title: "Test Document",
                content: "Test Content",
                sourceUri: "file:///temp/document.pdf",
                tags: [],
                metadata: {
                    createdAt: "",
                    updatedAt: "",
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            })

            // Get the document by ID
            const retrievedDoc = store.getDocumentById(doc.id)

            // Should return the correct document
            expect(retrievedDoc).not.toBeNull()
            expect(retrievedDoc?.id).toBe(doc.id)
            expect(retrievedDoc?.title).toBe("Test Document")
        })
    })
})
