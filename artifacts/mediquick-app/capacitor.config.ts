import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mediquick.app",
  appName: "MediQuick",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
    // Production mein apna deployed URL daalo:
    // url: "https://your-app.replit.app",
    // cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    },
  },
  plugins: {
    // Geolocation permission
    Geolocation: {
      permissions: ["location"],
    },
    // Push Notifications
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    // Local Notifications (medicine reminders)
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#d95f2b",
      sound: "beep.wav",
    },
    // Camera (video consultation)
    Camera: {
      permissions: ["camera", "microphone"],
    },
    // SplashScreen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    // Status bar
    StatusBar: {
      style: "Light",
      backgroundColor: "#ffffff",
    },
  },
};

export default config;
