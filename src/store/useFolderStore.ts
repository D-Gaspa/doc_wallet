import { create } from "zustand"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Folder } from "../components/ui/screens/folders/types"
import { FA6IconName } from "../types/icons"
import { LoggingService } from "../services/monitoring/loggingService"

type FolderState = {
    folders: Folder[]
    setFolders: (folders: Folder[]) => void
    addFolder: (folder: Folder) => void
    updateFolder: (
        folderId: string,
        updates: Partial<Omit<Folder, "id" | "createdAt" | "updatedAt">>,
    ) => void
}

type FolderStateWithPersistence = FolderState & {
    loadFolders: (userId: string) => Promise<void>
    saveFolders: (userId: string) => Promise<void>
    reset: () => void
}

const folderLogger = LoggingService.getLogger("FolderStore")
const FOLDER_STORE_PREFIX = "folder-store-"

const defaultFolders: Folder[] = [
    {
        id: "1",
        title: "Documentos de Viaje",
        parentId: null,
        type: "travel",
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: ["5", "6"],
        documentIds: [],
        favorite: false,
    },
    {
        id: "2",
        title: "Registros Médicos",
        parentId: null,
        type: "medical",
        isShared: true,
        sharedWith: ["user123", "user456"],
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: [],
        documentIds: [],
        favorite: false,
    },
    {
        id: "3",
        title: "Documentos del Vehículo",
        parentId: null,
        type: "car",
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: [],
        documentIds: [],
        favorite: false,
    },
    {
        id: "4",
        title: "Certificados de Educación",
        parentId: null,
        type: "education",
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: [],
        documentIds: [],
        favorite: true,
    },
    {
        id: "5",
        title: "Pasaporte",
        parentId: "1",
        type: "custom",
        customIconId: "passport" as FA6IconName,
        customIconColor: "#3498DB",
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: [],
        documentIds: [],
        favorite: false,
    },
    {
        id: "6",
        title: "Visas",
        parentId: "1",
        type: "custom",
        customIconId: "file-contract" as FA6IconName,
        customIconColor: "#2ECC71",
        isShared: true,
        sharedWith: ["user789"],
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: [],
        documentIds: [],
        favorite: false,
    },
    {
        id: "7",
        title: "Notas Importantes",
        parentId: null,
        type: "custom",
        customIconId: "note-sticky" as FA6IconName,
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: [],
        documentIds: [],
        favorite: false,
    },
]

export const useFolderStore = create<FolderStateWithPersistence>()(
    (set, get) => ({
        folders: [...defaultFolders.map((f) => ({ ...f }))],

        loadFolders: async (userId: string) => {
            if (!userId) {
                folderLogger.warn(
                    "loadFolders called without userId, resetting to default in-memory state.",
                )
                get().reset()
                return
            }
            const key = `${FOLDER_STORE_PREFIX}${userId}`
            folderLogger.debug(
                `Attempting to load folders for user ${userId} from key: ${key}`,
            )
            try {
                const storedData = await AsyncStorage.getItem(key)
                if (storedData) {
                    const parsedData = JSON.parse(storedData)

                    const foldersToLoad = (
                        Array.isArray(parsedData?.folders)
                            ? parsedData.folders
                            : []
                    )
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .map((f: any) => ({
                            ...f,

                            createdAt: f.createdAt
                                ? new Date(f.createdAt)
                                : new Date(),
                            updatedAt: f.updatedAt
                                ? new Date(f.updatedAt)
                                : new Date(),
                        }))
                    set({ folders: foldersToLoad })
                    folderLogger.info(
                        `Loaded ${foldersToLoad.length} folders for user ${userId}`,
                    )
                } else {
                    folderLogger.info(
                        `No persisted folder data found for user ${userId}, using default folders.`,
                    )
                    set({ folders: [...defaultFolders.map((f) => ({ ...f }))] })
                }
            } catch (error) {
                folderLogger.error(
                    `Failed to load folders for user ${userId} from key ${key}:`,
                    error,
                )
                set({ folders: [...defaultFolders.map((f) => ({ ...f }))] })
            }
        },

        saveFolders: async (userId: string) => {
            if (!userId) {
                folderLogger.warn(
                    "saveFolders called without userId. No data will be saved.",
                )
                return
            }
            const key = `${FOLDER_STORE_PREFIX}${userId}`
            folderLogger.debug(
                `Attempting to save folders for user ${userId} to key: ${key}`,
            )
            try {
                const stateToPersist = {
                    folders: get().folders,
                }
                await AsyncStorage.setItem(key, JSON.stringify(stateToPersist))
                folderLogger.info(
                    `Saved ${stateToPersist.folders.length} folders for user ${userId}`,
                )
            } catch (error) {
                folderLogger.error(
                    `Failed to save folders for user ${userId} to key ${key}:`,
                    error,
                )
            }
        },

        reset: () => {
            folderLogger.info(
                "Resetting FolderStore in-memory state to defaults.",
            )

            set({ folders: [...defaultFolders.map((f) => ({ ...f }))] })
        },

        setFolders: (newFolders) => {
            folderLogger.debug(
                `Setting folders directly. Count: ${newFolders.length}`,
            )
            set({ folders: newFolders })
        },

        addFolder: (newFolder) => {
            folderLogger.info(
                `Adding new folder: ${newFolder.title} (ID: ${newFolder.id})`,
            )
            set((state) => ({
                folders: [
                    ...state.folders,
                    {
                        ...newFolder,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
            }))
        },

        updateFolder: (folderId, updates) => {
            folderLogger.info(`Updating folder ID: ${folderId}`)
            set((state) => ({
                folders: state.folders.map((f) =>
                    f.id === folderId
                        ? { ...f, ...updates, updatedAt: new Date() }
                        : f,
                ),
            }))
        },
    }),
)
