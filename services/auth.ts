import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import { CREATE_USERS_TABLE } from '../database/schema';

const db: SQLiteDatabase = openDatabaseSync('pasteleria.db');

export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'dueño' | 'repostero';
  nombre: string;
  activo: boolean;
  created_at: string;
}

export const initAuthDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.execSync(CREATE_USERS_TABLE);
      createDefaultUsers();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const createDefaultUsers = (): void => {
  try {
    // Limpiar usuarios existentes
    db.runSync('DELETE FROM users');

    const defaultUsers = [
      { username: 'admin', password: '2110', role: 'admin', nombre: 'Administrador' },
      { username: 'dueno', password: 'dueno2024', role: 'dueño', nombre: 'Raquel' },
      { username: 'repostero', password: 'repostero2024', role: 'repostero', nombre: 'Repostero' }
    ];

    defaultUsers.forEach(user => {
      db.runSync(
        'INSERT INTO users (username, password, role, nombre, activo) VALUES (?, ?, ?, ?, 1)',
        [user.username, user.password, user.role, user.nombre]
      );
    });
  } catch (error) {
    console.error('Error creando usuarios:', error);
  }
};

export const authenticateUser = (username: string, password: string): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    try {
      const user = db.getFirstSync(
        'SELECT id, username, password, role, nombre, activo, created_at FROM users WHERE username = ? AND password = ? AND activo = 1',
        [username, password]
      );
      resolve(user as User | null);
    } catch (error) {
      reject(error);
    }
  });
};

export const resetAuthDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync('DROP TABLE IF EXISTS users');
      db.execSync(CREATE_USERS_TABLE);
      createDefaultUsers();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
