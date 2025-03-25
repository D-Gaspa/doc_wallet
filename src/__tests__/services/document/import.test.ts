import { DocumentImport } from "../../../services/document/import"
import {
    pick,
    pickDirectory,
    types,
    keepLocalCopy,
} from "@react-native-documents/picker"
import { PerformanceMonitoringService } from "../../../services/monitoring/performanceMonitoringService"
import { DocumentType } from "../../../types/document"
import * as FileSystem from "expo-file-system"

// Mock dependencies
jest.mock("@react-native-documents/picker", () => ({
    errorCodes: {
        OPERATION_CANCELED: "CANCELED",
        DOCUMENT_NOT_FOUND: "NOT_FOUND",
        UNABLE_TO_OPEN_FILE_TYPE: "UNABLE_TO_OPEN_FILE_TYPE",
        IN_PROGRESS: "IN_PROGRESS",
    },
    types: {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        images: ["image/jpeg", "image/png"],
    },
    pick: jest.fn().mockImplementation(() => Promise.resolve([])),
    pickDirectory: jest.fn().mockImplementation(() => Promise.resolve({})),
    keepLocalCopy: jest.fn().mockImplementation(() => Promise.resolve([])),
}))

jest.mock("expo-file-system", () => ({
    documentDirectory: "file:///document/",
    cacheDirectory: "file:///cache/",
    copyAsync: jest.fn().mockImplementation(() => Promise.resolve()),
    getInfoAsync: jest
        .fn()
        .mockImplementation(() => Promise.resolve({ exists: false, uri: "" })),
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

        // Default success response for pick
        ;(pick as jest.Mock).mockImplementation(() =>
            Promise.resolve([
                {
                    uri: "file:///document.pdf",
                    name: "document.pdf",
                    size: 12345,
                    type: "application/pdf",
                    hasRequestedType: true,
                    isVirtual: false,
                },
            ])
        )

        // Default directory picker response
        ;(pickDirectory as jest.Mock).mockImplementation(() =>
            Promise.resolve({
                uri: "file:///selected/directory",
                name: "directory",
            })
        )

        // Default keepLocalCopy success response
        ;(keepLocalCopy as jest.Mock).mockImplementation(() =>
            Promise.resolve([
                {
                    status: "success",
                    localUri: "file:///cache/document.pdf",
                },
            ])
        )

        // Default direct copy success
        ;(FileSystem.copyAsync as jest.Mock).mockImplementation(() =>
            Promise.resolve()
        )
        ;(FileSystem.getInfoAsync as jest.Mock).mockImplementation(() =>
            Promise.resolve({
                exists: true,
                uri: "file:///cache/temp_file.pdf",
                size: 12345,
            })
        )
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
                    localUri: expect.any(String),
                },
            ])

            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith("import_document")
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("import_document")
        })

        it("should allow multiple selection when specified", async () => {
            ;(pick as jest.Mock).mockImplementation(() =>
                Promise.resolve([
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
            )

            const results = await documentImport.importDocument({
                allowMultiple: true,
            })

            expect(pick).toHaveBeenCalledWith(
                expect.objectContaining({
                    allowMultiSelection: true,
                })
            )

            expect(results.length).toBe(2)
        })
    })

    describe("importImage", () => {
        it("should import images with correct type filter", async () => {
            ;(pick as jest.Mock).mockImplementation(() =>
                Promise.resolve([
                    {
                        uri: "file:///image.jpg",
                        name: "image.jpg",
                        size: 12345,
                        type: "image/jpeg",
                        hasRequestedType: true,
                        isVirtual: false,
                    },
                ])
            )

            const results = await documentImport.importImage()

            expect(pick).toHaveBeenCalledWith({
                allowMultiSelection: false,
                type: types.images,
            })

            expect(results[0].type).toBe(DocumentType.IMAGE)
            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith("import_image")
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

            expect(results[0].type).toBe(DocumentType.PDF)
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
            ;(pick as jest.Mock).mockImplementation(() =>
                Promise.resolve([
                    {
                        uri: "content://drive/document.pdf",
                        name: "document.pdf",
                        size: 12345,
                        type: "application/pdf",
                        hasRequestedType: true,
                        isVirtual: true,
                    },
                ])
            )

            const results = await documentImport.importVirtualDocument()

            expect(pick).toHaveBeenCalledWith({
                allowVirtualFiles: true,
                type: [types.pdf, types.images, types.docx],
            })

            expect(results.length).toBe(1)
            expect(results[0].localUri).toBeDefined()
            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith("import_virtual_document")
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("import_virtual_document")
        })

        it("should handle virtual file conversions", async () => {
            ;(pick as jest.Mock).mockImplementation(() =>
                Promise.resolve([
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
            )

            const results = await documentImport.importVirtualDocument()

            expect(results.length).toBe(1)
        })

        it("should handle Google Drive files specially", async () => {
            ;(pick as jest.Mock).mockImplementation(() =>
                Promise.resolve([
                    {
                        uri: "content://com.google.android.apps.docs/document.gdoc",
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
            )

            await documentImport.importVirtualDocument()

            // The test will check if the method didn't throw, which implicitly tests
            // that the Google Drive URI was handled correctly
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith("import_virtual_document")
        })

        it("should handle failed copy operations", async () => {
            ;(pick as jest.Mock).mockImplementation(() =>
                Promise.resolve([
                    {
                        uri: "content://drive/document.pdf",
                        name: "document.pdf",
                        size: 12345,
                        type: "application/pdf",
                        hasRequestedType: true,
                        isVirtual: true,
                    },
                ])
            )

            // Mock direct copy failure
            ;(FileSystem.copyAsync as jest.Mock).mockImplementation(() =>
                Promise.reject(new Error("Copy failed"))
            )

            // Mock keepLocalCopy failure
            ;(keepLocalCopy as jest.Mock).mockImplementation(() =>
                Promise.resolve([
                    {
                        status: "error",
                        copyError: "Failed to copy file",
                    },
                ])
            )

            const results = await documentImport.importVirtualDocument()

            // Should handle the failure gracefully and return empty results
            expect(results.length).toBe(0)
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

    describe("utility methods", () => {
        it("should get file extension from name", () => {
            expect(documentImport.getFileExtension("document.pdf")).toBe("pdf")
            expect(
                documentImport.getFileExtension("file.name.with.dots.txt")
            ).toBe("txt")
            expect(documentImport.getFileExtension("filename")).toBe("")
            expect(documentImport.getFileExtension("document.PDF")).toBe("pdf")
        })

        it("should extract filename from URI", () => {
            expect(
                documentImport.getFileNameFromUri(
                    "file:///path/to/document.pdf"
                )
            ).toBe("document.pdf")

            // Should generate a name if not present
            const result = documentImport.getFileNameFromUri("file:///path/to/")
            expect(result).toMatch(/^file_\d+$/)
        })
    })

    describe("private methods behavior", () => {
        // Testing private methods through public interfaces

        it("should determine document types correctly", async () => {
            // PDF type
            ;(pick as jest.Mock).mockImplementation(() =>
                Promise.resolve([
                    {
                        uri: "file:///doc.pdf",
                        name: "doc.pdf",
                        type: "application/pdf",
                        hasRequestedType: true,
                        isVirtual: false,
                    },
                ])
            )

            let results = await documentImport.importDocument()
            expect(results[0].type).toBe(DocumentType.PDF)

            // JPEG type
            ;(pick as jest.Mock).mockImplementation(() =>
                Promise.resolve([
                    {
                        uri: "file:///img.jpg",
                        name: "img.jpg",
                        type: "image/jpeg",
                        hasRequestedType: true,
                        isVirtual: false,
                    },
                ])
            )

            results = await documentImport.importDocument()
            expect(results[0].type).toBe(DocumentType.IMAGE)

            // PNG type
            ;(pick as jest.Mock).mockImplementation(() =>
                Promise.resolve([
                    {
                        uri: "file:///img.png",
                        name: "img.png",
                        type: "image/png",
                        hasRequestedType: true,
                        isVirtual: false,
                    },
                ])
            )

            results = await documentImport.importDocument()
            expect(results[0].type).toBe(DocumentType.IMAGE_PNG)

            // Unknown type
            ;(pick as jest.Mock).mockImplementation(() =>
                Promise.resolve([
                    {
                        uri: "file:///doc.xyz",
                        name: "doc.xyz",
                        type: "application/xyz",
                        hasRequestedType: true,
                        isVirtual: false,
                    },
                ])
            )

            results = await documentImport.importDocument()
            expect(results[0].type).toBe(DocumentType.UNKNOWN)
        })
    })
})
