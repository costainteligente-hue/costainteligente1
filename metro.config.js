const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Stub native-only and optional modules on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const stubModules = [
      'react-native-maps',
      'react-native-webview',
      '@opentelemetry/api',
    ];
    if (stubModules.includes(moduleName)) {
      return { type: 'empty' };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
