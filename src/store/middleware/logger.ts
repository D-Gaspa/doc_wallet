import { StateCreator, StoreApi } from "zustand"

type SetStateFunction<T> = (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean
) => void

type GetStateFunction<T> = () => T

export const logger =
    <T extends object>(f: StateCreator<T, [], []>, name = "store") =>
    (
        set: SetStateFunction<T>,
        get: GetStateFunction<T>,
        store: StoreApi<T>
    ) => {
        const loggedSet: typeof set = (...args: Parameters<typeof set>) => {
            console.log(`[${name}]: applying:`, args)
            set(...args)
            console.log(`[${name}]: new state:`, get())
        }
        return f(loggedSet, get, store)
    }
