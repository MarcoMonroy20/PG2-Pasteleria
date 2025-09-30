#!/usr/bin/env node

// Script para crear el índice de Firestore automáticamente
const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔧 Creando índice de Firestore...');

// Cargar variables de entorno
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

const projectId = envVars['EXPO_PUBLIC_FIREBASE_PROJECT_ID'];
const apiKey = envVars['EXPO_PUBLIC_FIREBASE_API_KEY'];

if (!projectId || !apiKey) {
  console.log('❌ Faltan variables de entorno requeridas');
  process.exit(1);
}

console.log(`📋 Proyecto: ${projectId}`);

// Crear el índice de Firestore
const indexData = {
  indexes: [
    {
      collectionGroup: 'pedidos',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'fecha_entrega', order: 'ASCENDING' }
      ]
    }
  ],
  fieldOverrides: []
};

const postData = JSON.stringify(indexData);
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/indexes?key=${apiKey}`;

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 30000
};

console.log('📡 Enviando solicitud para crear índice...');

const req = https.request(url, options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ Índice creado exitosamente!');
        console.log('📋 Respuesta:', JSON.stringify(response, null, 2));
        
        if (response.name) {
          console.log(`🔗 Nombre del índice: ${response.name}`);
          console.log('⏳ El índice puede tardar unos minutos en estar disponible');
        }
      } else if (response.error) {
        console.log('❌ Error creando índice:', response.error);
        
        if (response.error.message.includes('already exists')) {
          console.log('✅ El índice ya existe - esto es normal');
        } else if (response.error.message.includes('PERMISSION_DENIED')) {
          console.log('🔧 Error de permisos - necesitas permisos de administrador');
          console.log('💡 Solución manual:');
          console.log('   1. Ir a Firebase Console');
          console.log('   2. Firestore Database > Indexes');
          console.log('   3. Crear índice manualmente');
        }
      } else {
        console.log('⚠️ Respuesta inesperada:', data);
      }
    } catch (error) {
      console.log('⚠️ Error parseando respuesta:', error.message);
      console.log('📋 Respuesta raw:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
});

req.on('timeout', () => {
  console.log('⏰ Timeout: La solicitud tardó más de 30 segundos');
  req.destroy();
});

req.write(postData);
req.end();

console.log('\n💡 INFORMACIÓN ADICIONAL:');
console.log('Si el script falla, puedes crear el índice manualmente:');
console.log('1. Ir a Firebase Console');
console.log('2. Firestore Database > Indexes');
console.log('3. Crear índice compuesto:');
console.log('   - Collection: pedidos');
console.log('   - Fields: userId (Ascending), fecha_entrega (Ascending)');

console.log('\n🔗 Enlace directo:');
console.log(`https://console.firebase.google.com/project/${projectId}/firestore/indexes`);
