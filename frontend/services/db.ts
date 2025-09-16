import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import { CREATE_PEDIDOS_TABLE, CREATE_SABORES_TABLE, CREATE_RELLENOS_TABLE } from '../database/schema';

const db: SQLiteDatabase = openDatabaseSync('pasteleria.db');

export const initDB = () => {
  return new Promise<void>((resolve, reject) => {
    try {
      db.execSync(CREATE_PEDIDOS_TABLE);
      db.execSync(CREATE_SABORES_TABLE);
      db.execSync(CREATE_RELLENOS_TABLE);
      // Tabla para mapear pedidos a notificaciones programadas
      db.execSync(`CREATE TABLE IF NOT EXISTS notifications (
        pedido_id INTEGER PRIMARY KEY,
        notification_id TEXT
      );`);
      // Tabla de settings (si no existe)
      db.execSync(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        notifications_enabled INTEGER DEFAULT 0,
        days_before INTEGER DEFAULT 0
      );`);
      // Asegurar fila única
      db.runSync('INSERT OR IGNORE INTO settings (id, notifications_enabled, days_before) VALUES (1, 0, 0)');
      
      // Insertar sabores por defecto si no existen
      insertarSaboresPorDefecto();
      insertarRellenosPorDefecto();
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

const insertarSaboresPorDefecto = () => {
  const saboresPorDefecto = [
    { nombre: 'Chocolate', tipo: 'pastel' },
    { nombre: 'Vainilla', tipo: 'pastel' },
    { nombre: 'Fresa', tipo: 'pastel' },
    { nombre: 'Limón', tipo: 'pastel' },
    { nombre: 'Chocolate', tipo: 'cupcakes' },
    { nombre: 'Vainilla', tipo: 'cupcakes' },
    { nombre: 'Fresa', tipo: 'cupcakes' },
    { nombre: 'Limón', tipo: 'cupcakes' },
  ];

  saboresPorDefecto.forEach(sabor => {
    try {
      db.runSync(
        'INSERT OR IGNORE INTO sabores (nombre, tipo) VALUES (?, ?)',
        [sabor.nombre, sabor.tipo]
      );
    } catch (error) {
      console.log('Error insertando sabor por defecto:', error);
    }
  });
};

const insertarRellenosPorDefecto = () => {
  const rellenosPorDefecto = [
    'Crema de Mantequilla',
    'Crema de Vainilla',
    'Mermelada de Fresa',
    'Mermelada de Durazno',
    'Dulce de Leche',
    'Chocolate',
    'Frutas',
    'Sin Relleno',
  ];

  rellenosPorDefecto.forEach(relleno => {
    try {
      db.runSync(
        'INSERT OR IGNORE INTO rellenos (nombre) VALUES (?)',
        [relleno]
      );
    } catch (error) {
      console.log('Error insertando relleno por defecto:', error);
    }
  });
};

// Interfaces para TypeScript
export interface Producto {
  tipo: 'pastel' | 'cupcakes' | 'otros';
  sabor?: string;
  relleno?: string;
  tamaño?: string;
  cantidad?: number;
  esMinicupcake?: boolean;
  descripcion?: string;
}

export interface Pedido {
  id?: number;
  fecha_entrega: string;
  nombre: string;
  precio_final: number;
  monto_abonado: number;
  descripcion?: string;
  imagen?: string;
  productos: Producto[];
}

// Función para crear un nuevo pedido
export const crearPedido = (pedido: Omit<Pedido, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    try {
      const productosJson = JSON.stringify(pedido.productos);
      const result = db.runSync(
        'INSERT INTO pedidos (fecha_entrega, nombre, precio_final, monto_abonado, descripcion, imagen, productos) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          pedido.fecha_entrega,
          pedido.nombre,
          pedido.precio_final,
          pedido.monto_abonado,
          pedido.descripcion || null,
          pedido.imagen || null,
          productosJson
        ]
      );
      resolve(result.lastInsertRowId as number);
    } catch (error) {
      reject(error);
    }
  });
};

// Función para obtener todos los pedidos
export const obtenerPedidos = (): Promise<Pedido[]> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync('SELECT * FROM pedidos ORDER BY fecha_entrega ASC');
      const pedidos = result.map((row: any) => ({
        ...row,
        productos: JSON.parse(row.productos)
      }));
      resolve(pedidos);
    } catch (error) {
      reject(error);
    }
  });
};

// Función para obtener un pedido por ID
export const obtenerPedidoPorId = (id: number): Promise<Pedido | null> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getFirstSync('SELECT * FROM pedidos WHERE id = ?', [id]);
      if (result) {
        const pedido = {
          ...result,
          productos: JSON.parse(result.productos)
        };
        resolve(pedido);
      } else {
        resolve(null);
      }
    } catch (error) {
      reject(error);
    }
  });
};

// Función para actualizar un pedido
export const actualizarPedido = (id: number, pedido: Omit<Pedido, 'id'>): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const productosJson = JSON.stringify(pedido.productos);
      db.runSync(
        'UPDATE pedidos SET fecha_entrega = ?, nombre = ?, precio_final = ?, monto_abonado = ?, descripcion = ?, imagen = ?, productos = ? WHERE id = ?',
        [
          pedido.fecha_entrega,
          pedido.nombre,
          pedido.precio_final,
          pedido.monto_abonado,
          pedido.descripcion || null,
          pedido.imagen || null,
          productosJson,
          id
        ]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Función para eliminar un pedido
export const eliminarPedido = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync('DELETE FROM pedidos WHERE id = ?', [id]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Función para obtener pedidos por rango de fechas
export const obtenerPedidosPorFecha = (fechaInicio: string, fechaFin: string): Promise<Pedido[]> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        'SELECT * FROM pedidos WHERE fecha_entrega BETWEEN ? AND ? ORDER BY fecha_entrega ASC',
        [fechaInicio, fechaFin]
      );
      const pedidos = result.map((row: any) => ({
        ...row,
        productos: JSON.parse(row.productos)
      }));
      resolve(pedidos);
    } catch (error) {
      reject(error);
    }
  });
};

// Interfaces para Sabores y Rellenos
export interface Sabor {
  id?: number;
  nombre: string;
  tipo: 'pastel' | 'cupcakes';
  activo: boolean;
}

export interface Relleno {
  id?: number;
  nombre: string;
  activo: boolean;
}

// Settings interface
export interface AppSettings {
  notifications_enabled: boolean;
  days_before: number; // 0..7
}

// Funciones para Sabores
export const obtenerSabores = (tipo?: 'pastel' | 'cupcakes'): Promise<Sabor[]> => {
  return new Promise((resolve, reject) => {
    try {
      let query = 'SELECT * FROM sabores WHERE activo = 1';
      let params: any[] = [];
      
      if (tipo) {
        query += ' AND tipo = ?';
        params.push(tipo);
      }
      
      query += ' ORDER BY nombre ASC';
      
      const result = db.getAllSync(query, params);
      const sabores = result.map((row: any) => ({
        ...row,
        activo: Boolean(row.activo)
      }));
      resolve(sabores);
    } catch (error) {
      reject(error);
    }
  });
};

export const crearSabor = (sabor: Omit<Sabor, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.runSync(
        'INSERT INTO sabores (nombre, tipo, activo) VALUES (?, ?, ?)',
        [sabor.nombre, sabor.tipo, sabor.activo ? 1 : 0]
      );
      resolve(result.lastInsertRowId as number);
    } catch (error) {
      reject(error);
    }
  });
};

export const actualizarSabor = (id: number, sabor: Omit<Sabor, 'id'>): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync(
        'UPDATE sabores SET nombre = ?, tipo = ?, activo = ? WHERE id = ?',
        [sabor.nombre, sabor.tipo, sabor.activo ? 1 : 0, id]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const eliminarSabor = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync('UPDATE sabores SET activo = 0 WHERE id = ?', [id]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Funciones para Rellenos
export const obtenerRellenos = (): Promise<Relleno[]> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync('SELECT * FROM rellenos WHERE activo = 1 ORDER BY nombre ASC');
      const rellenos = result.map((row: any) => ({
        ...row,
        activo: Boolean(row.activo)
      }));
      resolve(rellenos);
    } catch (error) {
      reject(error);
    }
  });
};

export const crearRelleno = (relleno: Omit<Relleno, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.runSync(
        'INSERT INTO rellenos (nombre, activo) VALUES (?, ?)',
        [relleno.nombre, relleno.activo ? 1 : 0]
      );
      resolve(result.lastInsertRowId as number);
    } catch (error) {
      reject(error);
    }
  });
};

export const actualizarRelleno = (id: number, relleno: Omit<Relleno, 'id'>): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync(
        'UPDATE rellenos SET nombre = ?, activo = ? WHERE id = ?',
        [relleno.nombre, relleno.activo ? 1 : 0, id]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const eliminarRelleno = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync('UPDATE rellenos SET activo = 0 WHERE id = ?', [id]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export default db; 

// Settings CRUD
export const obtenerSettings = (): Promise<AppSettings> => {
  return new Promise((resolve, reject) => {
    try {
      const row = db.getFirstSync('SELECT notifications_enabled, days_before FROM settings WHERE id = 1');
      resolve({
        notifications_enabled: Boolean(row?.notifications_enabled ?? 0),
        days_before: Number(row?.days_before ?? 0),
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Notifications mapping helpers
export const getNotificationIdForPedido = (pedidoId: number): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    try {
      const row = db.getFirstSync('SELECT notification_id FROM notifications WHERE pedido_id = ?', [pedidoId]);
      resolve(row?.notification_id ?? null);
    } catch (error) {
      reject(error);
    }
  });
};

export const setNotificationIdForPedido = (pedidoId: number, notificationId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync(
        'INSERT INTO notifications (pedido_id, notification_id) VALUES (?, ?) ON CONFLICT(pedido_id) DO UPDATE SET notification_id = excluded.notification_id',
        [pedidoId, notificationId]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const clearNotificationForPedido = (pedidoId: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync('DELETE FROM notifications WHERE pedido_id = ?', [pedidoId]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const guardarSettings = (settings: AppSettings): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync(
        'UPDATE settings SET notifications_enabled = ?, days_before = ? WHERE id = 1',
        [settings.notifications_enabled ? 1 : 0, Math.max(0, Math.min(7, settings.days_before))]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};