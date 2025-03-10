import React from "react"
import { render } from "@testing-library/react-native"
import LoadingScreens from "../../components/common/LoadingScreens"
import { useTheme } from "../../hooks/useTheme"

// Mock useTheme to provide a testable theme
jest.mock("../../hooks/useTheme", () => ({
    useTheme: jest.fn(() => ({
        colors: {
            background: "black", // Ensure this matches what the component expects
        },
    })),
}))

describe("LoadingScreens", () => {
    it("renders the full-screen loading indicator", () => {
        const { getByTestId } = render(<LoadingScreens />)

        expect(getByTestId("loading-screens")).toBeTruthy()
        expect(getByTestId("loading-indicator")).toBeTruthy()
        expect(getByTestId("activity-indicator")).toBeTruthy()
        expect(getByTestId("loading-spinner")).toBeTruthy()
    })

    it("applies the correct background color from the theme", () => {
        const { getByTestId } = render(<LoadingScreens />)
        const backgroundView = getByTestId("loading-screens")

        const { colors } = useTheme() // Get the mocked theme colors
        expect(backgroundView.props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ backgroundColor: colors.background }),
            ])
        )
    })
})
