import { DocumentPreview } from "../../../services/document/preview"
import * as FileSystem from "expo-file-system"
import { Platform, AppState } from "react-native"
import { viewDocument } from "@react-native-documents/viewer"
import { PerformanceMonitoringService } from "../../../services/monitoring/performanceMonitoringService"
import { ErrorTrackingService } from "../../../services/monitoring/errorTrackingService"
import { DocumentType } from "../../../types/document"
import { generateUniqueId } from "../../../utils"

// Mock dependencies
jest.mock("@react-native-documents/viewer", () => ({
    viewDocument: jest.fn().mockImplementation(() => Promise.resolve()),
    errorCodes: {
        OPERATION_CANCELED: "CANCELED",
        UNABLE_TO_OPEN_FILE_TYPE: "UNABLE_TO_OPEN_FILE_TYPE",
        IN_PROGRESS: "IN_PROGRESS",
        DOCUMENT_NOT_FOUND: "NOT_FOUND",
    },
}))

jest.mock("expo-file-system", () => ({
    documentDirectory: "file:///document/",
    cacheDirectory: "file:///cache/",
    getInfoAsync: jest
        .fn()
        .mockImplementation(() => Promise.resolve({ exists: true, uri: "" })),
    copyAsync: jest.fn().mockImplementation(() => Promise.resolve()),
    readDirectoryAsync: jest.fn().mockImplementation(() => Promise.resolve([])),
    deleteAsync: jest.fn().mockImplementation(() => Promise.resolve()),
}))

jest.mock("react-native", () => ({
    Platform: {
        OS: "ios",
        select: jest.fn((obj) => obj.ios),
    },
    AppState: {
        addEventListener: jest.fn().mockReturnValue({
            remove: jest.fn(),
        }),
    },
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

jest.mock("../../../services/monitoring/errorTrackingService", () => ({
    ErrorTrackingService: {
        handleError: jest.fn().mockImplementation(() => Promise.resolve()),
    },
}))

jest.mock("../../../utils", () => ({
    generateUniqueId: jest.fn().mockReturnValue("mock-unique-id"),
}))

describe("DocumentPreview", () => {
    let documentPreview: DocumentPreview
    const originalPlatformOS = Platform.OS

    beforeEach(() => {
        jest.clearAllMocks()
        documentPreview = new DocumentPreview()

        // Reset FileSystem mock behaviors
        ;(FileSystem.getInfoAsync as jest.Mock).mockImplementation((uri) => {
            return Promise.resolve({
                exists: true,
                uri,
                size: 12345,
            })
        })
        ;(FileSystem.readDirectoryAsync as jest.Mock).mockImplementation(() =>
            Promise.resolve([
                "preview_123.pdf",
                "preview_456.jpg",
                "regular_file.txt",
            ]),
        )
    })

    afterEach(() => {
        Platform.OS = originalPlatformOS
    })

    describe("viewDocumentByUri", () => {
        it("should call viewDocument with correct parameters for iOS", async () => {
            Platform.OS = "ios"
            const uri = "file:///document/test.pdf"

            await documentPreview.viewDocumentByUri(uri)

            expect(viewDocument).toHaveBeenCalledWith({
                uri,
                mimeType: "application/pdf",
                headerTitle: "test.pdf",
            })

            expect(
                PerformanceMonitoringService.startMeasure,
            ).toHaveBeenCalledWith("view_document")
            expect(
                PerformanceMonitoringService.endMeasure,
            ).toHaveBeenCalledWith("view_document")
        })

        it("should call viewDocument with correct parameters for Android", async () => {
            Platform.OS = "android"
            const uri = "file:///document/test.pdf"

            await documentPreview.viewDocumentByUri(uri)

            expect(viewDocument).toHaveBeenCalledWith(
                expect.objectContaining({
                    uri,
                    mimeType: "application/pdf",
                    grantPermissions: "read",
                }),
            )
        })

        it("should use provided mimeType when specified", async () => {
            const uri = "file:///document/test.txt"
            const mimeType = "text/plain"

            await documentPreview.viewDocumentByUri(uri, mimeType)

            expect(viewDocument).toHaveBeenCalledWith(
                expect.objectContaining({
                    uri,
                    mimeType: "text/plain",
                }),
            )
        })

        it("should register AppState listener when onClose callback is provided", async () => {
            const uri = "file:///document/test.pdf"
            const onClose = jest.fn()

            await documentPreview.viewDocumentByUri(uri, undefined, onClose)

            expect(AppState.addEventListener).toHaveBeenCalledWith(
                "change",
                expect.any(Function),
            )
        })

        it("should clean up AppState listener on error", async () => {
            const uri = "file:///document/test.pdf"
            const onClose = jest.fn()
            const mockSubscription = { remove: jest.fn() }

            ;(AppState.addEventListener as jest.Mock).mockReturnValue(
                mockSubscription,
            )
            ;(viewDocument as jest.Mock).mockImplementationOnce(() =>
                Promise.reject(new Error("Test error")),
            )

            await expect(
                documentPreview.viewDocumentByUri(uri, undefined, onClose),
            ).rejects.toThrow()

            expect(mockSubscription.remove).toHaveBeenCalled()
        })
    })

    describe("viewDocumentByBookmark", () => {
        it("should call viewDocument with bookmark parameter", async () => {
            const bookmark = "bookmark-data"

            await documentPreview.viewDocumentByBookmark(bookmark)

            expect(viewDocument).toHaveBeenCalledWith({
                bookmark,
                headerTitle: "Document",
            })

            expect(
                PerformanceMonitoringService.startMeasure,
            ).toHaveBeenCalledWith("view_document_bookmark")
            expect(
                PerformanceMonitoringService.endMeasure,
            ).toHaveBeenCalledWith("view_document_bookmark")
        })

        it("should include mime type when provided", async () => {
            const bookmark = "bookmark-data"
            const mimeType = "application/pdf"

            await documentPreview.viewDocumentByBookmark(bookmark, mimeType)

            expect(viewDocument).toHaveBeenCalledWith(
                expect.objectContaining({
                    bookmark,
                    mimeType,
                }),
            )
        })
    })

    describe("getMimeTypeForDocumentType", () => {
        it("should return correct mime type for PDF", () => {
            const result = documentPreview.getMimeTypeForDocumentType(
                DocumentType.PDF,
            )
            expect(result).toBe("application/pdf")
        })

        it("should return correct mime type for JPEG image", () => {
            const result = documentPreview.getMimeTypeForDocumentType(
                DocumentType.IMAGE,
            )
            expect(result).toBe("image/jpeg")
        })

        it("should return correct mime type for PNG image", () => {
            const result = documentPreview.getMimeTypeForDocumentType(
                DocumentType.IMAGE_PNG,
            )
            expect(result).toBe("image/png")
        })

        it("should return undefined for unknown document type", () => {
            const result = documentPreview.getMimeTypeForDocumentType(
                DocumentType.UNKNOWN,
            )
            expect(result).toBeUndefined()
        })
    })

    describe("canPreviewFileType", () => {
        it("should return true for supported file types", () => {
            expect(documentPreview.canPreviewFileType("document.pdf")).toBe(
                true,
            )
            expect(documentPreview.canPreviewFileType("image.jpg")).toBe(true)
            expect(
                documentPreview.canPreviewFileType("presentation.pptx"),
            ).toBe(true)
            expect(documentPreview.canPreviewFileType("spreadsheet.xlsx")).toBe(
                true,
            )
        })

        it("should return false for unsupported file types", () => {
            expect(documentPreview.canPreviewFileType("file.xyz")).toBe(false)
            expect(documentPreview.canPreviewFileType("archive.zip")).toBe(
                false,
            )
        })

        it("should return false for files without extension", () => {
            expect(documentPreview.canPreviewFileType("filename")).toBe(false)
        })

        it("should return false for empty or null input", () => {
            expect(documentPreview.canPreviewFileType("")).toBe(false)
            expect(
                documentPreview.canPreviewFileType(null as unknown as string),
            ).toBe(false)
        })
    })

    describe("createTemporaryPreviewFile", () => {
        it("should create a temporary file and return its URI", async () => {
            const sourceUri = "file:///document/test.pdf"

            const tempUri = await documentPreview.createTemporaryPreviewFile(
                sourceUri,
            )

            expect(FileSystem.copyAsync).toHaveBeenCalledWith({
                from: sourceUri,
                to: "file:///cache/preview_mock-unique-id.pdf",
            })

            expect(tempUri).toBe("file:///cache/preview_mock-unique-id.pdf")
            expect(generateUniqueId).toHaveBeenCalled()
        })

        it("should use preferred extension when provided", async () => {
            const sourceUri = "file:///document/test.xyz"
            const preferredExtension = "pdf"

            const tempUri = await documentPreview.createTemporaryPreviewFile(
                sourceUri,
                preferredExtension,
            )

            expect(FileSystem.copyAsync).toHaveBeenCalledWith({
                from: sourceUri,
                to: "file:///cache/preview_mock-unique-id.pdf",
            })

            expect(tempUri).toBe("file:///cache/preview_mock-unique-id.pdf")
        })

        it("should handle copy errors", async () => {
            const sourceUri = "file:///document/test.pdf"

            ;(FileSystem.copyAsync as jest.Mock).mockImplementationOnce(() =>
                Promise.reject(new Error("Copy failed")),
            )

            await expect(
                documentPreview.createTemporaryPreviewFile(sourceUri),
            ).rejects.toThrow(/Failed to prepare file/)
        })
    })

    describe("cleanupTemporaryPreviewFiles", () => {
        it("should delete all temporary preview files", async () => {
            await documentPreview.cleanupTemporaryPreviewFiles()

            // Should delete only preview files
            expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(2)
            expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
                "file:///cache/preview_123.pdf",
                { idempotent: true },
            )
            expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
                "file:///cache/preview_456.jpg",
                { idempotent: true },
            )
        })

        it("should handle errors without throwing", async () => {
            ;(
                FileSystem.readDirectoryAsync as jest.Mock
            ).mockImplementationOnce(() =>
                Promise.reject(new Error("Read error")),
            )

            await expect(
                documentPreview.cleanupTemporaryPreviewFiles(),
            ).resolves.not.toThrow()

            expect(ErrorTrackingService.handleError).toHaveBeenCalled()
        })
    })
})
