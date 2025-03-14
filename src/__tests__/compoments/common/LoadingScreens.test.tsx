import React from "react"
import { render } from "@testing-library/react-native"
import LoadingScreens from "../../../components/common/LoadingScreens.tsx"
import { useTheme } from "../../../hooks/useTheme.ts"

// Mock useTheme to provide a testable theme
jest.mock("../../../hooks/useTheme.ts", () => ({
    useTheme: jest.fn(() => ({
        colors: {
            background: "black",
        },
    })),
}))

describe("LoadingScreens", () => {
    it("renders the full-screen loading indicator", () => {
        const { getByTestId } = render(<LoadingScreens />)

        // Ensure correct testID is used
        expect(getByTestId("loading-screens")).toBeTruthy()
        expect(getByTestId("loading-indicator")).toBeTruthy()
        expect(getByTestId("activity-indicator")).toBeTruthy()
        expect(getByTestId("loading-spinner")).toBeTruthy()
    })

    it("applies the correct background color from the theme", () => {
        const { colors } = useTheme()
        const { getByTestId } = render(<LoadingScreens />)
        const backgroundView = getByTestId("loading-screens")

        // Ensure correct background color is applied
        expect(backgroundView.props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ backgroundColor: colors.background }),
            ])
        )
    })
})
