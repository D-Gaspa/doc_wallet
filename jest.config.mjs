export default {
    transform: {
        "^.+\\.[tj]sx?$": "babel-jest",
    },
    transformIgnorePatterns: [
        "node_modules/(?!(react-native|@react-native|react-native-app-auth|react-native-base64|react-native-config)/)",
    ],
    preset: "react-native",
    setupFiles: ["./jest.setup.js"],
}
