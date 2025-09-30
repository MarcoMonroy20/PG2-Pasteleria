#!/usr/bin/env node

// Script para configurar variables de entorno de Firebase
// Ejecutar con: node setup-firebase-env.js

const fs = require('fs');
const path = require('path');

console.log('🔥 Configurador de Firebase para Pastelería Cocina App');
console.log('=====================================================\n');

// Verificar si existe .env.local
const envLocalPath = path.join(__dirname, '.env.local');
const envExamplePath = path.join(__dirname, 'env.example');

if (fs.existsSync(envLocalPath)) {
  console.log('✅ Archivo .env.local ya existe');
  console.log('📝 Contenido actual:');
  console.log(fs.readFileSync(envLocalPath, 'utf8'));
  console.log('\n⚠️  Si quieres actualizar las credenciales, edita manualmente el archivo .env.local');
} else {
  console.log('❌ Archivo .env.local no encontrado');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Copiando desde env.example...');
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envLocalPath, exampleContent);
    console.log('✅ Archivo .env.local creado desde env.example');
    console.log('\n📝 PASOS SIGUIENTES:');
    console.log('1. Editar .env.local con tus credenciales reales de Firebase');
    console.log('2. Obtener credenciales desde: https://console.firebase.google.com/');
    console.log('3. Reiniciar la aplicación');
  } else {
    console.log('❌ Archivo env.example no encontrado');
    console.log('📝 Creando .env.local básico...');
    
    const basicEnvContent = `# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
EXPO_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
EXPO_PUBLIC_FIREBASE_ENABLED=true
`;
    
    fs.writeFileSync(envLocalPath, basicEnvContent);
    console.log('✅ Archivo .env.local básico creado');
  }
}

console.log('\n🔗 Enlaces útiles:');
console.log('- Firebase Console: https://console.firebase.google.com/');
console.log('- Documentación Expo: https://docs.expo.dev/guides/environment-variables/');
console.log('- Guía de seguridad: ./SECURITY_GUIDE.md');

console.log('\n📋 Para obtener credenciales:');
console.log('1. Ve a Firebase Console');
console.log('2. Selecciona tu proyecto o crea uno nuevo');
console.log('3. Ve a Project Settings > General > Your apps');
console.log('4. Crea una nueva app web o selecciona existente');
console.log('5. Copia la configuración al archivo .env.local');

console.log('\n✨ ¡Configuración completada!');
