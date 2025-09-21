// Firebase configuration file
// Add your Firebase project configuration here

// Flag to enable/disable Firebase functionality
export const FIREBASE_ENABLED = false; // Set to true when Firebase is properly configured

export const firebaseConfig = {
  // Replace these with your actual Firebase project config
  // You can find these values in your Firebase Console > Project Settings > General > Your apps
  apiKey: FIREBASE_ENABLED ? "your-actual-api-key" : "disabled",
  authDomain: FIREBASE_ENABLED ? "your-project.firebaseapp.com" : "disabled.firebaseapp.com",
  projectId: FIREBASE_ENABLED ? "your-project-id" : "disabled-project",
  storageBucket: FIREBASE_ENABLED ? "your-project.appspot.com" : "disabled-project.appspot.com",
  messagingSenderId: FIREBASE_ENABLED ? "123456789" : "123456789",
  appId: FIREBASE_ENABLED ? "your-app-id" : "disabled-app-id"
};

// VAPID Key for push notifications (generate in Firebase Console)
// Go to: Firebase Console > Project Settings > Cloud Messaging > Web Configuration
export const vapidKey = "your-vapid-key-here";

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
