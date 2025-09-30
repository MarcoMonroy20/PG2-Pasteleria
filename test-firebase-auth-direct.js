#!/usr/bin/env node

// Script para probar autenticación Firebase directamente
const fs = require('fs');
const path = require('path');

console.log('🔐 Probando autenticación Firebase directamente...');

// Simular carga de variables de entorno
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

const envLocalPath = path.join(__dirname, '.env.local');
const envVars = loadEnvFile(envLocalPath);

// Verificar variables críticas
const apiKey = envVars['EXPO_PUBLIC_FIREBASE_API_KEY'];
const authDomain = envVars['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'];
const projectId = envVars['EXPO_PUBLIC_FIREBASE_PROJECT_ID'];

console.log('📋 Variables críticas:');
console.log(`  API Key: ${apiKey ? 'Presente' : 'Faltante'}`);
console.log(`  Auth Domain: ${authDomain || 'Faltante'}`);
console.log(`  Project ID: ${projectId || 'Faltante'}`);

if (!apiKey || !authDomain || !projectId) {
  console.log('❌ Faltan variables críticas de Firebase');
  process.exit(1);
}

// Crear configuración Firebase
const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: envVars['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: envVars['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
  appId: envVars['EXPO_PUBLIC_FIREBASE_APP_ID']
};

console.log('\n🔧 Probando autenticación anónima...');

// Probar autenticación anónima
const https = require('https');
const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;

const postData = JSON.stringify({
  returnSecureToken: true
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 15000
};

console.log('📡 Enviando solicitud de autenticación anónima...');

const req = https.request(url, options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.error) {
        console.log('❌ Error de autenticación:', response.error);
        if (response.error.message.includes('API_KEY_NOT_VALID')) {
          console.log('🔧 API Key inválida');
        } else if (response.error.message.includes('PROJECT_NOT_FOUND')) {
          console.log('🔧 Proyecto no encontrado');
        } else if (response.error.message.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
          console.log('🚫 Demasiados intentos - esperar un momento');
        }
      } else {
        console.log('✅ Autenticación anónima exitosa!');
        console.log(`📋 User ID: ${response.localId}`);
        console.log(`📋 Token: ${response.idToken.substring(0, 50)}...`);
        console.log(`📋 Refresh Token: ${response.refreshToken.substring(0, 50)}...`);
        console.log(`📋 Expires In: ${response.expiresIn} segundos`);
        
        console.log('\n🎯 DIAGNÓSTICO:');
        console.log('✅ Firebase está funcionando correctamente');
        console.log('✅ La autenticación anónima funciona');
        console.log('✅ Las credenciales son válidas');
        console.log('🔧 El problema está en la aplicación/navegador');
        
        console.log('\n💡 PRÓXIMOS PASOS:');
        console.log('1. Reiniciar la aplicación completamente');
        console.log('2. Usar el botón "Reinicializar Firebase" en el debugger');
        console.log('3. Verificar que no hay errores en consola de la app');
        console.log('4. Si persiste, probar en otro navegador/dispositivo');
      }
    } catch (error) {
      console.log('⚠️ Respuesta no es JSON válido:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
  
  if (error.code === 'ENOTFOUND') {
    console.log('🔧 Error DNS: No se puede resolver el dominio');
  } else if (error.code === 'ECONNREFUSED') {
    console.log('🔧 Conexión rechazada: Posible firewall');
  } else if (error.code === 'ETIMEDOUT') {
    console.log('🔧 Timeout: Conexión lenta o bloqueada');
  } else if (error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
    console.log('🚫 Bloqueado por cliente (adblocker/firewall)');
  }
});

req.on('timeout', () => {
  console.log('⏰ Timeout: La solicitud tardó más de 15 segundos');
  req.destroy();
});

req.write(postData);
req.end();
