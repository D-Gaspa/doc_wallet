import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { Folder } from "../components/ui/screens/folders/types"
import AsyncStorage from "@react-native-async-storage/async-storage"

type FolderState = {
    folders: Folder[]
    setFolders: (folders: Folder[]) => void
    addFolder: (folder: Folder) => void
    updateFolder: (folder: Folder) => void
}

const defaultFolders: Folder[] = [
    {
        id: "1",
        title: "Travel documents",
        parentId: null,
        type: "travel",
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: ["5", "6"],
        documentIds: [],
    },
    {
        id: "2",
        title: "Medical Records",
        parentId: null,
        type: "medical",
        isShared: true,
        sharedWith: ["user123", "user456"],
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: [],
        documentIds: [],
    },
    {
        id: "3",
        title: "Vehicle documents",
        parentId: null,
        type: "car",
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: [],
        documentIds: [],
    },
    {
        id: "4",
        title: "Education Certificates",
        parentId: null,
        type: "education",
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: [],
        documentIds: [],
    },
    {
        id: "5",
        title: "Passport",
        parentId: "1",
        type: "custom",
        customIconId: "file",
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: [],
        documentIds: [],
    },
    {
        id: "6",
        title: "Visas",
        parentId: "1",
        type: "custom",
        customIconId: "check",
        isShared: true,
        sharedWith: ["user789"],
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: [],
        documentIds: [],
    },
    {
        id: "7",
        title: "Important Notes",
        parentId: null,
        type: "custom",
        customIconId: "warning",
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        childFolderIds: [],
        documentIds: [],
    },
]

export const useFolderStore = create<FolderState>()(
    persist(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (set, get) => ({
            folders: defaultFolders,

            setFolders: (folders) => set({ folders }),

            addFolder: (folder) =>
                set((state) => ({
                    folders: [...state.folders, folder],
                })),

            updateFolder: (updated) =>
                set((state) => ({
                    folders: state.folders.map((f) =>
                        f.id === updated.id ? { ...f, ...updated } : f,
                    ),
                })),
        }),
        {
            name: "folder-store",
            storage: createJSONStorage(() => AsyncStorage),
        },
    ),
)
