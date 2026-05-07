# MediQuick — Android APK Build Guide

## Zaruri Software (Pehle Install Karo)
- **Node.js** v18+ → https://nodejs.org
- **Android Studio** → https://developer.android.com/studio
- **JDK 17** → Android Studio ke saath automatically aata hai
- **pnpm** → `npm install -g pnpm`

---

## Step 1: Project Download Karo (Replit se)

Replit mein upar 3 dots → **Download as ZIP** → apne computer par extract karo.

---

## Step 2: Dependencies Install Karo

```bash
cd mediquick-app-folder
pnpm install
```

---

## Step 3: Capacitor Install Karo

```bash
pnpm add @capacitor/core @capacitor/cli
pnpm add @capacitor/android
pnpm add @capacitor/geolocation @capacitor/camera
pnpm add @capacitor/local-notifications @capacitor/splash-screen @capacitor/status-bar
```

---

## Step 4: Web App Build Karo

```bash
# Pehle .env file banao (ya environment variables set karo):
# BASE_PATH=/
# PORT=3000

BASE_PATH=/ PORT=3000 pnpm run build
```

Yeh `dist/public/` folder banayega.

---

## Step 5: Android Project Initialize Karo

```bash
npx cap init "MediQuick" "com.mediquick.app" --web-dir dist/public
npx cap add android
```

---

## Step 6: Android Permissions Add Karo

File kholo: `android/app/src/main/AndroidManifest.xml`

`<manifest>` tag ke andar, `<application>` se **pehle** yeh paste karo:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.microphone" android:required="false" />
```

---

## Step 7: Android Studio Mein Kholo

```bash
npx cap open android
```

Android Studio automatically khulega.

---

## Step 8: APK Build Karo (Android Studio mein)

1. **Build** menu → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait karo (2-5 minutes)
3. Notification aayegi: **"APK(s) generated successfully"**
4. **locate** click karo

APK yahan milegi:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Step 9: Phone Par Install Karo

### Option A — USB se:
1. Phone mein **Developer Options** on karo (Settings → About → Build Number 7 baar tap)
2. **USB Debugging** on karo
3. Phone connect karo
4. Android Studio mein **Run** button dabao

### Option B — Direct APK transfer:
1. `app-debug.apk` file WhatsApp/Google Drive se phone par bhejo
2. Phone mein open karo → **Install** (Unknown sources allow karna hoga)

---

## Production APK (Play Store ke liye)

```bash
# Signed release APK:
# Build → Generate Signed Bundle/APK → APK → New Keystore banao → Release
```

---

## Backend URL Update Karna (Important!)

Jab app deploy ho jaye, `capacitor.config.ts` mein server URL update karo:

```typescript
server: {
  androidScheme: "https",
  url: "https://aapka-replit-app.replit.app",  // Apna deployed URL daalo
}
```

Phir dobara:
```bash
BASE_PATH=/ PORT=3000 pnpm run build
npx cap sync android
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `JAVA_HOME not set` | Android Studio → SDK Manager → JDK path copy karo |
| `SDK not found` | Android Studio → SDK Manager → Android 14 install karo |
| `Permission denied` | `chmod +x android/gradlew` |
| White screen | `capacitor.config.ts` mein `webDir: "dist/public"` check karo |
| API calls fail | Server URL `capacitor.config.ts` mein set karo |
