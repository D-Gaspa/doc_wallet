export interface IEnvironmentVariables {
    GOOGLE_CLIENT_ID: string | undefined
    GOOGLE_CLIENT_ID_IOS: string | undefined
    GOOGLE_CLIENT_ID_ANDROID: string | undefined
    GOOGLE_REDIRECT_URL: string | undefined
    APP_NAME: string
    ENV_NAME: "development" | "staging" | "production"
}
