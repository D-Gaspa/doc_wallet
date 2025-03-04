import type { NavigatorScreenParams } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import {
    AUTH_ROUTES,
    DOCUMENT_ROUTES,
    PROFILE_ROUTES,
    ROOT_ROUTES,
    SETTINGS_ROUTES,
    TAB_ROUTES,
} from "./routes"
import "@react-navigation/native"

// Authentication Navigator Param List
export type AuthStackParamList = {
    [AUTH_ROUTES.LOGIN]: undefined
    [AUTH_ROUTES.REGISTER]: undefined
    [AUTH_ROUTES.FORGOT_PASSWORD]: undefined
    [AUTH_ROUTES.PIN_SETUP]: undefined
    [AUTH_ROUTES.BIOMETRIC_SETUP]: undefined
}

// Document Navigator Param List
export type DocumentStackParamList = {
    [DOCUMENT_ROUTES.DOCUMENTS_HOME]: undefined
    [DOCUMENT_ROUTES.DOCUMENT_DETAILS]: { documentId: string }
    [DOCUMENT_ROUTES.ADD_DOCUMENT]: undefined
    [DOCUMENT_ROUTES.EDIT_DOCUMENT]: { documentId: string }
    [DOCUMENT_ROUTES.DOCUMENT_SCANNER]: undefined
}

// Profile Navigator Param List
export type ProfileStackParamList = {
    [PROFILE_ROUTES.PROFILES]: undefined
    [PROFILE_ROUTES.PROFILE_DETAILS]: { profileId: string }
    [PROFILE_ROUTES.ADD_PROFILE]: undefined
    [PROFILE_ROUTES.EDIT_PROFILE]: { profileId: string }
}

// Settings Navigator Param List
export type SettingsStackParamList = {
    [SETTINGS_ROUTES.SETTINGS_HOME]: undefined
    [SETTINGS_ROUTES.NOTIFICATION_SETTINGS]: undefined
    [SETTINGS_ROUTES.SECURITY_SETTINGS]: undefined
    [SETTINGS_ROUTES.ABOUT]: undefined
}

// Main Tab Navigator Param List
export type MainTabParamList = {
    [TAB_ROUTES.DOCUMENTS]: NavigatorScreenParams<DocumentStackParamList>
    [TAB_ROUTES.PROFILES]: NavigatorScreenParams<ProfileStackParamList>
    [TAB_ROUTES.NOTIFICATIONS]: undefined
    [TAB_ROUTES.SETTINGS]: NavigatorScreenParams<SettingsStackParamList>
}

// Root Navigator Param List
export type RootStackParamList = {
    [ROOT_ROUTES.AUTH]: NavigatorScreenParams<AuthStackParamList>
    [ROOT_ROUTES.MAIN]: NavigatorScreenParams<MainTabParamList>
    [ROOT_ROUTES.LOADING]: undefined
}

// Custom helper types for screen props
export type RootStackScreenProps<T extends keyof RootStackParamList> =
    NativeStackScreenProps<RootStackParamList, T>

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
    NativeStackScreenProps<AuthStackParamList, T>

export type DocumentStackScreenProps<T extends keyof DocumentStackParamList> =
    NativeStackScreenProps<DocumentStackParamList, T>

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
    NativeStackScreenProps<ProfileStackParamList, T>

export type SettingsStackScreenProps<T extends keyof SettingsStackParamList> =
    NativeStackScreenProps<SettingsStackParamList, T>

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace ReactNavigation {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface RootParamList extends RootStackParamList {}
    }
}
