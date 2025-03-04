import * as Keychain from "react-native-keychain"
import { LoggingService } from "../monitoring/loggingService"
import { PerformanceMonitoringService } from "../monitoring/performanceMonitoringService"

export class DocumentEncryptionService {
    private readonly keyPrefix = "com.doc_wallet.doc."
    private readonly logger = LoggingService.getLogger("DocumentEncryption")

    async encryptDocument(
        documentId: string,
        content: string
    ): Promise<boolean> {
        PerformanceMonitoringService.startMeasure(`encrypt_doc_${documentId}`)
        try {
            this.logger.debug(`Encrypting document: ${documentId}`)
            await Keychain.setGenericPassword(documentId, content, {
                service: `${this.keyPrefix}${documentId}`,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            })
            this.logger.debug(`Document encrypted successfully: ${documentId}`)
            PerformanceMonitoringService.endMeasure(`encrypt_doc_${documentId}`)
            return true
        } catch (error) {
            this.logger.error(`Error encrypting document ${documentId}:`, error)
            PerformanceMonitoringService.endMeasure(`encrypt_doc_${documentId}`)
            return false
        }
    }

    async decryptDocument(documentId: string): Promise<string | null> {
        PerformanceMonitoringService.startMeasure(`decrypt_doc_${documentId}`)
        try {
            this.logger.debug(`Decrypting document: ${documentId}`)
            const credentials = await Keychain.getGenericPassword({
                service: `${this.keyPrefix}${documentId}`,
            })

            if (!credentials) {
                this.logger.warn(
                    `Document not found for decryption: ${documentId}`
                )
                PerformanceMonitoringService.endMeasure(
                    `decrypt_doc_${documentId}`
                )
                return null
            }

            this.logger.debug(`Document decrypted successfully: ${documentId}`)
            PerformanceMonitoringService.endMeasure(`decrypt_doc_${documentId}`)
            return credentials.password
        } catch (error) {
            this.logger.error(`Error decrypting document ${documentId}:`, error)
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
                error
            )
            return false
        }
    }
}
