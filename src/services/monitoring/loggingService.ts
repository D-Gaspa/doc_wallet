import { isDevelopment } from "../../config/env"
import { ILoggingConfig, ILogParams, LogLevel } from "../../types/monitoring"

export const LogConfig: ILoggingConfig = {
    minLevel: isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR,
    enableConsoleOutput: isDevelopment,
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

        // In development, output to console
        if (LogConfig.enableConsoleOutput) {
            switch (level) {
                case LogLevel.DEBUG:
                    console.log(prefix, message, ...optionalParams)
                    break
                case LogLevel.INFO:
                    console.info(prefix, message, ...optionalParams)
                    break
                case LogLevel.WARN:
                    console.warn(prefix, message, ...optionalParams)
                    break
                case LogLevel.ERROR:
                    console.error(prefix, message, ...optionalParams)
                    break
            }
        }

        // If we want to store logs locally for critical errors, we would add that logic here
    }
}
