import { DocumentPreview } from "../../../services/document/preview"
import * as FileSystem from "expo-file-system"
import { Platform } from "react-native"
import { viewDocument } from "@react-native-documents/viewer"
import { PerformanceMonitoringService } from "../../../services/monitoring/performanceMonitoringService"
import { ErrorTrackingService } from "../../../services/monitoring/errorTrackingService"
import { DocumentType } from "../../../types/document"
import { errorCodes } from "../../../services/document/viewer-types"

jest.mock("react-native", () => ({
    ...jest.requireActual("react-native"),
    Platform: { OS: "android" },
}))

jest.mock("@react-native-documents/viewer", () => ({
    viewDocument: jest.fn().mockResolvedValue(undefined),
}))

jest.mock("expo-file-system", () => ({
    documentDirectory: "file:///document/",
    cacheDirectory: "file:///cache/",
    getInfoAsync: jest.fn(),
    copyAsync: jest.fn().mockResolvedValue(undefined),
    readDirectoryAsync: jest.fn(),
    deleteAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock("react-native", () => ({
    Platform: {
        OS: "ios",
        select: jest.fn((obj) => obj.ios),
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
        handleError: jest.fn().mockResolvedValue(undefined),
    },
}))

describe("DocumentPreview", () => {
    let documentPreview: DocumentPreview

    beforeEach(() => {
        jest.clearAllMocks()
        documentPreview = new DocumentPreview()

        // Reset FileSystem mocks to default behavior
        ;(FileSystem.getInfoAsync as jest.Mock).mockImplementation((uri) => {
            if (uri.includes("exists")) {
                return Promise.resolve({ exists: true, uri })
            }
            return Promise.resolve({ exists: false, uri })
        })

        ;(FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
            "preview_123.pdf",
            "preview_456.jpg",
            "regular_file.txt",
        ])
    })

    describe("viewDocumentByUri", () => {
        const originalPlatformOS = Platform.OS

        afterEach(() => {
            Platform.OS = originalPlatformOS
        })
        it("should call viewDocument with the correct parameters", async () => {
            const uri = "file:///exists/document.pdf"

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri,
            })

            await documentPreview.viewDocumentByUri(uri)

            expect(viewDocument).toHaveBeenCalledWith({
                uri,
                mimeType: "application/pdf",
                headerTitle: "document.pdf",
            })

            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith("view_document")
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("view_document")
        })

        it("should use provided mimeType when specified", async () => {
            const uri = "file:///exists/document.txt"
            const mimeType = "text/plain"

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri,
            })

            await documentPreview.viewDocumentByUri(uri, mimeType)

            expect(viewDocument).toHaveBeenCalledWith(
                expect.objectContaining({
                    uri,
                    mimeType: "text/plain",
                })
            )
        })

        it("should use Android-specific options on Android platform", async () => {
            Platform.OS = "android"

            const uri = "file:///exists/document.pdf"

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri,
            })

            await documentPreview.viewDocumentByUri(uri)

            expect(viewDocument).toHaveBeenCalledWith(
                expect.objectContaining({
                    uri,
                    grantPermissions: "read",
                })
            )
        })

        it("should handle user cancellation gracefully", async () => {
            const uri = "file:///exists/document.pdf"

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri,
            })
            ;(viewDocument as jest.Mock).mockRejectedValueOnce({
                code: errorCodes.OPERATION_CANCELED,
            })

            await documentPreview.viewDocumentByUri(uri)

            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("view_document")
        })

        it("should handle unsupported file type error", async () => {
            const uri = "file:///exists/document.xyz"

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri,
            })
            ;(viewDocument as jest.Mock).mockRejectedValueOnce({
                code: errorCodes.UNABLE_TO_OPEN_FILE_TYPE,
            })

            await expect(
                documentPreview.viewDocumentByUri(uri)
            ).rejects.toThrow(
                "This file type cannot be previewed by the system"
            )

            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("view_document")
        })

        it("should handle already in progress error", async () => {
            const uri = "file:///exists/document.pdf"

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri,
            })
            ;(viewDocument as jest.Mock).mockRejectedValueOnce({
                code: errorCodes.IN_PROGRESS,
            })

            await expect(
                documentPreview.viewDocumentByUri(uri)
            ).rejects.toThrow("Another document preview is already open")

            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("view_document")
        })
    })

    describe("viewDocumentByBookmark", () => {
        const originalPlatformOS = Platform.OS

        afterEach(() => {
            Platform.OS = originalPlatformOS
        })
        it("should call viewDocument with bookmark parameter", async () => {
            const bookmark = "bookmark-data"

            await documentPreview.viewDocumentByBookmark(bookmark)

            expect(viewDocument).toHaveBeenCalledWith({
                bookmark,
                headerTitle: "Document",
            })

            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith("view_document_bookmark")
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("view_document_bookmark")
        })

        it("should handle user cancellation gracefully", async () => {
            const bookmark = "bookmark-data"

            ;(viewDocument as jest.Mock).mockRejectedValueOnce({
                code: errorCodes.OPERATION_CANCELED,
            })

            await documentPreview.viewDocumentByBookmark(bookmark)

            expect(
                PerformanceMonitoringService.endMeasure
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
                })
            )
        })
    })

    describe("getMimeTypeForDocumentType", () => {
        it("should return correct mime type for PDF", () => {
            const result = documentPreview.getMimeTypeForDocumentType(
                DocumentType.PDF
            )
            expect(result).toBe("application/pdf")
        })

        it("should return correct mime type for JPEG image", () => {
            const result = documentPreview.getMimeTypeForDocumentType(
                DocumentType.IMAGE
            )
            expect(result).toBe("image/jpeg")
        })

        it("should return correct mime type for PNG image", () => {
            const result = documentPreview.getMimeTypeForDocumentType(
                DocumentType.IMAGE_PNG
            )
            expect(result).toBe("image/png")
        })

        it("should return undefined for unknown document type", () => {
            const result = documentPreview.getMimeTypeForDocumentType(
                DocumentType.UNKNOWN
            )
            expect(result).toBeUndefined()
        })
    })

    describe("canPreviewFileType", () => {
        it("should return true for supported file types", () => {
            expect(documentPreview.canPreviewFileType("document.pdf")).toBe(
                true
            )
            expect(documentPreview.canPreviewFileType("image.jpg")).toBe(true)
            expect(
                documentPreview.canPreviewFileType("presentation.pptx")
            ).toBe(true)
            expect(documentPreview.canPreviewFileType("spreadsheet.xlsx")).toBe(
                true
            )
        })

        it("should return false for unsupported file types", () => {
            expect(documentPreview.canPreviewFileType("file.xyz")).toBe(false)
            expect(documentPreview.canPreviewFileType("archive.zip")).toBe(
                false
            )
        })

        it("should return false for files without extension", () => {
            expect(documentPreview.canPreviewFileType("filename")).toBe(false)
        })

        it("should return false for empty or null input", () => {
            expect(documentPreview.canPreviewFileType("")).toBe(false)
            expect(
                documentPreview.canPreviewFileType(null as unknown as string)
            ).toBe(false)
        })
    })

    describe("getErrorMessage", () => {
        it("should return user-friendly message for file type error", () => {
            const error = { code: errorCodes.UNABLE_TO_OPEN_FILE_TYPE }
            const message = documentPreview.getErrorMessage(error)
            expect(message).toContain("cannot be previewed")
        })

        it("should return user-friendly message for in-progress error", () => {
            const error = { code: errorCodes.IN_PROGRESS }
            const message = documentPreview.getErrorMessage(error)
            expect(message).toContain("already being previewed")
        })

        it("should return user-friendly message for cancellation", () => {
            const error = { code: errorCodes.OPERATION_CANCELED }
            const message = documentPreview.getErrorMessage(error)
            expect(message).toContain("canceled")
        })

        it("should return generic error message for other error codes", () => {
            const error = { code: "UNKNOWN_CODE", message: "Test error" }
            const message = documentPreview.getErrorMessage(error)
            expect(message).toContain("Test error")
        })

        it("should return fallback message for non-code errors", () => {
            const error = new Error("Regular error")
            const message = documentPreview.getErrorMessage(error)
            expect(message).toBe("Error previewing document. Please try again.")
        })
    })

    describe("createTemporaryPreviewFile", () => {
        it("should create a temporary file and return its URI", async () => {
            const sourceUri = "file:///exists/document.pdf"

            // Mock the current time for consistent filename
            const mockDate = new Date("2023-01-01T00:00:00.000Z")
            jest.spyOn(global, "Date").mockImplementation(() => mockDate)

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri: sourceUri,
            })

            const tempUri = await documentPreview.createTemporaryPreviewFile(
                sourceUri
            )

            expect(FileSystem.copyAsync).toHaveBeenCalledWith({
                from: sourceUri,
                to: expect.stringMatching(
                    /file:\/\/\/cache\/preview_[a-z0-9]+\.pdf/
                ),
            })

            expect(tempUri).toMatch(/file:\/\/\/cache\/preview_[a-z0-9]+\.pdf/)

            jest.restoreAllMocks()
        })

        it("should use preferred extension when provided", async () => {
            const sourceUri = "file:///exists/document.xyz"
            const preferredExtension = "pdf"

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri: sourceUri,
            })

            const tempUri = await documentPreview.createTemporaryPreviewFile(
                sourceUri,
                preferredExtension
            )

            expect(FileSystem.copyAsync).toHaveBeenCalledWith({
                from: sourceUri,
                to: expect.stringMatching(
                    /file:\/\/\/cache\/preview_[a-z0-9]+\.pdf/
                ),
            })

            expect(tempUri).toMatch(/file:\/\/\/cache\/preview_[a-z0-9]+\.pdf/)
        })

        it("should handle copy errors", async () => {
            const sourceUri = "file:///exists/document.pdf"

            ;(FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
                exists: true,
                uri: sourceUri,
            })
            ;(FileSystem.copyAsync as jest.Mock).mockRejectedValueOnce(
                new Error("Copy failed")
            )

            await expect(
                documentPreview.createTemporaryPreviewFile(sourceUri)
            ).rejects.toThrow("Failed to prepare file for preview")
        })
    })

    describe("cleanupTemporaryPreviewFiles", () => {
        it("should delete all temporary preview files", async () => {
            await documentPreview.cleanupTemporaryPreviewFiles()

            // Should delete both preview files but not the regular file
            expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(2)
            expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
                "file:///cache/preview_123.pdf",
                { idempotent: true }
            )
            expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
                "file:///cache/preview_456.jpg",
                { idempotent: true }
            )
        })

        it("should handle errors without throwing", async () => {
            ;(FileSystem.readDirectoryAsync as jest.Mock).mockRejectedValueOnce(
                new Error("Read error")
            )

            await expect(
                documentPreview.cleanupTemporaryPreviewFiles()
            ).resolves.not.toThrow()

            expect(ErrorTrackingService.handleError).toHaveBeenCalled()
        })
    })
})
