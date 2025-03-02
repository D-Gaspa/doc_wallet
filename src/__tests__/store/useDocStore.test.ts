import { useDocStore } from "../../store"
import AsyncStorage from "@react-native-async-storage/async-storage"

describe("Document Store", () => {
    beforeEach(() => {
        AsyncStorage.clear()
        const store = useDocStore.getState()
        store.documents.forEach((doc) => store.deleteDocument(doc.id))
    })

    test("should add documents", async () => {
        const store = useDocStore.getState()
        const initialCount = store.documents.length

        const newDoc = await store.addDocument({
            title: "Test Document",
            content: "Test Content",
        })

        // Get the updated state
        const updatedStore = useDocStore.getState()
        expect(updatedStore.documents.length).toBe(initialCount + 1)
        expect(updatedStore.documents[0].title).toBe("Test Document")
        expect(updatedStore.documents[0].id).toBe(newDoc.id)
    })

    test("should update documents", async () => {
        const store = useDocStore.getState()

        const doc = await store.addDocument({
            title: "Original Title",
            content: "Original Content",
        })

        await store.updateDocument(doc.id, {
            title: "Updated Title",
        })

        // Get the latest state
        const updatedStore = useDocStore.getState()
        const updatedDoc = updatedStore.documents.find((d) => d.id === doc.id)

        expect(updatedDoc?.title).toBe("Updated Title")
        expect(updatedDoc?.content).toBe("Original Content")
    })

    test("should delete documents", async () => {
        const store = useDocStore.getState()

        const doc = await store.addDocument({
            title: "Test Document",
            content: "Test Content",
        })

        const initialCount = useDocStore.getState().documents.length

        await store.deleteDocument(doc.id)

        // Get the latest state
        const updatedStore = useDocStore.getState()
        expect(updatedStore.documents.length).toBe(initialCount - 1)
        expect(
            updatedStore.documents.find((d) => d.id === doc.id)
        ).toBeUndefined()
    })

    test("should select documents", async () => {
        const store = useDocStore.getState()

        const doc = await store.addDocument({
            title: "Test Document",
            content: "Test Content",
        })

        store.selectDocument(doc.id)

        // Get the latest state
        let updatedStore = useDocStore.getState()
        expect(updatedStore.selectedDocument).not.toBeNull()
        expect(updatedStore.selectedDocument?.title).toBe("Test Document")

        store.selectDocument(null)

        // Get the latest state again
        updatedStore = useDocStore.getState()
        expect(updatedStore.selectedDocument).toBeNull()
    })
})
