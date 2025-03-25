/**
 * @format
 */

import React from "react"
import ReactTestRenderer from "react-test-renderer"

// Mock all navigation libraries
jest.mock("@react-navigation/native", () => ({
    NavigationContainer: "NavigationContainer",
    useNavigation: () => ({
        navigate: jest.fn(),
        goBack: jest.fn(),
    }),
}))

jest.mock("@react-navigation/stack", () => ({
    createStackNavigator: () => ({
        Navigator: "StackNavigator",
        Screen: "StackScreen",
    }),
}))

jest.mock("@react-navigation/bottom-tabs", () => ({
    createBottomTabNavigator: () => ({
        Navigator: "TabNavigator",
        Screen: "TabScreen",
    }),
}))

// Mock your app components
jest.mock(
    "../components/ui/screens/folders/FolderMainView.tsx",
    () => "FolderMainView",
)
jest.mock("../components/ui/layout/tab_bar/TabBar.tsx", () => "TabBar")

// Import App after all mocks are set up
import App from "../App"

// First test if App is defined
test("App is defined", () => {
    expect(App).toBeDefined()
})

// Then test rendering if the first test passes
test("renders correctly", async () => {
    await ReactTestRenderer.act(() => {
        ReactTestRenderer.create(<App />)
    })
})
