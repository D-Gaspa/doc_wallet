import Config from "react-native-config"
import { IEnvironmentVariables } from "../types/config.ts"

export const ENV: IEnvironmentVariables = {
    GOOGLE_CLIENT_ID: Config.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_ID_IOS: Config.GOOGLE_CLIENT_ID_IOS,
    GOOGLE_CLIENT_ID_ANDROID: Config.GOOGLE_CLIENT_ID_ANDROID,
    GOOGLE_REDIRECT_URL: Config.GOOGLE_REDIRECT_URL,
    APP_NAME: Config.APP_NAME || "doc_wallet",
    ENV_NAME:
        (Config.ENV_NAME as "development" | "staging" | "production") ||
        "development",
}

export const isDevelopment = ENV.ENV_NAME === "development"
export const isStaging = ENV.ENV_NAME === "staging"
export const isProduction = ENV.ENV_NAME === "production"

export default Config
