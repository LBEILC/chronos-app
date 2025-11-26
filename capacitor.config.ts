import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lubeiluchen.chronos',
  appName: 'Chronos',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    scrollEnabled: false
  }
};

export default config;
