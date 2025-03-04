import { jest } from "@jest/globals"
import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock"
import "react-native-gesture-handler/jestSetup"

// Mocking the async storage
jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage)

// Mocking the react-native-keychain
jest.mock("react-native-keychain", () => ({
    setGenericPassword: jest.fn().mockResolvedValue(true),
    getGenericPassword: jest.fn().mockResolvedValue({
        username: "test",
        password: "test-content",
    }),
    resetGenericPassword: jest.fn().mockResolvedValue(true),
    ACCESSIBLE: {
        WHEN_UNLOCKED_THIS_DEVICE_ONLY: "MockWhenUnlockedThisDeviceOnly",
    },
    ACCESS_CONTROL: {
        BIOMETRY_ANY_OR_DEVICE_PASSCODE: "MockBiometryAnyOrDevicePasscode",
    },
}))

// Mocking the expo-local-authentication
jest.mock("expo-local-authentication", () => ({
    authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
    hasHardwareAsync: jest.fn().mockResolvedValue(true),
    isEnrolledAsync: jest.fn().mockResolvedValue(true),
}))
