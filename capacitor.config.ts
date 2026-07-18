import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trait.app',
  appName: 'TRAIT',
  webDir: 'out',
  server: {
    url: 'https://trait-rho.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    hostname: 'trait-rho.vercel.app',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#0D5C63',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      iosInfoAddAppTransportSecurity: true,
      iosUsesCameraUsageDescription: "TRAIT a besoin d'accéder à la caméra pour scanner les QR codes, prendre des photos de profil et vérifier vos documents KYC.",
      androidUsesCameraUsageDescription: "TRAIT a besoin d'accéder à la caméra pour scanner les QR codes, prendre des photos de profil et vérifier vos documents KYC.",
    },
  },
};

export default config;
