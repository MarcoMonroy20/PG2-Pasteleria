#!/usr/bin/env node

// Script para agregar la variable faltante EXPO_PUBLIC_FIREBASE_ENABLED
const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigiendo configuración de Firebase...');

const envLocalPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envLocalPath)) {
  let content = fs.readFileSync(envLocalPath, 'utf8');
  
  // Verificar si ya existe la variable
  if (content.includes('EXPO_PUBLIC_FIREBASE_ENABLED')) {
    console.log('✅ EXPO_PUBLIC_FIREBASE_ENABLED ya está configurado');
  } else {
    // Agregar la variable faltante
    content += '\n# Habilitar Firebase (requerido para que funcione la sincronización)\n';
    content += 'EXPO_PUBLIC_FIREBASE_ENABLED=true\n';
    
    fs.writeFileSync(envLocalPath, content);
    console.log('✅ EXPO_PUBLIC_FIREBASE_ENABLED=true agregado al archivo .env.local');
  }
  
  console.log('\n📋 Configuración actual:');
  console.log(fs.readFileSync(envLocalPath, 'utf8'));
  
} else {
  console.log('❌ Archivo .env.local no encontrado');
}

console.log('\n🔄 Reinicia la aplicación para que los cambios surtan efecto');
