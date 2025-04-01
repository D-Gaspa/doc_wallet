/**
 * Route name constants for the application
 * This helps prevent typos when navigating between screens
 */

// Authentication Routes
export const AUTH_ROUTES = {
    LOGIN: "Login",
    REGISTER: "Register",
    FORGOT_PASSWORD: "ForgotPassword",
    PIN_SETUP: "PinSetup",
    BIOMETRIC_SETUP: "BiometricSetup",
} as const

// Document Management Routes
export const DOCUMENT_ROUTES = {
    DOCUMENTS_HOME: "DocumentsHome",
    DOCUMENT_DETAILS: "DocumentDetails",
    ADD_DOCUMENT: "AddDocument",
    EDIT_DOCUMENT: "EditDocument",
    DOCUMENT_SCANNER: "DocumentScanner",
} as const

// Profile Management Routes
export const PROFILE_ROUTES = {
    PROFILES: "Profiles",
    PROFILE_DETAILS: "ProfileDetails",
    ADD_PROFILE: "AddProfile",
    EDIT_PROFILE: "EditProfile",
} as const

// Settings Routes
export const SETTINGS_ROUTES = {
    SETTINGS_HOME: "SettingsHome",
    NOTIFICATION_SETTINGS: "NotificationSettings",
    SECURITY_SETTINGS: "SecuritySettings",
    ABOUT: "About",
} as const

// Main Tab Routes
export const TAB_ROUTES = {
    DOCUMENTS: "documents",
    PROFILES: "Profiles",
    NOTIFICATIONS: "Notifications",
    SETTINGS: "Settings",
} as const

// Root Level Routes
export const ROOT_ROUTES = {
    AUTH: "Auth",
    MAIN: "Main",
    LOADING: "Loading",
} as const
