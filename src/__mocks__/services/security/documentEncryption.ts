export const mockEncryptDocument = jest.fn().mockResolvedValue(true)
export const mockDecryptDocument = jest
    .fn()
    .mockImplementation((docId: string) =>
        Promise.resolve(`Decrypted content for ${docId}`)
    )
export const mockDeleteEncryptedDocument = jest.fn().mockResolvedValue(true)

// Create a mock version of DocumentEncryptionService
export const MockDocumentEncryptionService = {
    encryptDocument: mockEncryptDocument,
    decryptDocument: mockDecryptDocument,
    deleteEncryptedDocument: mockDeleteEncryptedDocument,
}
