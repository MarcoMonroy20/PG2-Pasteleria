// Firebase configuration file - SECURE VERSION
// All credentials must come from environment variables
// NO HARDCODED CREDENTIALS FOR SECURITY

// Flag to enable/disable Firebase functionality
export const FIREBASE_ENABLED = process.env.EXPO_PUBLIC_FIREBASE_ENABLED === 'true' || true; // Temporal: habilitar siempre

// Validate required environment variables
const requiredEnvVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
];

// Check if all required environment variables are present
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('🚨 SECURITY ERROR: Missing required Firebase environment variables:');
  missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
  console.error('\n📋 SOLUTION:');
  console.error('1. Copy env.example to .env.local');
  console.error('2. Fill in your actual Firebase credentials');
  console.error('3. Restart the application');
  console.error('\n⚠️  Firebase will be DISABLED until credentials are properly configured.');
}

// Firebase configuration - FROM environment variables OR fallback credentials
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCnRuMLopAdNhyaXlIR75d1aj2nWBmizvI',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'pasteleria-cocina-app.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'pasteleria-cocina-app',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'pasteleria-cocina-app.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '975279453152',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:975279453152:web:08c52d6d8e6ef7e8bbb185',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-1C6CEN1P51'
};

// VAPID Key for push notifications (from environment or fallback)
export const vapidKey = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY || 'tBMdSxkO_WY4s_wAZKbvvibbCtsEUHNRmaF0X3hz1rE';

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
