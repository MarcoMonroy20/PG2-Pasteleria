// Script de diagnóstico de Firebase
// Ejecutar con: node debug-firebase-connection.js

const { firebaseConfig, FIREBASE_ENABLED } = require('./firebase.config.ts');

console.log('🔍 DIAGNÓSTICO DE FIREBASE');
console.log('==========================');

console.log('\n📋 Configuración:');
console.log('FIREBASE_ENABLED:', FIREBASE_ENABLED);
console.log('API Key presente:', !!firebaseConfig.apiKey);
console.log('Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);

console.log('\n🔧 Variables de entorno requeridas:');
const requiredVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
];

let missingVars = [];
requiredVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? '✅ Presente' : '❌ Faltante'}`);
  if (!value) missingVars.push(varName);
});

if (missingVars.length > 0) {
  console.log('\n🚨 PROBLEMA IDENTIFICADO:');
  console.log('Variables de entorno faltantes:', missingVars.join(', '));
  console.log('\n📋 SOLUCIÓN:');
  console.log('1. Verificar que existe el archivo .env.local');
  console.log('2. Agregar las variables faltantes al archivo .env.local');
  console.log('3. Reiniciar la aplicación');
} else {
  console.log('\n✅ Todas las variables de entorno están presentes');
}

console.log('\n🔗 Verificación de conectividad:');
console.log('Firebase Console:', `https://console.firebase.google.com/project/${firebaseConfig.projectId}`);
console.log('Firestore Database:', `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`);
