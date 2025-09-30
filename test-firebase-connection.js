#!/usr/bin/env node

// Script para probar la conexión directa a Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

// Configuración de Firebase (usando las credenciales del .env.local)
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "pasteleria-cocina-app.firebaseapp.com",
  projectId: "pasteleria-cocina-app",
  storageBucket: "pasteleria-cocina-app.firebasestorage.app",
  messagingSenderId: "975279453152",
  appId: "1:975279453152:web:08c52d6d8e6ef7e8bbb185"
};

console.log('🔥 Probando conexión directa a Firebase...');
console.log('📋 Configuración:');
console.log('  Project ID:', firebaseConfig.projectId);
console.log('  Auth Domain:', firebaseConfig.authDomain);
console.log('  API Key:', firebaseConfig.apiKey.substring(0, 10) + '...');

async function testFirebaseConnection() {
  try {
    console.log('\n🔄 Inicializando Firebase...');
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app inicializada');

    console.log('\n🔄 Inicializando Firestore...');
    const db = getFirestore(app);
    console.log('✅ Firestore inicializada');

    console.log('\n🔄 Inicializando Auth...');
    const auth = getAuth(app);
    console.log('✅ Auth inicializada');

    console.log('\n🔄 Probando autenticación anónima...');
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Autenticación anónima exitosa');
    console.log('  User ID:', userCredential.user.uid);

    console.log('\n🎉 ¡CONEXIÓN A FIREBASE EXITOSA!');
    console.log('\n📋 Estado de la configuración:');
    console.log('  ✅ Proyecto: pasteleria-cocina-app');
    console.log('  ✅ Firestore: Conectado');
    console.log('  ✅ Authentication: Funcionando');
    console.log('  ✅ User ID generado:', userCredential.user.uid);

    console.log('\n🔗 Enlaces útiles:');
    console.log('  Firebase Console: https://console.firebase.google.com/project/pasteleria-cocina-app');
    console.log('  Firestore: https://console.firebase.google.com/project/pasteleria-cocina-app/firestore');

  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN:');
    console.error('  Código:', error.code);
    console.error('  Mensaje:', error.message);
    
    if (error.code === 'auth/api-key-not-valid') {
      console.error('\n🔧 SOLUCIÓN: La API Key no es válida');
      console.error('  1. Verificar en Firebase Console > Project Settings');
      console.error('  2. Regenerar la API Key si es necesario');
    } else if (error.code === 'auth/project-not-found') {
      console.error('\n🔧 SOLUCIÓN: El proyecto no existe');
      console.error('  1. Verificar que el Project ID sea correcto');
      console.error('  2. Crear el proyecto en Firebase Console');
    } else if (error.code === 'auth/invalid-api-key') {
      console.error('\n🔧 SOLUCIÓN: API Key inválida');
      console.error('  1. Verificar la API Key en Firebase Console');
      console.error('  2. Asegurarse de que la app web esté registrada');
    }
    
    console.error('\n📞 SOPORTE:');
    console.error('  - Firebase Console: https://console.firebase.google.com/');
    console.error('  - Documentación: https://firebase.google.com/docs');
  }
}

testFirebaseConnection();
