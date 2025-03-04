import { StateCreator, StoreApi } from "zustand"
import { LoggingService } from "../../services/monitoring/loggingService"

const logger = LoggingService.getLogger("ZustandStore")

type SetStateFunction<T> = (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean
) => void

type GetStateFunction<T> = () => T

export const middlewareLogger =
    <T extends object>(f: StateCreator<T, [], []>, name = "store") =>
    (
        set: SetStateFunction<T>,
        get: GetStateFunction<T>,
        store: StoreApi<T>
    ) => {
        const loggedSet: typeof set = (...args: Parameters<typeof set>) => {
            logger.debug(`[${name}]: Applying state update`, args[0])
            set(...args)
            logger.debug(`[${name}]: New state:`, get())
        }
        return f(loggedSet, get, store)
    }
