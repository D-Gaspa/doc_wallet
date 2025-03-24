import { DocumentEncryptionService } from "../../../services/security/documentEncryption"
import * as Keychain from "react-native-keychain"
import * as FileSystem from "expo-file-system"
import { PerformanceMonitoringService } from "../../../services/monitoring/performanceMonitoringService"

// Mock all dependencies
jest.mock("react-native-keychain", () => ({
    setGenericPassword: jest.fn().mockResolvedValue(true),
    getGenericPassword: jest.fn(),
    resetGenericPassword: jest.fn().mockResolvedValue(true),
    ACCESSIBLE: {
        WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
    },
}))

jest.mock("expo-file-system", () => ({
    documentDirectory: "file:///document/",
    cacheDirectory: "file:///cache/",
    getInfoAsync: jest.fn(),
    readAsStringAsync: jest.fn(),
    writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
    EncodingType: {
        Base64: "base64",
    },
}))

jest.mock("crypto-js", () => {
    return {
        enc: {
            Base64: {
                parse: jest.fn().mockReturnValue("mocked-word-array"),
                stringify: jest.fn().mockReturnValue("mocked-base64-string"),
            },
            Utf8: {
                toString: jest.fn().mockReturnValue("mocked-utf8-string"),
            },
        },
        AES: {
            encrypt: jest.fn().mockReturnValue({
                toString: jest.fn().mockReturnValue("mocked-encrypted-text"),
            }),
            decrypt: jest.fn().mockReturnValue({
                toString: jest
                    .fn()
                    .mockImplementation(() => "mocked-decrypted-text"),
            }),
        },
        mode: {
            CBC: "CBC",
        },
        pad: {
            Pkcs7: "Pkcs7",
        },
    }
})

jest.mock("react-native-quick-crypto", () => ({
    randomBytes: jest.fn().mockReturnValue(new Uint8Array(32).fill(1)),
}))

jest.mock("buffer", () => ({
    Buffer: {
        from: jest.fn().mockReturnValue({
            toString: jest.fn().mockReturnValue("mocked-base64-string"),
        }),
    },
}))

jest.mock("../../../services/monitoring/performanceMonitoringService", () => ({
    PerformanceMonitoringService: {
        startMeasure: jest.fn(),
        endMeasure: jest.fn(),
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

describe("DocumentEncryptionService", () => {
    let encryptionService: DocumentEncryptionService

    beforeEach(() => {
        encryptionService = new DocumentEncryptionService()
        jest.clearAllMocks()
    })

    describe("encryptDocument", () => {
        test("should encrypt text content successfully", async () => {
            const docId = "doc123"
            const content = "Sensitive document content"

            const result = await encryptionService.encryptDocument(
                docId,
                undefined,
                content
            )

            expect(result).toBe(true)
            expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
                docId,
                content,
                expect.objectContaining({
                    service: `com.doc_wallet.doc.${docId}`,
                    accessible: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
                })
            )
            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith(`encrypt_doc_${docId}`)
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith(`encrypt_doc_${docId}`)
        })

        test("should encrypt file content successfully", async () => {
            const docId = "doc123"
            const fileUri = "file:///document/test.pdf"

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementation(() =>
                Promise.resolve({
                    exists: true,
                    uri: fileUri,
                })
            )

            ;(FileSystem.readAsStringAsync as jest.Mock).mockImplementation(
                () => Promise.resolve("file-content-base64")
            )

            const result = await encryptionService.encryptDocument(
                docId,
                fileUri
            )

            expect(result).toBe(true)
            expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                expect.objectContaining({
                    service: `com.doc_wallet.doc.${docId}`,
                    accessible: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
                })
            )
            expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
                fileUri,
                expect.stringContaining("DWENC2:")
            )
            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith(`encrypt_doc_${docId}`)
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith(`encrypt_doc_${docId}`)
        })

        test("should handle file not found error", async () => {
            const docId = "doc123"
            const fileUri = "file:///document/nonexistent.pdf"

            // Mock file not existing
            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementation(() =>
                Promise.resolve({
                    exists: false,
                    uri: fileUri,
                })
            )

            const result = await encryptionService.encryptDocument(
                docId,
                fileUri
            )

            expect(result).toBe(false)
            expect(Keychain.setGenericPassword).not.toHaveBeenCalled()
            expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled()
        })

        test("should handle no content or file error", async () => {
            const docId = "doc123"

            // Call without file or content
            const result = await encryptionService.encryptDocument(docId)

            expect(result).toBe(false)
            expect(Keychain.setGenericPassword).not.toHaveBeenCalled()
        })
    })

    describe("decryptFileForPreview", () => {
        test("should decrypt file successfully for preview", async () => {
            const docId = "doc123"
            const fileUri = "file:///document/encrypted/test.pdf"
            const tempUri = "file:///cache/preview_test.pdf"

            ;(Keychain.getGenericPassword as jest.Mock).mockImplementation(() =>
                Promise.resolve({
                    username: docId,
                    password: "encryption-key-base64",
                })
            )

            ;(FileSystem.readAsStringAsync as jest.Mock).mockImplementation(
                () => Promise.resolve("DWENC2:iv-base64:encrypted-content")
            )

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementation(() =>
                Promise.resolve({
                    exists: true,
                    uri: tempUri,
                    size: 1024,
                })
            )

            const result = await encryptionService.decryptFileForPreview(
                docId,
                fileUri,
                tempUri
            )

            expect(result).toBe(true)
            expect(Keychain.getGenericPassword).toHaveBeenCalledWith({
                service: `com.doc_wallet.doc.${docId}`,
            })
            expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(fileUri)
            expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
                tempUri,
                expect.anything(),
                expect.objectContaining({
                    encoding: FileSystem.EncodingType.Base64,
                })
            )
            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith(`decrypt_preview_${docId}`)
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith(`decrypt_preview_${docId}`)
        })

        test("should handle key not found error", async () => {
            const docId = "doc123"
            const fileUri = "file:///document/encrypted/test.pdf"
            const tempUri = "file:///cache/preview_test.pdf"

            ;(Keychain.getGenericPassword as jest.Mock).mockImplementation(() =>
                Promise.resolve(null)
            )

            const result = await encryptionService.decryptFileForPreview(
                docId,
                fileUri,
                tempUri
            )

            expect(result).toBe(false)
            expect(FileSystem.readAsStringAsync).not.toHaveBeenCalled()
            expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled()
        })

        test("should handle invalid encryption format", async () => {
            const docId = "doc123"
            const fileUri = "file:///document/encrypted/test.pdf"
            const tempUri = "file:///cache/preview_test.pdf"

            ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
                username: docId,
                password: "encryption-key-base64",
            })

            ;(FileSystem.readAsStringAsync as jest.Mock).mockImplementation(
                () => Promise.resolve("INVALID-FORMAT")
            )

            const result = await encryptionService.decryptFileForPreview(
                docId,
                fileUri,
                tempUri
            )

            expect(result).toBe(false)
            expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled()
        })

        test("should handle temp file not created error", async () => {
            const docId = "doc123"
            const fileUri = "file:///document/encrypted/test.pdf"
            const tempUri = "file:///cache/preview_test.pdf"

            ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
                username: docId,
                password: "encryption-key-base64",
            })

            ;(FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
                "DWENC2:iv-base64:encrypted-content"
            )

            ;(FileSystem.getInfoAsync as jest.Mock).mockImplementation(() =>
                Promise.resolve({
                    exists: false,
                    uri: tempUri,
                })
            )

            const result = await encryptionService.decryptFileForPreview(
                docId,
                fileUri,
                tempUri
            )

            expect(result).toBe(false)
        })
    })

    describe("decryptDocument", () => {
        test("should retrieve stored document content", async () => {
            const docId = "doc123"
            const content = "Encrypted content"

            ;(Keychain.getGenericPassword as jest.Mock).mockImplementation(() =>
                Promise.resolve({
                    username: docId,
                    password: content,
                })
            )

            const result = await encryptionService.decryptDocument(docId)

            expect(result).toBe(content)
            expect(Keychain.getGenericPassword).toHaveBeenCalledWith({
                service: `com.doc_wallet.doc.${docId}`,
            })
            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith(`decrypt_doc_${docId}`)
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith(`decrypt_doc_${docId}`)
        })

        test("should return null for non-existent document", async () => {
            const docId = "nonexistent"

            ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue(null)

            const result = await encryptionService.decryptDocument(docId)

            expect(result).toBeNull()
            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith(`decrypt_doc_${docId}`)
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith(`decrypt_doc_${docId}`)
        })

        test("should handle errors during decryption", async () => {
            const docId = "doc123"

            ;(Keychain.getGenericPassword as jest.Mock).mockImplementation(() =>
                Promise.reject(new Error("Keychain error"))
            )

            const result = await encryptionService.decryptDocument(docId)

            expect(result).toBeNull()
            expect(
                PerformanceMonitoringService.startMeasure
            ).toHaveBeenCalledWith(`decrypt_doc_${docId}`)
            expect(
                PerformanceMonitoringService.endMeasure
            ).toHaveBeenCalledWith(`decrypt_doc_${docId}`)
        })
    })

    describe("deleteEncryptedDocument", () => {
        test("should delete document from secure storage", async () => {
            const docId = "doc123"

            const result = await encryptionService.deleteEncryptedDocument(
                docId
            )

            expect(result).toBe(true)
            expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
                service: `com.doc_wallet.doc.${docId}`,
            })
        })

        test("should handle deletion errors", async () => {
            const docId = "doc123"

            ;(Keychain.resetGenericPassword as jest.Mock).mockImplementation(
                () => Promise.reject(new Error("Deletion error"))
            )

            const result = await encryptionService.deleteEncryptedDocument(
                docId
            )

            expect(result).toBe(false)
        })
    })
})
