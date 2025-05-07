import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { Folder } from "../components/ui/screens/folders/types"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { FA6IconName } from "../types/icons"

type FolderState = {
    folders: Folder[]
    setFolders: (folders: Folder[]) => void
    addFolder: (folder: Folder) => void
    updateFolder: (
        folderId: string,
        updates: Partial<Omit<Folder, "id" | "createdAt" | "updatedAt">>,
    ) => void
}

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

export const useFolderStore = create<FolderState>()(
    persist(
        (set) => ({
            folders: defaultFolders,

            setFolders: (folders) => set({ folders }),

            addFolder: (newFolder) =>
                set((state) => ({
                    folders: [...state.folders, newFolder],
                })),

            updateFolder: (folderId, updates) =>
                set((state) => ({
                    folders: state.folders.map((f) =>
                        f.id === folderId
                            ? { ...f, ...updates, updatedAt: new Date() }
                            : f,
                    ),
                })),
        }),
        {
            name: "folder-store",
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                if (!state) return

                state.folders = state.folders.map((f) => ({
                    ...f,
                    createdAt: new Date(f.createdAt),
                    updatedAt: new Date(f.updatedAt),
                }))
            },
        },
    ),
)
