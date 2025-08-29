import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import { CREATE_PEDIDOS_TABLE } from '../database/schema';

const db: SQLiteDatabase = openDatabaseSync('pasteleria.db');

export const initDB = () => {
  return new Promise<void>((resolve, reject) => {
    try {
      db.execSync(CREATE_PEDIDOS_TABLE);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export default db; 