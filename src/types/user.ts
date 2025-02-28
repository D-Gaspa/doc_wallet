export interface IUser {
    id: string
    name: string | null
    email: string
}

export interface IGoogleUser extends IUser {
    photo: string | null
}
