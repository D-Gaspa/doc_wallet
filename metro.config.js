// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDefaultConfig } = require("expo/metro-config")
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { mergeConfig } = require("@react-native/metro-config")

const config = {}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
