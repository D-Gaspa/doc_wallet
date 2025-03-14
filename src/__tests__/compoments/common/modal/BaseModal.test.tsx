import React from "react"
import { render, fireEvent } from "@testing-library/react-native"
import BaseModal from "../../../../components/common/modal/BaseModal.tsx"
import { Text } from "react-native"

// Mock useTheme hook
jest.mock("../../../../hooks/useTheme.ts", () => ({
    useTheme: jest.fn(() => ({
        colors: {
            background: "white",
            overlay: "rgba(0,0,0,0.5)",
        },
    })),
}))

describe("BaseModal", () => {
    it("renders the modal when visible", () => {
        const { getByTestId, queryAllByTestId } = render(
            <BaseModal isVisible={true} onClose={jest.fn()}>
                <Text testID="modal-content">Modal Content</Text>
            </BaseModal>
        )

        expect(getByTestId("base-modal")).toBeTruthy() // Modal should be rendered
        expect(queryAllByTestId("modal-content").length).toBeGreaterThan(0)
    })

    it("does not render when not visible", () => {
        const { queryByTestId } = render(
            <BaseModal isVisible={false} onClose={jest.fn()}>
                <Text>Hidden Modal</Text>
            </BaseModal>
        )

        expect(queryByTestId("base-modal")).toBeNull() // Modal should NOT be rendered
    })

    it("calls onClose when tapping outside", () => {
        const mockOnClose = jest.fn()
        const { getByTestId } = render(
            <BaseModal
                isVisible={true}
                onClose={mockOnClose}
                dismissOnBackdropPress={true}
            >
                <Text>Test Modal</Text>
            </BaseModal>
        )

        fireEvent.press(getByTestId("modal-backdrop")) // Targets backdrop
        expect(mockOnClose).toHaveBeenCalledTimes(1) // onClose should be called
    })

    it("does not call onClose when dismissOnBackdropPress is false", () => {
        const mockOnClose = jest.fn()
        const { getByTestId } = render(
            <BaseModal
                isVisible={true}
                onClose={mockOnClose}
                dismissOnBackdropPress={false}
            >
                <Text>Test Modal</Text>
            </BaseModal>
        )

        fireEvent.press(getByTestId("modal-backdrop"))
        expect(mockOnClose).not.toHaveBeenCalled() // Should NOT close modal
    })
})
