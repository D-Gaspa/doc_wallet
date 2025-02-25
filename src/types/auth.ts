import { IUser } from "./user.ts"

export interface IAuthState {
    user: IUser | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    checkAuthStatus: () => Promise<void>
}
