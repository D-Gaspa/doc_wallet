// types/user.ts
export interface IUser {
    id: string
    name: string
    email: string
    profileImage?: string
}

export interface IGoogleUser {
    id: string
    email: string
    name?: string
    familyName?: string
    givenName?: string
    photo?: string
}

// User with credentials for authentication
export interface IUserCredentials {
    id: string
    email: string
    password: string
    name: string
    createdAt: string
    profileImage?: string
}

// Registration data (what the user provides during registration)
export interface IRegistrationData {
    firstName: string
    lastName: string
    email: string
    password: string
    acceptedTerms: boolean
}
