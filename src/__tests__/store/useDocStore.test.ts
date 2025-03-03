import AsyncStorage from "@react-native-async-storage/async-storage"
import {
    mockDecryptDocument,
    mockDeleteEncryptedDocument,
    MockDocumentEncryptionService,
    mockEncryptDocument,
} from "../../__mocks__/services/security/documentEncryption"

import { useDocStore } from "../../store"

jest.mock("../../services/security/documentEncryption", () => ({
    DocumentEncryptionService: jest.fn(() => MockDocumentEncryptionService),
}))

describe("Document Store", () => {
    beforeEach(() => {
        AsyncStorage.clear()
        jest.clearAllMocks()

        // Reset store state
        useDocStore.getState()
        useDocStore.setState({
            documents: [],
            selectedDocument: null,
            isLoading: false,
            error: null,
        })
    })

    test("should add documents with encryption", async () => {
        const store = useDocStore.getState()
        const initialCount = store.documents.length

        // Set the mock to return true for encryption
        mockEncryptDocument.mockResolvedValue(true)

        const newDoc = await store.addDocument({
            title: "Test Document",
            content: "Test Content",
        })

        // Check that the mock was called
        expect(mockEncryptDocument).toHaveBeenCalledWith(
            newDoc.id,
            "Test Content"
        )

        // Verify store was updated correctly
        const updatedStore = useDocStore.getState()
        expect(updatedStore.documents.length).toBe(initialCount + 1)
        expect(updatedStore.documents[0].title).toBe("Test Document")
        expect(updatedStore.documents[0].content).toBe(`encrypted:${newDoc.id}`)
    })

    test("should update documents with encryption", async () => {
        const store = useDocStore.getState()

        // Add a document first
        mockEncryptDocument.mockResolvedValue(true)
        const doc = await store.addDocument({
            title: "Original Title",
            content: "Original Content",
        })

        // Reset mock calls
        jest.clearAllMocks()

        // Update the document
        await store.updateDocument(doc.id, {
            title: "Updated Title",
            content: "Updated Content",
        })

        // Check encryption was called
        expect(mockEncryptDocument).toHaveBeenCalledWith(
            doc.id,
            "Updated Content"
        )

        // Check document was updated
        const updatedStore = useDocStore.getState()
        const updatedDoc = updatedStore.documents.find((d) => d.id === doc.id)
        expect(updatedDoc?.title).toBe("Updated Title")
        expect(updatedDoc?.content).toBe(`encrypted:${doc.id}`)
    })

    test("should delete documents and their encrypted content", async () => {
        const store = useDocStore.getState()

        // Add a document first
        mockEncryptDocument.mockResolvedValue(true)
        const doc = await store.addDocument({
            title: "Test Document",
            content: "Test Content",
        })

        const initialCount = useDocStore.getState().documents.length

        // Reset mocks
        jest.clearAllMocks()

        // Delete the document
        await store.deleteDocument(doc.id)

        // Check deletion was called
        expect(mockDeleteEncryptedDocument).toHaveBeenCalledWith(doc.id)

        // Check document was removed
        const updatedStore = useDocStore.getState()
        expect(updatedStore.documents.length).toBe(initialCount - 1)
        expect(
            updatedStore.documents.find((d) => d.id === doc.id)
        ).toBeUndefined()
    })

    test("should select documents", async () => {
        const store = useDocStore.getState()

        // Add a document first
        mockEncryptDocument.mockResolvedValue(true)
        const doc = await store.addDocument({
            title: "Test Document",
            content: "Test Content",
        })

        // Select the document
        store.selectDocument(doc.id)

        // Check document was selected
        let updatedStore = useDocStore.getState()
        expect(updatedStore.selectedDocument).not.toBeNull()
        expect(updatedStore.selectedDocument?.title).toBe("Test Document")

        // Deselect the document
        store.selectDocument(null)
        updatedStore = useDocStore.getState()
        expect(updatedStore.selectedDocument).toBeNull()
    })

    test("should get decrypted content", async () => {
        const store = useDocStore.getState()

        // Add a document first
        mockEncryptDocument.mockResolvedValue(true)
        const doc = await store.addDocument({
            title: "Test Document",
            content: "Sensitive Content",
        })

        // Reset mocks
        jest.clearAllMocks()

        // Get decrypted content
        const decryptedContent = await store.getDecryptedContent(doc.id)

        // Check decryption was called
        expect(mockDecryptDocument).toHaveBeenCalledWith(doc.id)

        // Check the correct content was returned
        expect(decryptedContent).toBe(`Decrypted content for ${doc.id}`)
    })
})
