import { IGoogleUser, IUser } from "./user.ts"

export interface IAuthState {
    user: IUser | null
    isAuthenticated: boolean
    isLoading: boolean
    login: () => Promise<void>
    logout: () => void
    checkAuthStatus: () => Promise<void>
}

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
