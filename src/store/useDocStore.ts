import { create } from "zustand"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { IDocState, IDocument } from "../types/document"
import { DocumentType } from "../types/document"
import { DocumentEncryptionService } from "../services/security/documentEncryption"
import { LoggingService } from "../services/monitoring/loggingService"
import { PerformanceMonitoringService } from "../services/monitoring/performanceMonitoringService"
import { documentStorage } from "../services/document/storage"
import { generateUniqueId } from "../utils"
import { generateUniqueTitle } from "../utils/uniqueTitle"
import * as Notifications from "expo-notifications"
import { NotificationTriggerInput } from "expo-notifications"
import { useNotificationStore } from "./useNotificationStore"

export async function scheduleDocumentNotifications(
    doc: IDocument,
): Promise<string[]> {
    const expDateParam = doc.parameters?.find(
        (p) => p.key === "expiration_date",
    )?.value
    const notifyBeforeRaw = doc.parameters?.find(
        (p) => p.key === "expiration_notifications",
    )?.value

    if (!expDateParam || !notifyBeforeRaw) return []

    const notifyBeforeDays: number[] = JSON.parse(notifyBeforeRaw)
    const expDate = new Date(expDateParam)
    const ids: string[] = []

    for (const daysBefore of notifyBeforeDays) {
        const triggerDate = new Date(expDate)
        triggerDate.setDate(triggerDate.getDate() - daysBefore)

        const today = new Date()
        const msInDay = 1000 * 60 * 60 * 24

        const diffDays = Math.ceil(
            (expDate.getTime() - today.getTime()) / msInDay,
        )

        if (triggerDate > new Date()) {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: "📄 Document Expiration",
                    body: `${doc.title} expires in ${diffDays} day(s)!`,
                    sound: "default",
                },
                trigger: {
                    type: "timestamp",
                    timestamp: triggerDate.getTime(),
                } as unknown as NotificationTriggerInput,
            })
            ids.push(id)
        }
    }
    return ids
}

const docEncryption = new DocumentEncryptionService()
const logger = LoggingService.getLogger("DocStore")
const DOC_STORE_PREFIX = "doc-store-"

interface IDocStateWithPersistence extends IDocState {
    loadDocuments: (userId: string) => Promise<void>
    saveDocuments: (userId: string) => Promise<void>
    reset: () => void
}

export const useDocStore = create<IDocStateWithPersistence>()((set, get) => ({
    documents: [],
    selectedDocument: null,
    isLoading: false,
    error: null,

    loadDocuments: async (userId: string) => {
        if (!userId) {
            logger.warn("loadDocuments called without userId, resetting state.")
            get().reset()
            return
        }
        const key = `${DOC_STORE_PREFIX}${userId}`
        logger.debug(
            `Attempting to load documents for user ${userId} from key: ${key}`,
        )
        set({ isLoading: true, error: null })
        try {
            const storedData = await AsyncStorage.getItem(key)
            if (storedData) {
                const parsedData = JSON.parse(storedData)

                const documentsToLoad = Array.isArray(parsedData?.documents)
                    ? // eslint-disable-next-line
                      parsedData.documents.map((doc: any) => ({
                          ...doc,

                          createdAt: doc.metadata?.createdAt
                              ? new Date(doc.metadata.createdAt)
                              : new Date(),
                          updatedAt: doc.metadata?.updatedAt
                              ? new Date(doc.metadata.updatedAt)
                              : new Date(),
                          metadata: {
                              ...doc.metadata,
                              createdAt: doc.metadata?.createdAt
                                  ? new Date(doc.metadata.createdAt)
                                  : new Date(),
                              updatedAt: doc.metadata?.updatedAt
                                  ? new Date(doc.metadata.updatedAt)
                                  : new Date(),
                          },
                      }))
                    : []
                set({ documents: documentsToLoad, isLoading: false })
                logger.info(
                    `Loaded ${documentsToLoad.length} documents for user ${userId}`,
                )
            } else {
                logger.info(
                    `No persisted document data found for user ${userId}, starting fresh.`,
                )
                set({ documents: [], isLoading: false })
            }
        } catch (error) {
            logger.error(
                `Failed to load documents for user ${userId} from key ${key}:`,
                error,
            )
            set({
                error: "Failed to load documents",
                isLoading: false,
                documents: [],
            })
        }
    },

    saveDocuments: async (userId: string) => {
        if (!userId) {
            logger.warn("saveDocuments called without userId.")
            return
        }
        const key = `${DOC_STORE_PREFIX}${userId}`
        logger.debug(
            `Attempting to save documents for user ${userId} to key: ${key}`,
        )
        try {
            const stateToPersist = {
                documents: get().documents,
            }
            await AsyncStorage.setItem(key, JSON.stringify(stateToPersist))
            logger.info(
                `Saved ${stateToPersist.documents.length} documents for user ${userId}`,
            )
        } catch (error) {
            logger.error(
                `Failed to save documents for user ${userId} to key ${key}:`,
                error,
            )
        }
    },

    reset: () => {
        logger.info("Resetting DocStore in-memory state")
        const currentDocuments = get().documents

        currentDocuments.forEach((doc) => {
            const notifIds = useNotificationStore
                .getState()
                .getScheduledForDoc(doc.id)
            notifIds.forEach((notifId) =>
                Notifications.cancelScheduledNotificationAsync(notifId).catch(
                    (e) =>
                        logger.warn(
                            `Failed cancelling notification ${notifId} for doc ${doc.id}`,
                            e,
                        ),
                ),
            )
            useNotificationStore.getState().unregisterScheduled(doc.id)
        })

        set({
            documents: [],
            selectedDocument: null,
            isLoading: false,
            error: null,
        })
    },

    getDocumentById: (id) => {
        logger.debug(`Getting document by ID: ${id}`)
        const document = get().documents.find((doc) => doc.id === id)

        if (
            document &&
            document.content &&
            document.content.startsWith("encrypted:")
        ) {
            logger.debug(`Document ${id} content is marked as encrypted.`)
        }
        return document
    },

    fetchDocument: async (
        id: string,
    ): Promise<{ document: IDocument; previewUri: string } | null> => {
        PerformanceMonitoringService.startMeasure(`fetch_document_${id}`)
        try {
            logger.debug(`Fetching document ${id} for viewing`)
            const document = get().documents.find((doc) => doc.id === id)

            if (!document) {
                logger.warn(`Document ${id} not found`)
                PerformanceMonitoringService.endMeasure(`fetch_document_${id}`)
                return null
            }

            let previewUri = document.sourceUri

            if (
                document.metadata.type !== DocumentType.TEXT &&
                document.sourceUri.startsWith("encrypted:")
            ) {
                previewUri = await documentStorage.getDocumentTempUri(document)
                logger.debug(
                    `Created temporary preview URI for encrypted file ${id}: ${previewUri}`,
                )
            } else if (
                document.metadata.type === DocumentType.TEXT &&
                document.content?.startsWith("encrypted:")
            ) {
                previewUri = await documentStorage.getDocumentTempUri(document)
                logger.debug(
                    `Created temporary preview URI for encrypted text content ${id}: ${previewUri}`,
                )
            } else {
                logger.debug(
                    `Using direct path for unencrypted document ${id}: ${document.sourceUri}`,
                )
            }
            PerformanceMonitoringService.endMeasure(`fetch_document_${id}`)
            return { document, previewUri }
        } catch (error) {
            logger.error(`Error fetching document ${id}:`, error)
            PerformanceMonitoringService.endMeasure(`fetch_document_${id}`)
            set({ error: `Failed to fetch document ${id}` })
            return null
        }
    },

    addDocument: async (documentData) => {
        PerformanceMonitoringService.startMeasure("add_document_manual_persist")
        set({ isLoading: true, error: null })
        try {
            logger.info(
                "Attempting to add new document with manual persistence",
            )
            const id = generateUniqueId()
            const existingTitles = get().documents.map(
                (doc) => doc.title?.trim() || "",
            )
            const baseTitle = documentData.title?.trim() || "Untitled"
            const uniqueTitle = generateUniqueTitle(baseTitle, existingTitles)

            const shouldEncrypt =
                documentData.metadata.type === DocumentType.TEXT ||
                documentData.parameters?.find((p) => p.key === "encrypt")
                    ?.value === "true"

            let storedDocument: IDocument

            if (documentData.metadata.type === DocumentType.TEXT) {
                let contentToStore = documentData.content || ""
                if (shouldEncrypt && contentToStore) {
                    await docEncryption.encryptDocument(id, contentToStore)
                    contentToStore = `encrypted:${id}`
                }
                storedDocument = {
                    ...documentData,
                    id,
                    title: uniqueTitle,
                    content: contentToStore,
                    metadata: {
                        ...documentData.metadata,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                }
            } else {
                storedDocument = await documentStorage.importAndStoreDocument(
                    {
                        ...documentData,
                        id,
                        title: uniqueTitle,
                        metadata: {
                            ...documentData.metadata,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                    },
                    documentData.sourceUri,
                    shouldEncrypt,
                )
            }

            const notificationIds = await scheduleDocumentNotifications(
                storedDocument,
            )
            if (notificationIds.length > 0) {
                useNotificationStore
                    .getState()
                    .registerScheduled(id, notificationIds)
            }

            set((state) => ({
                documents: [...state.documents, storedDocument],
                isLoading: false,
            }))
            logger.info(
                `Document added successfully with ID: ${id} (manual persistence)`,
            )
            PerformanceMonitoringService.endMeasure(
                "add_document_manual_persist",
            )

            return storedDocument
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            logger.error("Failed to add document (manual persistence):", error)
            set({ error: errorMessage, isLoading: false })
            PerformanceMonitoringService.endMeasure(
                "add_document_manual_persist",
            )
            throw error
        }
    },

    updateDocument: async (id, updates) => {
        PerformanceMonitoringService.startMeasure(
            `update_document_manual_persist_${id}`,
        )
        set({ isLoading: true, error: null })
        try {
            logger.info(
                `Attempting to update document ${id} (manual persistence)`,
            )
            const existingDoc = get().documents.find((doc) => doc.id === id)
            if (!existingDoc) {
                throw new Error(`Document with ID ${id} not found for update.`)
            }

            const processedUpdates: Partial<IDocument> = {
                ...updates,
                metadata: {
                    ...(existingDoc.metadata || {}),
                    ...(updates.metadata || {}),
                    updatedAt: new Date().toISOString(),
                },
            }

            if (
                updates.sourceUri &&
                existingDoc.metadata.type !== DocumentType.TEXT
            ) {
                const shouldEncrypt =
                    updates.parameters?.find((p) => p.key === "encrypt")
                        ?.value === "true" ||
                    existingDoc.sourceUri.startsWith("encrypted:")
                const filename =
                    updates.sourceUri.split("/").pop() || `document_${id}`

                processedUpdates.sourceUri = (
                    await documentStorage.saveFile(
                        updates.sourceUri,
                        id,
                        shouldEncrypt,
                        filename,
                    )
                ).uri
                if (shouldEncrypt) {
                    processedUpdates.content = `encrypted:${id}`
                } else {
                    processedUpdates.content = ""
                }

                const extension = filename.split(".").pop()?.toLowerCase()
                if (processedUpdates.metadata) {
                    if (extension === "pdf") {
                        processedUpdates.metadata.type = DocumentType.PDF
                    } else if (
                        ["jpg", "jpeg", "png"].includes(extension || "")
                    ) {
                        processedUpdates.metadata.type =
                            extension === "png"
                                ? DocumentType.IMAGE_PNG
                                : DocumentType.IMAGE
                    }
                }
                logger.debug(`File for document ${id} updated and processed.`)
            } else if (
                updates.content &&
                existingDoc.metadata.type === DocumentType.TEXT
            ) {
                const shouldEncrypt =
                    updates.parameters?.find((p) => p.key === "encrypt")
                        ?.value === "true" ||
                    existingDoc.content?.startsWith("encrypted:")
                if (shouldEncrypt) {
                    await docEncryption.encryptDocument(id, updates.content)
                    processedUpdates.content = `encrypted:${id}`
                    logger.debug(
                        `Text content for document ${id} encrypted and updated.`,
                    )
                } else {
                    await docEncryption.deleteEncryptedDocument(id)
                    processedUpdates.content = updates.content
                    logger.debug(
                        `Text content for document ${id} updated (plaintext).`,
                    )
                }
            }

            const oldExpDate = existingDoc.parameters?.find(
                (p) => p.key === "expiration_date",
            )?.value
            const newExpDate = updates.parameters?.find(
                (p) => p.key === "expiration_date",
            )?.value
            const oldNotifyRaw = existingDoc.parameters?.find(
                (p) => p.key === "expiration_notifications",
            )?.value
            const newNotifyRaw = updates.parameters?.find(
                (p) => p.key === "expiration_notifications",
            )?.value

            const updatedDocumentForNotifications = {
                ...existingDoc,
                ...processedUpdates,
            } as IDocument

            if (oldExpDate !== newExpDate || oldNotifyRaw !== newNotifyRaw) {
                const oldNotifIds = useNotificationStore
                    .getState()
                    .getScheduledForDoc(id)
                oldNotifIds.forEach((notifId) =>
                    Notifications.cancelScheduledNotificationAsync(
                        notifId,
                    ).catch((e) =>
                        logger.warn("Failed cancelling old notif", e),
                    ),
                )
                useNotificationStore.getState().unregisterScheduled(id)

                const newNotificationIds = await scheduleDocumentNotifications(
                    updatedDocumentForNotifications,
                )
                if (newNotificationIds.length > 0) {
                    useNotificationStore
                        .getState()
                        .registerScheduled(id, newNotificationIds)
                }
            }

            set((state) => ({
                documents: state.documents.map((doc) =>
                    doc.id === id ? { ...doc, ...processedUpdates } : doc,
                ),
                isLoading: false,
            }))

            const finalUpdatedDoc = get().documents.find((doc) => doc.id === id)
            logger.info(
                `Document ${id} updated successfully (manual persistence).`,
            )
            PerformanceMonitoringService.endMeasure(
                `update_document_manual_persist_${id}`,
            )

            return finalUpdatedDoc
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            logger.error(
                `Failed to update document ${id} (manual persistence):`,
                error,
            )
            set({ error: errorMessage, isLoading: false })
            PerformanceMonitoringService.endMeasure(
                `update_document_manual_persist_${id}`,
            )
            throw error
        }
    },

    deleteDocument: async (id) => {
        PerformanceMonitoringService.startMeasure(
            `delete_document_manual_persist_${id}`,
        )
        set({ isLoading: true, error: null })
        try {
            logger.info(
                `Attempting to delete document ${id} (manual persistence)`,
            )
            const documentToDelete = get().documents.find(
                (doc) => doc.id === id,
            )

            if (!documentToDelete) {
                throw new Error(
                    `Document with ID ${id} not found for deletion.`,
                )
            }

            const notifIds = useNotificationStore
                .getState()
                .getScheduledForDoc(id)
            for (const notifId of notifIds) {
                await Notifications.cancelScheduledNotificationAsync(
                    notifId,
                ).catch((e) =>
                    logger.warn("Failed cancelling notif on delete", e),
                )
            }
            useNotificationStore.getState().unregisterScheduled(id)

            if (
                documentToDelete.metadata.type !== DocumentType.TEXT &&
                documentToDelete.sourceUri
            ) {
                await documentStorage.deleteFile(
                    id,
                    documentToDelete.title || `document_${id}`,
                )
                logger.debug(`Physical file for document ${id} deleted.`)
            }

            if (documentToDelete.content?.startsWith("encrypted:")) {
                await docEncryption.deleteEncryptedDocument(id)
                logger.debug(`Encrypted content for document ${id} deleted.`)
            }

            set((state) => ({
                documents: state.documents.filter((doc) => doc.id !== id),
                selectedDocument:
                    state.selectedDocument?.id === id
                        ? null
                        : state.selectedDocument,
                isLoading: false,
            }))

            logger.info(
                `Document ${id} deleted successfully (manual persistence).`,
            )
            PerformanceMonitoringService.endMeasure(
                `delete_document_manual_persist_${id}`,
            )
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            logger.error(
                `Failed to delete document ${id} (manual persistence):`,
                error,
            )
            set({ error: errorMessage, isLoading: false })
            PerformanceMonitoringService.endMeasure(
                `delete_document_manual_persist_${id}`,
            )
            throw error
        }
    },

    selectDocument: (id) => {
        if (id === null) {
            logger.debug("Clearing document selection")
            set({ selectedDocument: null })
            return
        }
        logger.debug(`Selecting document ${id}`)
        const document = get().documents.find((doc) => doc.id === id) || null
        set({ selectedDocument: document })
    },

    getDocumentPreview: async (id: string): Promise<IDocument | null> => {
        PerformanceMonitoringService.startMeasure(
            `get_preview_manual_persist_${id}`,
        )
        try {
            logger.debug(`Getting preview for document ${id}`)
            const document = get().documents.find((doc) => doc.id === id)
            if (!document) {
                logger.warn(`Document ${id} not found for preview.`)
                PerformanceMonitoringService.endMeasure(
                    `get_preview_manual_persist_${id}`,
                )
                return null
            }

            const previewUri = await documentStorage.getDocumentTempUri(
                document,
            )
            logger.debug(`Preview URI for document ${id}: ${previewUri}`)
            PerformanceMonitoringService.endMeasure(
                `get_preview_manual_persist_${id}`,
            )
            return { ...document, sourceUri: previewUri }
        } catch (error) {
            logger.error(`Error getting preview for document ${id}:`, error)
            set({ error: `Failed to get preview for ${id}` })
            PerformanceMonitoringService.endMeasure(
                `get_preview_manual_persist_${id}`,
            )
            return null
        }
    },

    getDecryptedContent: async (id: string): Promise<string | null> => {
        PerformanceMonitoringService.startMeasure(
            `get_decrypted_manual_persist_${id}`,
        )
        try {
            const document = get().documents.find((doc) => doc.id === id)
            if (!document) {
                logger.warn(`Document ${id} not found for decryption.`)
                PerformanceMonitoringService.endMeasure(
                    `get_decrypted_manual_persist_${id}`,
                )
                return null
            }
            if (document.content?.startsWith("encrypted:")) {
                logger.debug(`Decrypting content for document ${id}.`)
                const decryptedContent = await docEncryption.decryptDocument(id)
                PerformanceMonitoringService.endMeasure(
                    `get_decrypted_manual_persist_${id}`,
                )
                return decryptedContent
            }
            logger.debug(`Content for document ${id} is not encrypted.`)
            PerformanceMonitoringService.endMeasure(
                `get_decrypted_manual_persist_${id}`,
            )
            return document.content || null
        } catch (error) {
            logger.error(`Error decrypting content for document ${id}:`, error)
            set({ error: `Failed to decrypt content for ${id}` })
            PerformanceMonitoringService.endMeasure(
                `get_decrypted_manual_persist_${id}`,
            )
            return null
        }
    },

    cleanupTempFiles: async () => {
        try {
            logger.debug("Cleaning up temporary document files.")
            await documentStorage.cleanupPreviewFiles()
            logger.debug("Temporary document files cleaned up.")
        } catch (error) {
            logger.error("Failed to cleanup temporary document files:", error)
        }
    },

    clearError: () => {
        logger.debug("Clearing document store error.")
        set({ error: null })
    },
}))
