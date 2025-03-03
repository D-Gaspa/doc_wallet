import * as Keychain from "react-native-keychain"

export class DocumentEncryptionService {
    private readonly keyPrefix = "com.doc_wallet.doc."

    async encryptDocument(
        documentId: string,
        content: string
    ): Promise<boolean> {
        try {
            await Keychain.setGenericPassword(documentId, content, {
                service: `${this.keyPrefix}${documentId}`,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            })
            return true
        } catch (error) {
            console.error(`Error encrypting document ${documentId}:`, error)
            return false
        }
    }

    async decryptDocument(documentId: string): Promise<string | null> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: `${this.keyPrefix}${documentId}`,
            })

            if (!credentials) {
                return null
            }

            return credentials.password
        } catch (error) {
            console.error(`Error decrypting document ${documentId}:`, error)
            return null
        }
    }

    async deleteEncryptedDocument(documentId: string): Promise<boolean> {
        try {
            await Keychain.resetGenericPassword({
                service: `${this.keyPrefix}${documentId}`,
            })
            return true
        } catch (error) {
            console.error(
                `Error deleting encrypted document ${documentId}:`,
                error
            )
            return false
        }
    }
}
