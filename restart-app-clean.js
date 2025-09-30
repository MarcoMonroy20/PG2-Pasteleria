#!/usr/bin/env node

// Script para reiniciar la aplicación con cache limpio
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Reiniciando aplicación con cache limpio...');

try {
  // Limpiar cache de Metro
  console.log('🧹 Limpiando cache de Metro...');
  try {
    execSync('npx expo start --clear', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ No se pudo limpiar cache automáticamente');
    console.log('📋 Ejecuta manualmente: npx expo start --clear');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('\n📋 PASOS MANUALES:');
console.log('1. Detener la aplicación actual (Ctrl+C)');
console.log('2. Ejecutar: npx expo start --clear');
console.log('3. Reiniciar la app en el dispositivo');
console.log('4. Ir a Configuración > Diagnóstico de Firebase');
console.log('5. Verificar que "Conectado" muestre "Sí"');

console.log('\n🔍 LOGS A BUSCAR EN LA CONSOLA:');
console.log('✅ "🔍 Initializing Firebase with secure configuration..."');
console.log('✅ "✅ Firebase initialized successfully"');
console.log('✅ "✅ Hybrid Database initialized successfully"');

console.log('\n❌ SI SIGUE MOSTRANDO "Conectado: No":');
console.log('1. Verificar que no hay errores en consola');
console.log('2. Verificar que EXPO_PUBLIC_FIREBASE_ENABLED=true está en .env.local');
console.log('3. Reiniciar completamente el dispositivo');
console.log('4. Probar en otro dispositivo');
