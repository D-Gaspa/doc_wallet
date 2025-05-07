// types/auth.ts
import { IGoogleUser, IUser, IUserCredentials } from "./user"

export enum AuthMethod {
    BIOMETRIC = "biometric",
    PIN = "pin",
    GOOGLE = "google",
    EMAIL_PASSWORD = "email_password",
}

export interface IAuthState {
    user: IUser | null
    isAuthenticated: boolean
    isLoading: boolean
    preferredAuthMethod: AuthMethod
    registeredUsers: IUserCredentials[] // Remove optional marker since we'll always have this

    // Authentication methods - make them all required
    loginWithBiometrics: () => Promise<IUser | null>
    loginWithEmailPassword: (email: string, password: string) => Promise<IUser>
    registerUser: (
        data: Omit<IUserCredentials, "id" | "createdAt">,
        enableBiometrics: boolean,
    ) => Promise<boolean | string>
    login: (pin?: string) => Promise<IUser | null>
    logout: () => Promise<void>
    checkAuthStatus: () => Promise<void>
    setupPin: (pin: string) => Promise<boolean>
}

// Keep the rest of your interfaces as they are
export interface ITokens {
    accessToken: string
    refreshToken: string
    expiresAt: number
}

export interface IGoogleAuthResponse {
    user: IGoogleUser
    tokens: {
        accessToken: string
        refreshToken: string
        expiresAt: number
    }
}

export interface IJwtPayload {
    sub: string
    email: string
    name?: string
    picture?: string
    exp: number
}
