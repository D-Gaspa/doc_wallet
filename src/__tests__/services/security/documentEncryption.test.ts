import { DocumentEncryptionService } from "../../../services/security/documentEncryption"
import * as Keychain from "react-native-keychain"

jest.mock("react-native-keychain", () => ({
    setGenericPassword: jest.fn().mockResolvedValue(true),
    getGenericPassword: jest.fn(),
    resetGenericPassword: jest.fn().mockResolvedValue(true),
    ACCESSIBLE: {
        WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
    },
}))

describe("DocumentEncryptionService", () => {
    let encryptionService: DocumentEncryptionService

    beforeEach(() => {
        encryptionService = new DocumentEncryptionService()
        jest.clearAllMocks()
    })

    test("encryptDocument should store document content securely", async () => {
        const docId = "doc123"
        const content = "Sensitive document content"

        const result = await encryptionService.encryptDocument(docId, content)

        expect(result).toBe(true)
        expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
            docId,
            content,
            expect.objectContaining({
                service: `com.doc_wallet.doc.${docId}`,
                accessible: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
            })
        )
    })

    test("decryptDocument should retrieve stored document content", async () => {
        const docId = "doc123"
        const content = "Encrypted content"

        ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
            username: docId,
            password: content,
        })

        const result = await encryptionService.decryptDocument(docId)

        expect(result).toBe(content)
        expect(Keychain.getGenericPassword).toHaveBeenCalledWith({
            service: `com.doc_wallet.doc.${docId}`,
        })
    })

    test("decryptDocument should return null for non-existent document", async () => {
        ;(Keychain.getGenericPassword as jest.Mock).mockResolvedValue(null)

        const result = await encryptionService.decryptDocument("nonexistent")

        expect(result).toBeNull()
    })

    test("deleteEncryptedDocument should remove stored document", async () => {
        const docId = "doc123"

        const result = await encryptionService.deleteEncryptedDocument(docId)

        expect(result).toBe(true)
        expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
            service: `com.doc_wallet.doc.${docId}`,
        })
    })
})
