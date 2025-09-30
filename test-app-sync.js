#!/usr/bin/env node

// Script para probar sincronización desde la app
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCnRuMLopAdNhyaXlIR75d1aj2nWBmizvI",
  authDomain: "pasteleria-cocina-app.firebaseapp.com",
  projectId: "pasteleria-cocina-app",
  storageBucket: "pasteleria-cocina-app.firebasestorage.app",
  messagingSenderId: "975279453152",
  appId: "1:975279453152:web:08c52d6d8e6ef7e8bbb185"
};

async function testDataSync() {
  try {
    console.log('🔥 Probando sincronización de datos...');
    
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    // Autenticarse anónimamente
    const userCredential = await signInAnonymously(auth);
    const userId = userCredential.user.uid;
    console.log('✅ Autenticado como:', userId);
    
    // Crear un pedido de prueba
    console.log('\n🔄 Creando pedido de prueba...');
    const pedidoPrueba = {
      id: Date.now(),
      fecha_entrega: new Date().toISOString().split('T')[0],
      nombre: 'Pedido de Prueba - ' + new Date().toLocaleString(),
      precio_final: 150,
      monto_abonado: 75,
      descripcion: 'Pedido de prueba para verificar sincronización',
      productos: [{
        tipo: 'pastel',
        sabor: 'chocolate',
        relleno: 'dulce de leche',
        tamaño: 'mediano'
      }],
      userId: userId,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Guardar en Firestore
    const docRef = await addDoc(collection(db, 'pedidos'), pedidoPrueba);
    console.log('✅ Pedido guardado con ID:', docRef.id);
    
    // Verificar que se guardó
    console.log('\n🔄 Verificando datos guardados...');
    const querySnapshot = await getDocs(collection(db, 'pedidos'));
    console.log('📊 Total de pedidos en Firestore:', querySnapshot.size);
    
    querySnapshot.forEach((doc) => {
      console.log('  - Pedido ID:', doc.id, 'Nombre:', doc.data().nombre);
    });
    
    console.log('\n🎉 ¡SINCRONIZACIÓN EXITOSA!');
    console.log('\n📋 Instrucciones:');
    console.log('1. Ve a Firebase Console > Firestore > Datos');
    console.log('2. Deberías ver la colección "pedidos"');
    console.log('3. Deberías ver el pedido de prueba que acabamos de crear');
    
    console.log('\n🔗 Enlaces:');
    console.log('  Firestore: https://console.firebase.google.com/project/pasteleria-cocina-app/firestore');
    console.log('  Reglas: https://console.firebase.google.com/project/pasteleria-cocina-app/firestore/rules');
    
  } catch (error) {
    console.error('\n❌ ERROR DE SINCRONIZACIÓN:');
    console.error('  Código:', error.code);
    console.error('  Mensaje:', error.message);
    
    if (error.code === 'permission-denied') {
      console.error('\n🔧 SOLUCIÓN: Configurar reglas de Firestore');
      console.error('  1. Ve a Firebase Console > Firestore > Reglas');
      console.error('  2. Cambia las reglas a:');
      console.error('     rules_version = "2";');
      console.error('     service cloud.firestore {');
      console.error('       match /databases/{database}/documents {');
      console.error('         match /{document=**} {');
      console.error('           allow read, write: if request.auth != null;');
      console.error('         }');
      console.error('       }');
      console.error('     }');
      console.error('  3. Haz clic en "Publicar"');
    }
  }
}

testDataSync();
