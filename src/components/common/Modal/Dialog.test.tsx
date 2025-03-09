import React from "react"
import { render, fireEvent } from "@testing-library/react-native"
import Dialog from "./Dialog"
import { Text } from "react-native"

// Mock useTheme to return colors dynamically
jest.mock("../../../hooks/useTheme", () => ({
    useTheme: jest.fn(() => ({
        colors: {
            background: "mocked-background",
            overlay: "mocked-overlay",
            text: "mocked-text",
            buttonPrimary: "mocked-primary",
            buttonSecondary: "mocked-secondary",
        },
    })),
}))

describe("Dialog", () => {
    it("renders when visible", () => {
        const { getByTestId } = render(
            <Dialog
                isVisible={true}
                onConfirm={jest.fn()}
                onCancel={jest.fn()}
                message="Test Dialog"
            >
                <Text>Dialog Content</Text>
            </Dialog>
        )

        expect(getByTestId("dialog-container")).toBeTruthy()
        expect(getByTestId("dialog-message")).toHaveTextContent("Test Dialog")
        expect(getByTestId("dialog-content")).toBeTruthy()
    })

    it("does not render when not visible", () => {
        const { queryByTestId } = render(
            <Dialog
                isVisible={false}
                onConfirm={jest.fn()}
                onCancel={jest.fn()}
                message="Hidden Dialog"
            >
                <Text>Hidden Content</Text>
            </Dialog>
        )

        expect(queryByTestId("dialog-container")).toBeNull()
    })

    it("calls onCancel when dismissing the dialog", () => {
        const mockOnCancel = jest.fn()
        const { getByTestId } = render(
            <Dialog
                isVisible={true}
                onConfirm={jest.fn()}
                onCancel={mockOnCancel}
                message="Test Dialog"
            >
                <Text>Test Content</Text>
            </Dialog>
        )

        fireEvent.press(getByTestId("dialog-cancel-button")) // ✅ Corrected (used onCancel)
        expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it("calls confirm callback when confirm button is pressed", () => {
        const mockOnConfirm = jest.fn()
        const { getByTestId } = render(
            <Dialog
                isVisible={true}
                onConfirm={mockOnConfirm}
                onCancel={jest.fn()}
                message="Confirm Action"
            >
                <Text>Confirm Content</Text>
            </Dialog>
        )

        fireEvent.press(getByTestId("dialog-confirm-button"))
        expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })

    it("calls cancel callback when cancel button is pressed", () => {
        const mockOnCancel = jest.fn()
        const { getByTestId } = render(
            <Dialog
                isVisible={true}
                onConfirm={jest.fn()}
                onCancel={mockOnCancel}
                message="Cancel Action"
            >
                <Text>Cancel Content</Text>
            </Dialog>
        )

        fireEvent.press(getByTestId("dialog-cancel-button"))
        expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
})
