# Tauri Mobile-Desktop OCR System

This project consists of two Tauri applications:
1. **Android App (OCR Scanner)**: Scans text using camera and sends it to the desktop.
2. **Desktop App (Phrase Receiver)**: Receives text and allows copying to clipboard.

## Prerequisites
- Rust & Cargo
- Node.js & npm
- Android Studio & SDK (for Android app)

## 1. Desktop App (Phrase Receiver)
This app runs a local HTTP server to receive phrases.

### Setup & Run
```bash
cd desktop-phrase-receiver
npm install
npm run tauri dev
```

### Build
```bash
npm run tauri build
```

## 2. Android App (OCR Scanner)
This app uses the camera and Tesseract.js to detect text.

### Setup
```bash
cd android-ocr-scanner
npm install
```

### Initialize Android
You must initialize the Android project and set up the environment:
```bash
npm run tauri android init
```
Follow the prompts to install necessary Android tools.

### Important: Permissions
After initialization, modify `src-tauri/gen/android/app/src/main/AndroidManifest.xml` to include:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
```

### Run on Device
```bash
npm run tauri android dev
```

## Usage
1. Start the **Desktop App**. Note the IP address displayed (e.g., `192.168.1.5`).
2. Start the **Android App**.
3. If not connected, tap the red status dot or wait for the prompt.
4. Enter the Desktop IP address.
5. Point camera at text. Green boxes will appear.
6. Tap a green box to send text to the Desktop.
