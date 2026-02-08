import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b8f1da9a62004f068322202080d937ad',
  appName: 'HealthAI',
  webDir: 'dist',
  server: {
    url: 'https://b8f1da9a-6200-4f06-8322-202080d937ad.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#14B8A6',
      sound: 'alarm_default.wav',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0F172A',
      showSpinner: true,
      spinnerColor: '#14B8A6',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F172A',
    },
  },
};

export default config;
