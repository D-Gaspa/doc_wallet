import { isDevelopment } from "../../config/env"
import { ILoggingConfig, ILogParams, LogLevel } from "../../types/monitoring"

export const LogConfig: ILoggingConfig = {
    minLevel: isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR,
    enableConsoleOutput: isDevelopment,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatError = (err: any): any => {
    if (err instanceof Error) {
        return {
            name: err.name,
            message: err.message,
            // Omit stack trace
        }
    }
    return err
}

export class LoggingService {
    static debug(message: string, ...optionalParams: ILogParams[]): void {
        LoggingService.log(LogLevel.DEBUG, message, ...optionalParams)
    }

    static info(message: string, ...optionalParams: ILogParams[]): void {
        LoggingService.log(LogLevel.INFO, message, ...optionalParams)
    }

    static warn(message: string, ...optionalParams: ILogParams[]): void {
        LoggingService.log(LogLevel.WARN, message, ...optionalParams)
    }

    static error(message: string, ...optionalParams: ILogParams[]): void {
        LoggingService.log(LogLevel.ERROR, message, ...optionalParams)
    }

    static getLogger(tag: string) {
        return {
            debug: (message: string, ...optionalParams: ILogParams[]) =>
                LoggingService.debug(`[${tag}] ${message}`, ...optionalParams),
            info: (message: string, ...optionalParams: ILogParams[]) =>
                LoggingService.info(`[${tag}] ${message}`, ...optionalParams),
            warn: (message: string, ...optionalParams: ILogParams[]) =>
                LoggingService.warn(`[${tag}] ${message}`, ...optionalParams),
            error: (message: string, ...optionalParams: ILogParams[]) =>
                LoggingService.error(`[${tag}] ${message}`, ...optionalParams),
        }
    }

    private static log(
        level: LogLevel,
        message: string,
        ...optionalParams: ILogParams[]
    ): void {
        if (level < LogConfig.minLevel) return

        const timestamp = new Date().toISOString()
        const prefix = `[${timestamp}][${LogLevel[level]}]`

        // Format parameters to clean up errors
        const cleanParams = optionalParams.map((param) =>
            param instanceof Error ? formatError(param) : param
        )

        // In development, output to console
        if (LogConfig.enableConsoleOutput) {
            switch (level) {
                case LogLevel.DEBUG:
                    console.log(prefix, message, ...cleanParams)
                    break
                case LogLevel.INFO:
                    console.info(prefix, message, ...cleanParams)
                    break
                case LogLevel.WARN:
                    console.warn(prefix, message, ...cleanParams)
                    break
                case LogLevel.ERROR:
                    console.error(prefix, message, ...cleanParams)
                    break
            }
        }

        // If we want to store logs locally for critical errors, we would add that logic here
    }
}
