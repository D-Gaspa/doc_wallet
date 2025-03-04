import { LinkingOptions } from "@react-navigation/native"
import { RootStackParamList } from "./types"
import {
    AUTH_ROUTES,
    DOCUMENT_ROUTES,
    PROFILE_ROUTES,
    ROOT_ROUTES,
    SETTINGS_ROUTES,
    TAB_ROUTES,
} from "./routes"

/**
 * Deep linking configuration for the app
 * This maps URL paths to screens in the navigation structure
 */
export const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ["docwallet://", "https://docwallet.app"],
    config: {
        initialRouteName: ROOT_ROUTES.LOADING,
        screens: {
            [ROOT_ROUTES.AUTH]: {
                screens: {
                    [AUTH_ROUTES.LOGIN]: "login",
                    [AUTH_ROUTES.REGISTER]: "register",
                    [AUTH_ROUTES.FORGOT_PASSWORD]: "forgot-password",
                    [AUTH_ROUTES.PIN_SETUP]: "pin-setup",
                    [AUTH_ROUTES.BIOMETRIC_SETUP]: "biometric-setup",
                },
            },
            [ROOT_ROUTES.MAIN]: {
                screens: {
                    [TAB_ROUTES.DOCUMENTS]: {
                        screens: {
                            [DOCUMENT_ROUTES.DOCUMENTS_HOME]: "documents",
                            [DOCUMENT_ROUTES.DOCUMENT_DETAILS]:
                                "documents/:documentId",
                            [DOCUMENT_ROUTES.ADD_DOCUMENT]: "documents/add",
                            [DOCUMENT_ROUTES.EDIT_DOCUMENT]:
                                "documents/edit/:documentId",
                            [DOCUMENT_ROUTES.DOCUMENT_SCANNER]:
                                "documents/scan",
                        },
                    },
                    [TAB_ROUTES.PROFILES]: {
                        screens: {
                            [PROFILE_ROUTES.PROFILES]: "profiles",
                            [PROFILE_ROUTES.PROFILE_DETAILS]:
                                "profiles/:profileId",
                            [PROFILE_ROUTES.ADD_PROFILE]: "profiles/add",
                            [PROFILE_ROUTES.EDIT_PROFILE]:
                                "profiles/edit/:profileId",
                        },
                    },
                    [TAB_ROUTES.NOTIFICATIONS]: "notifications",
                    [TAB_ROUTES.SETTINGS]: {
                        screens: {
                            [SETTINGS_ROUTES.SETTINGS_HOME]: "settings",
                            [SETTINGS_ROUTES.NOTIFICATION_SETTINGS]:
                                "settings/notifications",
                            [SETTINGS_ROUTES.SECURITY_SETTINGS]:
                                "settings/security",
                            [SETTINGS_ROUTES.ABOUT]: "settings/about",
                        },
                    },
                },
            },
            [ROOT_ROUTES.LOADING]: "loading",
        },
    },
}
