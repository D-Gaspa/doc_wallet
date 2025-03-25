// Mock Logging Service BEFORE importing ErrorBoundary
const mockLogger = {
    error: jest.fn(),
}

jest.mock("../../../services/monitoring/loggingService.ts", () => ({
    LoggingService: {
        getLogger: jest.fn(() => mockLogger), // Ensures this returns a valid object
    },
}))

import React from "react"
import { render } from "@testing-library/react-native"
import { Text } from "react-native"
import ErrorBoundary from "../../../components/common/ErrorBoundary.tsx"
import { ErrorTrackingService } from "../../../services/monitoring/errorTrackingService.ts"

// Mock ErrorTrackingService
jest.mock("../../../services/monitoring/errorTrackingService.ts", () => ({
    ErrorTrackingService: {
        handleError: jest.fn(),
    },
}))

// Suppress React error logs
beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {}) // Prevent Jest spam
    mockLogger.error.mockClear() // Reset call count before each test
})

afterEach(() => {
    jest.restoreAllMocks()
})

// 1. Normal rendering test
it("renders children when no error occurs", () => {
    const { getByText } = render(
        <ErrorBoundary>
            <Text>Normal Content</Text>
        </ErrorBoundary>,
    )

    expect(getByText("Normal Content")).toBeTruthy()
})

// 2. Ensures errors are caught and fallback UI is displayed
it("catches errors and renders fallback UI", () => {
    const ProblemChild = () => {
        throw new Error("Test Error") // Simulate a crashing component
    }

    const { getByText } = render(
        <ErrorBoundary>
            <ProblemChild />
        </ErrorBoundary>,
    )

    expect(getByText("Something went wrong.")).toBeTruthy()
})

// 3. Ensures error logging works
it("logs errors when a child component crashes", () => {
    const ProblemChild = () => {
        throw new Error("Simulated Error")
    }

    render(
        <ErrorBoundary>
            <ProblemChild />
        </ErrorBoundary>,
    )

    console.log("Mock Logger Calls:", mockLogger.error.mock.calls)

    expect(mockLogger.error).toHaveBeenCalledTimes(1)
    expect(mockLogger.error).toHaveBeenCalledWith(
        "UI Error caught by boundary",
        expect.any(Error),
    )
})

// 4. Ensures errors are sent to ErrorTrackingService
it("sends errors to ErrorTrackingService", () => {
    const ProblemChild = () => {
        throw new Error("Simulated Error")
    }

    render(
        <ErrorBoundary>
            <ProblemChild />
        </ErrorBoundary>,
    )

    expect(ErrorTrackingService.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        false,
    )
})
