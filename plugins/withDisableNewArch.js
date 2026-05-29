/**
 * Custom Expo config plugin that forcefully sets newArchEnabled=false
 * in android/gradle.properties. expo-build-properties doesn't reliably
 * override this property in SDK 56, so we patch it directly.
 */
const { withGradleProperties } = require('@expo/config-plugins')

module.exports = function withDisableNewArch(config) {
  return withGradleProperties(config, (config) => {
    // Remove any existing newArchEnabled entries
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'newArchEnabled')
    )
    // Add it back as false
    config.modResults.push({
      type: 'property',
      key: 'newArchEnabled',
      value: 'false',
    })
    return config
  })
}
