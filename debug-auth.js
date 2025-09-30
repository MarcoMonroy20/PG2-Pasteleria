// Debug script para verificar autenticación
const { openDatabaseSync } = require('expo-sqlite');

console.log('🔍 Iniciando debug de autenticación...');

try {
  const db = openDatabaseSync('pasteleria.db');
  console.log('✅ Base de datos abierta correctamente');

  // Verificar si existe la tabla users
  const tables = db.getAllSync('SELECT name FROM sqlite_master WHERE type="table"');
  console.log('📋 Tablas existentes:', tables);

  // Verificar usuarios
  const users = db.getAllSync('SELECT * FROM users');
  console.log('👥 Usuarios encontrados:', users);

  // Verificar si hay algún problema con la tabla
  const userCount = db.getFirstSync('SELECT COUNT(*) as count FROM users');
  console.log('📊 Cantidad de usuarios:', userCount);

} catch (error) {
  console.error('❌ Error en debug de autenticación:', error);
}
