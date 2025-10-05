export const CREATE_PEDIDOS_TABLE = `
CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha_entrega TEXT NOT NULL,
  nombre TEXT NOT NULL,
  precio_final REAL NOT NULL,
  monto_abonado REAL NOT NULL,
  descripcion TEXT,
  imagen TEXT,
  productos TEXT NOT NULL
);
`;

export const CREATE_SABORES_TABLE = `
CREATE TABLE IF NOT EXISTS sabores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  activo INTEGER DEFAULT 1
);
`;

export const CREATE_RELLENOS_TABLE = `
CREATE TABLE IF NOT EXISTS rellenos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'pastel',
  activo INTEGER DEFAULT 1,
  UNIQUE(nombre, tipo)
);
`;

export const CREATE_USERS_TABLE = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'dueño', 'repostero')),
  nombre TEXT NOT NULL,
  activo INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export const CREATE_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  notifications_enabled INTEGER DEFAULT 0,
  days_before INTEGER DEFAULT 1,
  contact_name TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  phone TEXT DEFAULT ''
);
`;

export const DROP_USERS_TABLE = `DROP TABLE IF EXISTS users;`;
export const DROP_SETTINGS_TABLE = `DROP TABLE IF EXISTS settings;`;
export const DROP_PEDIDOS_TABLE = `DROP TABLE IF EXISTS pedidos;`;
export const DROP_SABORES_TABLE = `DROP TABLE IF EXISTS sabores;`;
export const DROP_RELLENOS_TABLE = `DROP TABLE IF EXISTS rellenos;`; 