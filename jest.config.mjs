export default {
    preset: "react-native",
    transform: {
        "^.+\\.[tj]sx?$": "babel-jest",
    },
    transformIgnorePatterns: [
        "node_modules/(?!(expo|expo-modules-core|expo-local-authentication|react-native|@react-native|@react-navigation|react-native-app-auth|react-native-keychain|react-native-base64|react-native-config)/)",
    ],
    setupFiles: ["./jest.setup.js"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
        "^@/components/(.*)$": "<rootDir>/src/components/$1",
        "^react-native-svg$": "react-native-svg-mock",
        "\\.(svg)$": "<rootDir>/src/__mocks__/svgMock.js",
    },
}
