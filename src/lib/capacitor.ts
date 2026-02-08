import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running as a native Capacitor app
 */
export const isNative = () => Capacitor.isNativePlatform();

/**
 * Get the current platform: 'ios', 'android', or 'web'
 */
export const getPlatform = () => Capacitor.getPlatform();

/**
 * Check if a specific plugin is available on the current platform
 */
export const isPluginAvailable = (pluginName: string) => {
  return Capacitor.isPluginAvailable(pluginName);
};
