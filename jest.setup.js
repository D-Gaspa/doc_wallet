import { jest } from "@jest/globals"
import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock"
import "react-native-gesture-handler/jestSetup"

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage)

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

jest.mock("expo-local-authentication", () => ({
    authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
    hasHardwareAsync: jest.fn().mockResolvedValue(true),
    isEnrolledAsync: jest.fn().mockResolvedValue(true),
}))

jest.mock("expo-modules-core", () => {
    const NativeModulesProxy = {
        ExponentFileSystem: {
            downloadAsync: jest.fn(() =>
                Promise.resolve({ uri: "file://download" })
            ),
            getInfoAsync: jest.fn(() =>
                Promise.resolve({ exists: true, uri: "file://test" })
            ),
            readAsStringAsync: jest.fn(() => Promise.resolve("test content")),
            writeAsStringAsync: jest.fn(() => Promise.resolve()),
            deleteAsync: jest.fn(() => Promise.resolve()),
            moveAsync: jest.fn(() => Promise.resolve()),
            copyAsync: jest.fn(() => Promise.resolve()),
            makeDirectoryAsync: jest.fn(() => Promise.resolve()),
            readDirectoryAsync: jest.fn(() =>
                Promise.resolve(["file1", "file2"])
            ),
            createDownloadResumable: jest.fn(() => ({
                downloadAsync: jest.fn(() =>
                    Promise.resolve({ uri: "file://download" })
                ),
                pauseAsync: jest.fn(() => Promise.resolve()),
                resumeAsync: jest.fn(() => Promise.resolve()),
                savableUrl: jest.fn(() => Promise.resolve("saveable-url")),
            })),
        },
    }

    return {
        NativeModulesProxy,
        EventEmitter: jest.fn().mockImplementation(() => ({
            addListener: jest.fn(),
            removeListeners: jest.fn(),
        })),
        Platform: { OS: "ios" },
    }
})

jest.mock("expo-file-system", () => {
    return {
        documentDirectory: "file:///document/",
        cacheDirectory: "file:///cache/",
        bundleDirectory: "file:///bundle/",
        downloadAsync: jest.fn(() =>
            Promise.resolve({ uri: "file://download" })
        ),
        getInfoAsync: jest.fn(() =>
            Promise.resolve({ exists: true, uri: "file://test", size: 100 })
        ),
        readAsStringAsync: jest.fn(() => Promise.resolve("test content")),
        writeAsStringAsync: jest.fn(() => Promise.resolve()),
        deleteAsync: jest.fn(() => Promise.resolve()),
        moveAsync: jest.fn(() => Promise.resolve()),
        copyAsync: jest.fn(() => Promise.resolve()),
        makeDirectoryAsync: jest.fn(() => Promise.resolve()),
        readDirectoryAsync: jest.fn(() => Promise.resolve(["file1", "file2"])),
        createDownloadResumable: jest.fn(() => ({
            downloadAsync: jest.fn(() =>
                Promise.resolve({ uri: "file://download" })
            ),
            pauseAsync: jest.fn(() => Promise.resolve()),
            resumeAsync: jest.fn(() => Promise.resolve()),
            savableUrl: jest.fn(() => Promise.resolve("saveable-url")),
        })),
        EncodingType: {
            UTF8: "utf8",
            Base64: "base64",
        },
    }
})

jest.mock("react-native-quick-crypto", () => ({
    randomBytes: jest.fn(() => new Uint8Array(32).fill(1)),
}))

jest.mock("buffer", () => ({
    Buffer: {
        from: jest.fn(() => ({
            toString: jest.fn(() => "mocked-base64-string"),
        })),
    },
}))

jest.mock("react-native-keychain", () => ({
    setGenericPassword: jest.fn(() => Promise.resolve(true)),
    getGenericPassword: jest.fn(() =>
        Promise.resolve({ username: "user", password: "pass" })
    ),
    resetGenericPassword: jest.fn(() => Promise.resolve(true)),
    ACCESSIBLE: {
        WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
    },
}))

jest.mock("@react-native-documents/picker", () => ({
    errorCodes: {
        OPERATION_CANCELED: "CANCELED",
        DOCUMENT_NOT_FOUND: "NOT_FOUND",
        UNABLE_TO_OPEN_FILE_TYPE: "UNABLE_TO_OPEN_FILE_TYPE",
        IN_PROGRESS: "IN_PROGRESS",
    },
    types: {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        images: ["image/jpeg", "image/png"],
    },
    pick: jest.fn(() =>
        Promise.resolve([
            {
                uri: "file:///document.pdf",
                name: "document.pdf",
                size: 12345,
                type: "application/pdf",
                hasRequestedType: true,
                isVirtual: false,
            },
        ])
    ),
    pickDirectory: jest.fn(() =>
        Promise.resolve({
            uri: "file:///selected/directory",
            name: "directory",
        })
    ),
    keepLocalCopy: jest.fn(() =>
        Promise.resolve([
            {
                status: "success",
                localUri: "file:///cache/document.pdf",
            },
        ])
    ),
    isErrorWithCode: (error) =>
        error !== null && typeof error === "object" && "code" in error,
    viewDocument: jest.fn(() => Promise.resolve()),
}))

jest.mock("@react-native-documents/viewer", () => ({
    viewDocument: jest.fn(() => Promise.resolve()),
    errorCodes: {
        OPERATION_CANCELED: "CANCELED",
        UNABLE_TO_OPEN_FILE_TYPE: "UNABLE_TO_OPEN_FILE_TYPE",
        IN_PROGRESS: "IN_PROGRESS",
        DOCUMENT_NOT_FOUND: "NOT_FOUND",
    },
    isErrorWithCode: (error) =>
        error !== null && typeof error === "object" && "code" in error,
}))
