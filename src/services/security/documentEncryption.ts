import * as Keychain from "react-native-keychain"
import { LoggingService } from "../monitoring/loggingService"
import { PerformanceMonitoringService } from "../monitoring/performanceMonitoringService"
import * as FileSystem from "expo-file-system"
import CryptoJS from "crypto-js"
import QuickCrypto from "react-native-quick-crypto"
import { Buffer } from "buffer"

export class DocumentEncryptionService {
    private readonly keyPrefix = "com.doc_wallet.doc."
    private readonly logger = LoggingService.getLogger("DocumentEncryption")

    /**
     * Encrypt a document and store its key securely
     * Uses React Native compatible approach with QuickCrypto for secure random generation
     */
    async encryptDocument(
        documentId: string,
        fileUri?: string,
        content?: string,
    ): Promise<boolean> {
        PerformanceMonitoringService.startMeasure(`encrypt_doc_${documentId}`)

        try {
            this.logger.debug(`Encrypting document: ${documentId}`)

            if (fileUri) {
                const fileInfo = await FileSystem.getInfoAsync(fileUri)
                if (!fileInfo.exists) {
                    throw new Error(`File does not exist: ${fileUri}`)
                }

                const randomKeyBytes = QuickCrypto.randomBytes(32)
                const keyBase64 = Buffer.from(randomKeyBytes).toString("base64")
                const key = CryptoJS.enc.Base64.parse(keyBase64)

                this.logger.debug(
                    `Generated secure random key: ${keyBase64.length} chars`,
                )

                await Keychain.setGenericPassword(documentId, keyBase64, {
                    service: `${this.keyPrefix}${documentId}`,
                    accessible:
                        Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                })

                const fileContent = await FileSystem.readAsStringAsync(
                    fileUri,
                    {
                        encoding: FileSystem.EncodingType.Base64,
                    },
                )

                this.logger.debug(
                    `File content read: ${fileContent.length} characters`,
                )

                const randomIvBytes = QuickCrypto.randomBytes(16)
                const ivBase64 = Buffer.from(randomIvBytes).toString("base64")
                const iv = CryptoJS.enc.Base64.parse(ivBase64)

                this.logger.debug(
                    `Generated secure random IV: ${ivBase64.length} chars`,
                )

                const contentWordArray = CryptoJS.enc.Base64.parse(fileContent)

                const encrypted = CryptoJS.AES.encrypt(
                    CryptoJS.enc.Base64.stringify(contentWordArray),
                    key,
                    {
                        iv: iv,
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7,
                    },
                )

                const encryptedText = encrypted.toString()
                this.logger.debug(
                    `Encrypted content: ${encryptedText.length} characters`,
                )

                const encryptedWithMetadata = `DWENC2:${ivBase64}:${encryptedText}`
                await FileSystem.writeAsStringAsync(
                    fileUri,
                    encryptedWithMetadata,
                )

                this.logger.debug(
                    `File document encrypted successfully: ${documentId}`,
                )
                PerformanceMonitoringService.endMeasure(
                    `encrypt_doc_${documentId}`,
                )
                return true
            } else if (content) {
                // For text content, just store it securely
                await Keychain.setGenericPassword(documentId, content, {
                    service: `${this.keyPrefix}${documentId}`,
                    accessible:
                        Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                })
                this.logger.debug(
                    `Text document encrypted successfully: ${documentId}`,
                )
                PerformanceMonitoringService.endMeasure(
                    `encrypt_doc_${documentId}`,
                )
                return true
            } else {
                throw new Error(
                    "No content or file URI provided for encryption",
                )
            }
        } catch (error) {
            this.logger.error(`Error encrypting document ${documentId}:`, error)
            PerformanceMonitoringService.endMeasure(`encrypt_doc_${documentId}`)
            return false
        }
    }

    /**
     * Decrypt a file document in new temp uri
     */
    async decryptFileForPreview(
        documentId: string,
        fileUri: string,
        tempUri: string,
    ): Promise<boolean> {
        PerformanceMonitoringService.startMeasure(
            `decrypt_preview_${documentId}`,
        )
        try {
            this.logger.debug(`Preparing preview for document: ${documentId}`)

            const credentials = await Keychain.getGenericPassword({
                service: `${this.keyPrefix}${documentId}`,
            })

            if (!credentials) {
                this.logger.error(
                    `Encryption key not found for document: ${documentId}`,
                )
                PerformanceMonitoringService.endMeasure(
                    `decrypt_preview_${documentId}`,
                )
                return false
            }

            const encryptedContent = await FileSystem.readAsStringAsync(fileUri)
            this.logger.debug(
                `Read encrypted content: ${encryptedContent.length} characters`,
            )

            try {
                if (!encryptedContent.startsWith("DWENC2:")) {
                    this.logger.error(
                        `Invalid encryption format for document: ${documentId}`,
                    )
                    PerformanceMonitoringService.endMeasure(
                        `decrypt_preview_${documentId}`,
                    )
                    return false
                }

                const parts = encryptedContent.split(":")
                if (parts.length !== 3) {
                    this.logger.error(
                        `Invalid encryption structure: ${parts.length} parts found`,
                    )
                    PerformanceMonitoringService.endMeasure(
                        `decrypt_preview_${documentId}`,
                    )
                    return false
                }

                const ivBase64 = parts[1]
                const ciphertext = parts[2]

                this.logger.debug(
                    `IV: ${ivBase64.length} chars, Ciphertext: ${ciphertext.length} chars`,
                )

                const key = CryptoJS.enc.Base64.parse(credentials.password)
                const iv = CryptoJS.enc.Base64.parse(ivBase64)

                const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7,
                })

                const decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8)
                this.logger.debug(
                    `Decrypted content: ${decryptedBase64.length} characters`,
                )

                await FileSystem.writeAsStringAsync(tempUri, decryptedBase64, {
                    encoding: FileSystem.EncodingType.Base64,
                })

                const tempFileInfo = await FileSystem.getInfoAsync(tempUri, {
                    size: true,
                })
                if (
                    !tempFileInfo.exists ||
                    (tempFileInfo.size !== undefined && tempFileInfo.size === 0)
                ) {
                    this.logger.error(
                        `Temp file was not created properly: ${tempUri}`,
                    )
                    PerformanceMonitoringService.endMeasure(
                        `decrypt_preview_${documentId}`,
                    )
                    return false
                }

                this.logger.debug(
                    `Created temp file: ${tempFileInfo.size} bytes`,
                )
                this.logger.debug(
                    `Document decrypted successfully for preview: ${documentId}`,
                )
                PerformanceMonitoringService.endMeasure(
                    `decrypt_preview_${documentId}`,
                )
                return true
            } catch (error) {
                this.logger.error(
                    `Decryption failed for document ${documentId}:`,
                    error,
                )
                PerformanceMonitoringService.endMeasure(
                    `decrypt_preview_${documentId}`,
                )
                return false
            }
        } catch (error) {
            this.logger.error(
                `Error preparing preview for document ${documentId}:`,
                error,
            )
            PerformanceMonitoringService.endMeasure(
                `decrypt_preview_${documentId}`,
            )
            return false
        }
    }

    /**
     * Decrypt a document content
     * Returns the stored content for text documents
     * For file documents, returns the encryption key
     */
    async decryptDocument(documentId: string): Promise<string | null> {
        PerformanceMonitoringService.startMeasure(`decrypt_doc_${documentId}`)
        try {
            this.logger.debug(
                `Retrieving encrypted content for document: ${documentId}`,
            )
            const credentials = await Keychain.getGenericPassword({
                service: `${this.keyPrefix}${documentId}`,
            })

            if (!credentials) {
                this.logger.warn(
                    `Document not found for decryption: ${documentId}`,
                )
                PerformanceMonitoringService.endMeasure(
                    `decrypt_doc_${documentId}`,
                )
                return null
            }

            this.logger.debug(
                `Document content retrieved successfully: ${documentId}`,
            )
            PerformanceMonitoringService.endMeasure(`decrypt_doc_${documentId}`)
            return credentials.password
        } catch (error) {
            this.logger.error(
                `Error retrieving document content ${documentId}:`,
                error,
            )
            PerformanceMonitoringService.endMeasure(`decrypt_doc_${documentId}`)
            return null
        }
    }

    async deleteEncryptedDocument(documentId: string): Promise<boolean> {
        try {
            this.logger.debug(`Deleting encrypted document: ${documentId}`)
            await Keychain.resetGenericPassword({
                service: `${this.keyPrefix}${documentId}`,
            })
            this.logger.debug(`Document deleted successfully: ${documentId}`)
            return true
        } catch (error) {
            this.logger.error(
                `Error deleting encrypted document ${documentId}:`,
                error,
            )
            return false
        }
    }
}
