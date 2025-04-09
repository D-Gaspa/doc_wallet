export { AppNavigator } from "./AppNavigator"
export { AuthNavigator } from "./AuthNavigator"
export { DocumentNavigator } from "./DocumentNavigator"
export { ProfileNavigator } from "./ProfileNavigator"
export { SettingsNavigator } from "./SettingsNavigator"
export { MainNavigator } from "./MainNavigator"

export * from "./routes"

export * from "../types/navigation.ts"

export { linking } from "./linking"

// Export a convenience function to navigate outside of components
import { createNavigationContainerRef } from "@react-navigation/native"
import { RootStackParamList } from "../types/navigation.ts"

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function navigate(name: keyof RootStackParamList, params?: any) {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name, params)
    }
}

export type FolderMainViewRef = {
    resetToRootFolder: () => void
    navigateToFolder: (folderId: string) => void
}
