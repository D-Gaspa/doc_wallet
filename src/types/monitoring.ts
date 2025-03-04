// Logging Types
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

export interface ILoggingConfig {
    minLevel: LogLevel
    enableConsoleOutput: boolean
}

// We create a type for log parameters to avoid any[]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ILogParams = any

// Error Tracking Types
export interface IAppContext {
    [key: string]: string | number | boolean | null | undefined
}

export interface ErrorRecord {
    timestamp: string
    name: string
    message: string
    stack?: string
    isFatal?: boolean
    context?: IAppContext
}

// Crash Reporting Types
export interface IAppState {
    screen?: string
    lastAction?: string

    [key: string]: string | number | boolean | null | undefined
}

export interface CrashReport extends ErrorRecord {
    recoveryAction?: string
    appState?: IAppState
}

// Performance Monitoring Types
export interface IPerformanceMetadata {
    [key: string]: string | number | boolean | null | undefined
}

export interface IPerformanceMetric {
    operationName: string
    duration: number
    timestamp: string
    metadata?: IPerformanceMetadata
}

export interface IPerformanceStats {
    min: number
    max: number
    avg: number
    count: number
}

// Security Testing Types
export interface ISecurityTestResult {
    name: string
    passed: boolean
    message?: string
    timestamp: string
    details: unknown
}
