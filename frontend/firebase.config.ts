// Firebase configuration file
// Configured for production use with environment variables

// Flag to enable/disable Firebase functionality
export const FIREBASE_ENABLED = !!(
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
);

export const firebaseConfig = {
  // Firebase project configuration using environment variables
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:demo"
};

// VAPID Key for push notifications (from environment)
export const vapidKey = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY || "demo-vapid-key";

// Instructions for push notifications setup:
// 1. Enable Firebase Cloud Messaging in Firebase Console
//    - Go to Firebase Console > Project Settings > Cloud Messaging
//    - Enable Cloud Messaging API
//
// 2. Generate VAPID key in Cloud Messaging settings
//    - In Cloud Messaging > Web Configuration
//    - Generate key pair
//    - Copy the public key
//
// 3. Add the VAPID key above
//    - Replace "your-vapid-key-here" with your actual VAPID public key
//
// 4. For production, use environment variable:
//    - EXPO_PUBLIC_FIREBASE_VAPID_KEY=your_actual_vapid_key
//
// 5. For server-side push notifications:
//    - Use Firebase Functions or your backend server
//    - Send to FCM endpoint: https://fcm.googleapis.com/fcm/send
//    - Include the device token obtained from getPushToken()

// Instructions for setup:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing one
// 3. In Project Settings > General > Your apps, create a web app
// 4. Copy the config values above
// 5. For production, use environment variables instead:
//    - EXPO_PUBLIC_FIREBASE_API_KEY
//    - EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
//    - EXPO_PUBLIC_FIREBASE_PROJECT_ID
//    - EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
//    - EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
//    - EXPO_PUBLIC_FIREBASE_APP_ID

export default firebaseConfig;
