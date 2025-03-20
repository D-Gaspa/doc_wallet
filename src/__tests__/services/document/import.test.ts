import { DocumentImport } from "../../../services/document/import"
import {
    errorCodes,
    pick,
    pickDirectory,
    types,
    keepLocalCopy,
    DocumentPickerResponse,
} from "@react-native-documents/picker"
import { LoggingService } from "../../../services/monitoring/loggingService"
import { PerformanceMonitoringService } from "../../../services/monitoring/performanceMonitoringService"
import { DocumentType, ImportFileResult } from "../../../types/document"

interface PrivateDocumentImport {
    processImportResults(
        results: DocumentPickerResponse[],
        handleVirtualFiles: boolean
    ): Promise<ImportFileResult[]>
    determineDocumentType(mimeType: string | null): DocumentType
}

interface ErrorWithCode {
    code: string
    [key: string]: unknown
}

jest.mock("@react-native-documents/picker", () => ({
    errorCodes: {
        OPERATION_CANCELED: "CANCELED",
        DOCUMENT_NOT_FOUND: "NOT_FOUND",
    },
    types: {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        images: ["image/jpeg", "image/png"],
    },
    pick: jest.fn(),
    pickDirectory: jest.fn(),
    keepLocalCopy: jest.fn(),
    isErrorWithCode: (error: unknown): error is ErrorWithCode =>
        error !== null && typeof error === "object" && "code" in error,
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

describe("DocumentImport", () => {
    let documentImport: DocumentImport

    beforeEach(() => {
        jest.clearAllMocks()
        documentImport = new DocumentImport()

        // Default mock implementation for pick
        ;(pick as jest.Mock).mockResolvedValue([
            {
                uri: "file:///document.pdf",
                name: "document.pdf",
                size: 12345,
                type: "application/pdf",
                hasRequestedType: true,
                isVirtual: false,
            },
        ])

        // Default mock implementation for pickDirectory
        ;(pickDirectory as jest.Mock).mockResolvedValue({
            uri: "file:///selected/directory",
            name: "directory",
        })

        // Default mock implementation for keepLocalCopy
        ;(keepLocalCopy as jest.Mock).mockResolvedValue([
            {
                status: "success",
                localUri: "file:///cache/document.pdf",
            },
        ])
    })

    describe("importDocument", () => {
        it("should import documents with default options", async () => {
            const results = await documentImport.importDocument()

            expect(pick).toHaveBeenCalledWith({
                allowMultiSelection: false,
                allowVirtualFiles: true,
                type: [types.pdf, types.images, types.docx],
            })

            expect(results).toEqual([
                {
                    uri: "file:///document.pdf",
                    name: "document.pdf",
                    size: 12345,
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            ])

            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith("import_document")
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("import_document")
        })

        it("should handle user cancellation", async () => {
            ;(pick as jest.Mock).mockRejectedValueOnce({
                code: errorCodes.OPERATION_CANCELED,
            })

            const results = await documentImport.importDocument()

            expect(results).toEqual([])
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("import_document")
        })

        it("should allow multiple selection when specified", async () => {
            ;(pick as jest.Mock).mockResolvedValueOnce([
                {
                    uri: "file:///document1.pdf",
                    name: "document1.pdf",
                    size: 12345,
                    type: "application/pdf",
                    hasRequestedType: true,
                    isVirtual: false,
                },
                {
                    uri: "file:///document2.pdf",
                    name: "document2.pdf",
                    size: 67890,
                    type: "application/pdf",
                    hasRequestedType: true,
                    isVirtual: false,
                },
            ])

            const results = await documentImport.importDocument({
                allowMultiple: true,
            })

            expect(pick).toHaveBeenCalledWith(
                expect.objectContaining({
                    allowMultiSelection: true,
                })
            )

            expect(results).toHaveLength(2)
        })

        it("should filter documents with invalid types", async () => {
            ;(pick as jest.Mock).mockResolvedValueOnce([
                {
                    uri: "file:///document.pdf",
                    name: "document.pdf",
                    size: 12345,
                    type: "application/pdf",
                    hasRequestedType: true,
                    isVirtual: false,
                },
                {
                    uri: "file:///document.xyz",
                    name: "document.xyz",
                    size: 67890,
                    type: "application/xyz",
                    hasRequestedType: false,
                    isVirtual: false,
                },
            ])

            const results = await documentImport.importDocument()

            // Both files should be returned, but a warning should be logged for the invalid one
            expect(results).toHaveLength(2)
            expect(LoggingService.getLogger("").warn).toHaveBeenCalled()
        })

        it("should throw error for non-cancellation errors", async () => {
            ;(pick as jest.Mock).mockRejectedValueOnce(
                new Error("Import error")
            )

            await expect(documentImport.importDocument()).rejects.toThrow(
                "Import error"
            )
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("import_document")
        })
    })

    describe("importImage", () => {
        it("should import images with correct type filter", async () => {
            ;(pick as jest.Mock).mockResolvedValueOnce([
                {
                    uri: "file:///image.jpg",
                    name: "image.jpg",
                    size: 12345,
                    type: "image/jpeg",
                    hasRequestedType: true,
                    isVirtual: false,
                },
            ])

            const results = await documentImport.importImage()

            expect(pick).toHaveBeenCalledWith({
                allowMultiSelection: false,
                type: types.images,
            })

            expect(results).toEqual([
                {
                    uri: "file:///image.jpg",
                    name: "image.jpg",
                    size: 12345,
                    type: DocumentType.IMAGE,
                    mimeType: "image/jpeg",
                },
            ])

            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith("import_image")
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("import_image")
        })

        it("should handle user cancellation", async () => {
            ;(pick as jest.Mock).mockRejectedValueOnce({
                code: errorCodes.OPERATION_CANCELED,
            })

            const results = await documentImport.importImage()

            expect(results).toEqual([])
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("import_image")
        })
    })

    describe("importPDF", () => {
        it("should import PDFs with correct type filter", async () => {
            const results = await documentImport.importPDF()

            expect(pick).toHaveBeenCalledWith({
                allowMultiSelection: false,
                type: types.pdf,
            })

            expect(results).toEqual([
                {
                    uri: "file:///document.pdf",
                    name: "document.pdf",
                    size: 12345,
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            ])

            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith("import_pdf")
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("import_pdf")
        })
    })

    describe("importVirtualDocument", () => {
        it("should import and copy virtual documents", async () => {
            ;(pick as jest.Mock).mockResolvedValueOnce([
                {
                    uri: "content://drive/document.pdf",
                    name: "document.pdf",
                    size: 12345,
                    type: "application/pdf",
                    hasRequestedType: true,
                    isVirtual: true,
                },
            ])

            const results = await documentImport.importVirtualDocument()

            expect(pick).toHaveBeenCalledWith({
                allowVirtualFiles: true,
                type: [types.pdf, types.images, types.docx],
            })

            expect(keepLocalCopy).toHaveBeenCalledWith({
                destination: "cachesDirectory",
                files: [
                    {
                        uri: "content://drive/document.pdf",
                        fileName: "document.pdf",
                    },
                ],
            })

            expect(results).toEqual([
                {
                    uri: "content://drive/document.pdf",
                    localUri: "file:///cache/document.pdf",
                    name: "document.pdf",
                    size: 12345,
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            ])

            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith("import_virtual_document")
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("import_virtual_document")
        })

        it("should handle virtual file conversions", async () => {
            ;(pick as jest.Mock).mockResolvedValueOnce([
                {
                    uri: "content://drive/document.gdoc",
                    name: "document",
                    size: 12345,
                    type: "application/vnd.google-apps.document",
                    hasRequestedType: true,
                    isVirtual: true,
                    convertibleToMimeTypes: [
                        {
                            mimeType: "application/pdf",
                            extension: "pdf",
                        },
                    ],
                },
            ])

            const results = await documentImport.importVirtualDocument()

            expect(keepLocalCopy).toHaveBeenCalledWith({
                destination: "cachesDirectory",
                files: [
                    {
                        uri: "content://drive/document.gdoc",
                        fileName: "document.pdf",
                        convertVirtualFileToType: "application/pdf",
                    },
                ],
            })

            expect(results).toHaveLength(1)
            expect(results[0].name).toBe("document.pdf")
        })

        it("should handle failed copy operations", async () => {
            ;(pick as jest.Mock).mockResolvedValueOnce([
                {
                    uri: "content://drive/document.pdf",
                    name: "document.pdf",
                    size: 12345,
                    type: "application/pdf",
                    hasRequestedType: true,
                    isVirtual: true,
                },
            ])

            ;(keepLocalCopy as jest.Mock).mockResolvedValueOnce([
                {
                    status: "error",
                    copyError: "Failed to copy file",
                },
            ])

            const results = await documentImport.importVirtualDocument()

            // Should return empty array since copying failed
            expect(results).toHaveLength(0)
            expect(LoggingService.getLogger("").error).toHaveBeenCalled()
        })
    })

    describe("selectDirectory", () => {
        it("should select a directory", async () => {
            const result = await documentImport.selectDirectory()

            expect(pickDirectory).toHaveBeenCalledWith({
                requestLongTermAccess: false,
            })

            expect(result).toEqual({
                uri: "file:///selected/directory",
                name: "directory",
            })
        })

        it("should request long-term access when specified", async () => {
            await documentImport.selectDirectory(true)

            expect(pickDirectory).toHaveBeenCalledWith({
                requestLongTermAccess: true,
            })
        })
    })

    describe("determineDocumentType", () => {
        it("should return PDF type for PDF mime type", () => {
            const result = (
                documentImport as unknown as PrivateDocumentImport
            ).determineDocumentType("application/pdf")
            expect(result).toBe(DocumentType.PDF)
        })

        it("should return IMAGE type for JPEG mime type", () => {
            const result = (
                documentImport as unknown as PrivateDocumentImport
            ).determineDocumentType("image/jpeg")
            expect(result).toBe(DocumentType.IMAGE)
        })

        it("should return IMAGE_PNG type for PNG mime type", () => {
            const result = (
                documentImport as unknown as PrivateDocumentImport
            ).determineDocumentType("image/png")
            expect(result).toBe(DocumentType.IMAGE_PNG)
        })

        it("should return UNKNOWN for unsupported mime types", () => {
            const result = (
                documentImport as unknown as PrivateDocumentImport
            ).determineDocumentType("application/unknown")
            expect(result).toBe(DocumentType.UNKNOWN)
        })

        it("should return UNKNOWN for null mime type", () => {
            const result = (
                documentImport as unknown as PrivateDocumentImport
            ).determineDocumentType(null)
            expect(result).toBe(DocumentType.UNKNOWN)
        })
    })

    describe("getFileExtension", () => {
        it("should return the file extension from name", () => {
            expect(documentImport.getFileExtension("document.pdf")).toBe("pdf")
        })

        it("should return the file extension from URI", () => {
            expect(
                documentImport.getFileExtension("file:///path/to/document.jpg")
            ).toBe("jpg")
        })

        it("should handle files with multiple dots", () => {
            expect(
                documentImport.getFileExtension("file.name.with.dots.txt")
            ).toBe("txt")
        })

        it("should return empty string for files without extension", () => {
            expect(documentImport.getFileExtension("filename")).toBe("")
        })

        it("should return lowercase extension", () => {
            expect(documentImport.getFileExtension("document.PDF")).toBe("pdf")
        })
    })

    describe("getFileNameFromUri", () => {
        it("should extract filename from URI", () => {
            expect(
                documentImport.getFileNameFromUri(
                    "file:///path/to/document.pdf"
                )
            ).toBe("document.pdf")
        })

        it("should handle URIs without filename", () => {
            const result = documentImport.getFileNameFromUri("file:///path/to/")
            expect(result).toMatch(/^file_\d+$/)
        })
    })

    describe("processImportResults", () => {
        it("should process regular files correctly", async () => {
            const results = [
                {
                    uri: "file:///document.pdf",
                    name: "document.pdf",
                    size: 12345,
                    type: "application/pdf",
                    hasRequestedType: true,
                    isVirtual: false,
                } as DocumentPickerResponse,
            ]

            const processed = await (
                documentImport as unknown as PrivateDocumentImport
            ).processImportResults(results, false)

            expect(processed).toEqual([
                {
                    uri: "file:///document.pdf",
                    name: "document.pdf",
                    size: 12345,
                    type: DocumentType.PDF,
                    mimeType: "application/pdf",
                },
            ])
        })

        it("should process virtual files when handleVirtualFiles is true", async () => {
            const results = [
                {
                    uri: "content://drive/document.pdf",
                    name: "document.pdf",
                    size: 12345,
                    type: "application/pdf",
                    hasRequestedType: true,
                    isVirtual: true,
                } as DocumentPickerResponse,
            ]

            const processed = await (
                documentImport as unknown as PrivateDocumentImport
            ).processImportResults(results, true)

            expect(keepLocalCopy).toHaveBeenCalled()
            expect(processed.length).toBe(1)
            expect(processed[0].localUri).toBeDefined()
        })

        it("should not process virtual files when handleVirtualFiles is false", async () => {
            const results = [
                {
                    uri: "content://drive/document.pdf",
                    name: "document.pdf",
                    size: 12345,
                    type: "application/pdf",
                    hasRequestedType: true,
                    isVirtual: true,
                } as DocumentPickerResponse,
            ]

            const processed = await (
                documentImport as unknown as PrivateDocumentImport
            ).processImportResults(results, false)

            expect(keepLocalCopy).not.toHaveBeenCalled()
            expect(processed).toEqual([])
        })

        it("should handle empty results array", async () => {
            const processed = await (
                documentImport as unknown as PrivateDocumentImport
            ).processImportResults([], true)

            expect(processed).toEqual([])
            expect(keepLocalCopy).not.toHaveBeenCalled()
        })

        it("should handle errors during processing", async () => {
            const results = [
                {
                    uri: "file:///document.pdf",
                    name: "document.pdf",
                    size: 12345,
                    type: "application/pdf",
                    hasRequestedType: true,
                    isVirtual: false,
                } as DocumentPickerResponse,
            ]

            // Mock an error during processing
            jest.spyOn(
                documentImport as unknown as PrivateDocumentImport,
                "determineDocumentType"
            ).mockImplementationOnce(() => {
                throw new Error("Processing error")
            })

            await expect(
                (
                    documentImport as unknown as PrivateDocumentImport
                ).processImportResults(results, false)
            ).rejects.toThrow("Processing error")
        })
    })
})
