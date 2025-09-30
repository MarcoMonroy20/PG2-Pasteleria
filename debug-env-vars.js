#!/usr/bin/env node

// Script para verificar variables de entorno en la aplicación
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando variables de entorno...');

// Simular el proceso de carga de variables de entorno como lo hace Expo
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Archivo ${filePath} no existe`);
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const envVars = {};
  
  content.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

// Cargar variables de entorno
const envLocalPath = path.join(__dirname, '.env.local');
const envVars = loadEnvFile(envLocalPath);

console.log('\n📋 Variables cargadas desde .env.local:');
Object.entries(envVars).forEach(([key, value]) => {
  if (key.includes('FIREBASE')) {
    const displayValue = key.includes('KEY') || key.includes('SECRET') 
      ? value.substring(0, 10) + '...' 
      : value;
    console.log(`  ${key}: ${displayValue}`);
  }
});

// Verificar variables requeridas
const requiredVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_FIREBASE_ENABLED'
];

console.log('\n🔍 Verificación de variables requeridas:');
let allPresent = true;
requiredVars.forEach(varName => {
  const value = envVars[varName];
  const status = value ? '✅' : '❌';
  console.log(`  ${status} ${varName}: ${value || 'FALTANTE'}`);
  if (!value) allPresent = false;
});

if (allPresent) {
  console.log('\n✅ Todas las variables de entorno están presentes');
  console.log('\n🔧 POSIBLE PROBLEMA:');
  console.log('Las variables están en .env.local pero la app no las está leyendo.');
  console.log('Esto puede ser porque:');
  console.log('1. La app no se reinició después de agregar EXPO_PUBLIC_FIREBASE_ENABLED=true');
  console.log('2. Hay un problema con el cache de Metro/Expo');
  console.log('3. Las variables no se están cargando correctamente');
  
  console.log('\n📋 SOLUCIONES:');
  console.log('1. Reiniciar completamente la aplicación (cerrar y abrir)');
  console.log('2. Limpiar cache: npx expo start --clear');
  console.log('3. Verificar que no hay errores en consola de la app');
} else {
  console.log('\n❌ Faltan variables de entorno requeridas');
  console.log('Ejecuta: node fix-firebase-env.js');
}

console.log('\n🔗 Para verificar en la app:');
console.log('1. Abrir consola de la app');
console.log('2. Buscar logs que empiecen con 🔍, ✅, ❌');
console.log('3. Verificar que aparezcan las variables de entorno');
