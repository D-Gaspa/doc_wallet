// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDefaultConfig } = require("expo/metro-config")
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { mergeConfig } = require("@react-native/metro-config")

const defaultConfig = getDefaultConfig(__dirname)

const config = {
    transformer: {
        ...defaultConfig.transformer,
        babelTransformerPath: require.resolve("react-native-svg-transformer"),
    },
    resolver: {
        ...defaultConfig.resolver,
        assetExts: defaultConfig.resolver.assetExts.filter(
            (ext) => ext !== "svg"
        ),
        sourceExts: [...defaultConfig.resolver.sourceExts, "svg"],
    },
}

module.exports = mergeConfig(defaultConfig, config)
