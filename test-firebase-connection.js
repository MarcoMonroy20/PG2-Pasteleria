#!/usr/bin/env node

/**
 * Test Firebase Connection
 * Verifica que Firebase esté configurado correctamente
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log('🔥 Testing Firebase Connection...');
console.log('================================');

// Verificar configuración
console.log('📋 Configuration:');
console.log('  API Key:', firebaseConfig.apiKey ? '✅ Set' : '❌ Missing');
console.log('  Auth Domain:', firebaseConfig.authDomain || '❌ Missing');
console.log('  Project ID:', firebaseConfig.projectId || '❌ Missing');
console.log('  Storage Bucket:', firebaseConfig.storageBucket || '❌ Missing');
console.log('  App ID:', firebaseConfig.appId || '❌ Missing');

if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase configuration incomplete!');
  process.exit(1);
}

async function testFirebase() {
  try {
    // Inicializar Firebase
    console.log('\n🚀 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    console.log('✅ Firebase initialized successfully');

    // Probar autenticación anónima
    console.log('\n🔐 Testing anonymous authentication...');
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Anonymous authentication successful');
    console.log('  User ID:', userCredential.user.uid);

    // Probar acceso a Firestore
    console.log('\n📊 Testing Firestore access...');
    const testCollection = collection(db, 'test');
    
    try {
      const snapshot = await getDocs(testCollection);
      console.log('✅ Firestore access successful');
      console.log('  Documents found:', snapshot.size);
    } catch (firestoreError) {
      console.error('❌ Firestore access failed:', firestoreError.message);
      
      if (firestoreError.code === 'permission-denied') {
        console.log('\n🔧 SOLUTION:');
        console.log('1. Go to Firebase Console > Firestore Database');
        console.log('2. Go to Rules tab');
        console.log('3. Make sure rules allow anonymous access:');
        console.log('   match /{document=**} { allow read, write: if true; }');
        console.log('4. Click "Publish"');
      }
    }

    console.log('\n🎉 Firebase test completed successfully!');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    
    if (error.code === 'auth/operation-not-allowed') {
      console.log('\n🔧 SOLUTION:');
      console.log('1. Go to Firebase Console > Authentication');
      console.log('2. Go to Sign-in method tab');
      console.log('3. Enable "Anonymous" sign-in provider');
      console.log('4. Click "Save"');
    }
  }
}

testFirebase().catch(console.error);