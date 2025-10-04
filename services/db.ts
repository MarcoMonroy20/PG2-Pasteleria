import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import { CREATE_PEDIDOS_TABLE, CREATE_SABORES_TABLE, CREATE_RELLENOS_TABLE, CREATE_USERS_TABLE, CREATE_SETTINGS_TABLE } from '../database/schema';

const db: SQLiteDatabase = openDatabaseSync('pasteleria.db');

export const initDB = () => {
  return new Promise<void>((resolve, reject) => {
    try {
      console.log('Inicializando base de datos...');

      // Crear todas las tablas
      db.execSync(CREATE_USERS_TABLE);
      db.execSync(CREATE_PEDIDOS_TABLE);
      db.execSync(CREATE_SABORES_TABLE);
      db.execSync(CREATE_RELLENOS_TABLE);

      // Tabla para mapear pedidos a notificaciones programadas
      db.execSync(`CREATE TABLE IF NOT EXISTS notifications (
        pedido_id INTEGER PRIMARY KEY,
        notification_id TEXT
      );`);

      // Tabla de settings
      db.execSync(CREATE_SETTINGS_TABLE);

      // Migración: agregar direccion_entrega si no existe
      try {
        db.runSync('ALTER TABLE pedidos ADD COLUMN direccion_entrega TEXT');
        console.log('✅ Migración: direccion_entrega agregada');
      } catch (error) {
        // La columna ya existe, ignorar error
        console.log('📝 direccion_entrega ya existe');
      }

      // Asegurar fila única de settings
      db.runSync('INSERT OR IGNORE INTO settings (id, notifications_enabled, days_before) VALUES (1, 0, 1)');

      // Establecer valores por defecto de contacto
      db.runSync(
        'UPDATE settings SET contact_name = COALESCE(contact_name, ?), company_name = COALESCE(company_name, ?), phone = COALESCE(phone, ?) WHERE id = 1',
        ['Raquel Alejandra Rousselin Pellecer', 'Sweet Cakes', '53597287']
      );

      console.log('Tablas creadas, creando datos por defecto...');

      // Insertar usuarios, sabores y rellenos por defecto
      crearUsuariosPorDefecto();
      insertarSaboresPorDefecto();
      insertarRellenosPorDefecto();

      console.log('Base de datos inicializada correctamente');
      resolve();
    } catch (error) {
      console.error('Error inicializando BD:', error);
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
      // Error silencioso en inserción de sabores por defecto
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
      // Error silencioso en inserción de rellenos por defecto
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
  direccion_entrega?: string;
  imagen?: string;
  productos: Producto[];
}

// Función para crear un nuevo pedido
export const crearPedido = (pedido: Omit<Pedido, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    try {
      const productosJson = JSON.stringify(pedido.productos);
      console.log('Guardando fecha_entrega:', pedido.fecha_entrega);
      const result = db.runSync(
        'INSERT INTO pedidos (fecha_entrega, nombre, precio_final, monto_abonado, descripcion, direccion_entrega, imagen, productos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          pedido.fecha_entrega,
          pedido.nombre,
          pedido.precio_final,
          pedido.monto_abonado,
          pedido.descripcion || null,
          pedido.direccion_entrega || null,
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
      const pedidos = result.map((row: any) => {
        console.log('📊 Leyendo pedido ID:', row.id, 'fecha_entrega:', row.fecha_entrega);
        return {
          ...row,
          productos: JSON.parse(row.productos)
        };
      });
      console.log('📈 Total pedidos leídos:', pedidos.length);
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
      const result = db.getFirstSync('SELECT * FROM pedidos WHERE id = ?', [id]) as any;
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
      console.log('📝 db.actualizarPedido llamado con ID:', id);
      const productosJson = JSON.stringify(pedido.productos);
      db.runSync(
        'UPDATE pedidos SET fecha_entrega = ?, nombre = ?, precio_final = ?, monto_abonado = ?, descripcion = ?, direccion_entrega = ?, imagen = ?, productos = ? WHERE id = ?',
        [
          pedido.fecha_entrega,
          pedido.nombre,
          pedido.precio_final,
          pedido.monto_abonado,
          pedido.descripcion || null,
          pedido.direccion_entrega || null,
          pedido.imagen || null,
          productosJson,
          id
        ]
      );
      console.log('📝 Pedido actualizado en SQLite');
      resolve();
    } catch (error) {
      console.error('❌ Error actualizando pedido en SQLite:', error);
      reject(error);
    }
  });
};

// Función para eliminar un pedido
export const eliminarPedido = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('🗑️ db.eliminarPedido llamado con ID:', id);
      db.runSync('DELETE FROM pedidos WHERE id = ?', [id]);
      console.log('🗑️ Pedido eliminado de SQLite');
      resolve();
    } catch (error) {
      console.error('❌ Error eliminando pedido de SQLite:', error);
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
  contact_name?: string;
  company_name?: string;
  phone?: string;
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
      const row = db.getFirstSync('SELECT notifications_enabled, days_before, contact_name, company_name, phone FROM settings WHERE id = 1') as any;
      resolve({
        notifications_enabled: Boolean(row?.notifications_enabled ?? 0),
        days_before: Number(row?.days_before ?? 0),
        contact_name: row?.contact_name ?? 'Raquel Alejandra Rousselin Pellecer',
        company_name: row?.company_name ?? 'Sweet Cakes',
        phone: row?.phone ?? '53597287',
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
      const row = db.getFirstSync('SELECT notification_id FROM notifications WHERE pedido_id = ?', [pedidoId]) as any;
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
        'UPDATE settings SET notifications_enabled = ?, days_before = ?, contact_name = ?, company_name = ?, phone = ? WHERE id = 1',
        [
          settings.notifications_enabled ? 1 : 0,
          Math.max(0, Math.min(7, settings.days_before)),
          settings.contact_name ?? null,
          settings.company_name ?? null,
          settings.phone ?? null,
        ]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Tipos para usuarios
export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'dueño' | 'repostero';
  nombre: string;
  activo: boolean;
  created_at: string;
}

// Funciones de usuarios
export const crearUsuariosPorDefecto = (): void => {
  try {
    console.log('Verificando usuarios existentes...');
    db.runSync('DELETE FROM users');

    console.log('Creando usuarios por defecto...');
    const usuariosPorDefecto = [
      { username: 'admin', password: 'admin2024', role: 'admin', nombre: 'Administrador' },
      { username: 'dueno', password: 'dueno2024', role: 'dueño', nombre: 'Raquel' },
      { username: 'repostero', password: 'repostero2024', role: 'repostero', nombre: 'Repostero' }
    ];

    usuariosPorDefecto.forEach(user => {
      db.runSync(
        'INSERT INTO users (username, password, role, nombre, activo) VALUES (?, ?, ?, ?, 1)',
        [user.username, user.password, user.role, user.nombre]
      );
    });

    console.log('Usuarios creados exitosamente');
  } catch (error) {
    console.error('Error creando usuarios por defecto:', error);
  }
};

export const autenticarUsuario = (username: string, password: string): Promise<User | null> => {
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

export const obtenerUsuarios = (): Promise<User[]> => {
  return new Promise((resolve, reject) => {
    try {
      const users = db.getAllSync('SELECT id, username, password, role, nombre, activo, created_at FROM users ORDER BY role, nombre');
      resolve(users as User[]);
    } catch (error) {
      reject(error);
    }
  });
};

export const crearUsuario = (user: Omit<User, 'id' | 'created_at'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.runSync(
        'INSERT INTO users (username, password, role, nombre, activo) VALUES (?, ?, ?, ?, ?)',
        [user.username, user.password, user.role, user.nombre, user.activo ? 1 : 0]
      );
      resolve(result.lastInsertRowId);
    } catch (error) {
      reject(error);
    }
  });
};

export const actualizarUsuario = (id: number, user: Partial<User>): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const fields = [];
      const values = [];

      if (user.username !== undefined) {
        fields.push('username = ?');
        values.push(user.username);
      }
      if (user.password !== undefined) {
        fields.push('password = ?');
        values.push(user.password);
      }
      if (user.role !== undefined) {
        fields.push('role = ?');
        values.push(user.role);
      }
      if (user.nombre !== undefined) {
        fields.push('nombre = ?');
        values.push(user.nombre);
      }
      if (user.activo !== undefined) {
        fields.push('activo = ?');
        values.push(user.activo ? 1 : 0);
      }

      if (fields.length === 0) {
        resolve();
        return;
      }

      values.push(id);
      db.runSync(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const eliminarUsuario = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync('DELETE FROM users WHERE id = ?', [id]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Función para resetear completamente la base de datos
export const resetDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Reseteando base de datos completamente...');

      // Eliminar todas las tablas
      try { db.runSync('DROP TABLE IF EXISTS users'); } catch (e) { console.log('Error dropping users:', e); }
      try { db.runSync('DROP TABLE IF EXISTS pedidos'); } catch (e) { console.log('Error dropping pedidos:', e); }
      try { db.runSync('DROP TABLE IF EXISTS sabores'); } catch (e) { console.log('Error dropping sabores:', e); }
      try { db.runSync('DROP TABLE IF EXISTS rellenos'); } catch (e) { console.log('Error dropping rellenos:', e); }
      try { db.runSync('DROP TABLE IF EXISTS settings'); } catch (e) { console.log('Error dropping settings:', e); }
      try { db.runSync('DROP TABLE IF EXISTS notifications'); } catch (e) { console.log('Error dropping notifications:', e); }

      console.log('Tablas eliminadas, recreando...');

      // Recrear todas las tablas
      db.execSync(CREATE_USERS_TABLE);
      db.execSync(CREATE_PEDIDOS_TABLE);
      db.execSync(CREATE_SABORES_TABLE);
      db.execSync(CREATE_RELLENOS_TABLE);
      db.execSync(CREATE_SETTINGS_TABLE);

      // Tabla para mapear pedidos a notificaciones
      db.execSync(`CREATE TABLE IF NOT EXISTS notifications (
        pedido_id INTEGER PRIMARY KEY,
        notification_id TEXT
      );`);

      // Insertar datos por defecto
      crearUsuariosPorDefecto();
      insertarSaboresPorDefecto();
      insertarRellenosPorDefecto();

      // Configurar settings por defecto
      db.runSync('INSERT OR IGNORE INTO settings (id, notifications_enabled, days_before) VALUES (1, 0, 1)');
      db.runSync(
        'UPDATE settings SET contact_name = ?, company_name = ?, phone = ? WHERE id = 1',
        ['Raquel Alejandra Rousselin Pellecer', 'Sweet Cakes', '53597287']
      );

      console.log('Base de datos reseteada correctamente');
      resolve();
    } catch (error) {
      console.error('Error reseteando BD:', error);
      reject(error);
    }
  });
};