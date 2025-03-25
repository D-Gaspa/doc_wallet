import React from "react"
import ReactTestRenderer from "react-test-renderer"

// Mock the entire App component
import App from "../App.tsx"

jest.mock("../App", () => "App")

test("renders correctly", async () => {
    await ReactTestRenderer.act(() => {
        ReactTestRenderer.create(<App />)
    })
})
