// metro.config.js
// metro.config.js uses Common JS-style therefore eslint import suggestions is not supported
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDefaultConfig } = require("@react-native/metro-config")
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path")

module.exports = (async () => {
    const config = await getDefaultConfig(__dirname)
    config.projectRoot = path.resolve(__dirname)
    config.resolver.sourceExts = ["js", "jsx", "ts", "tsx", "json"]
    config.resolver.useWatchman = false
    config.reporter = {
        update: () => {},
    }

    return config
})()
