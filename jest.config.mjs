export default {
    preset: "react-native",
    transform: {
        "^.+\\.[tj]sx?$": "babel-jest",
    },
    transformIgnorePatterns: [
        "node_modules/(?!(@expo|expo|expo-modules-core|expo-local-authentication|expo-notifications|expo-file-system|expo-asset|react-native|@react-native|@react-navigation|react-native-app-auth|react-native-keychain|react-native-base64|expo-permissions|react-native-reanimated|react-native-config)/)",
    ],
    setupFiles: ["./jest.setup.js"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
        "^@/components/(.*)$": "<rootDir>/src/components/$1",
        "^react-native-svg$": "react-native-svg-mock",
        "\\.(svg)$": "<rootDir>/src/__mocks__/svgMock.js",
    },
}
