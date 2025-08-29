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

export const DROP_PEDIDOS_TABLE = `DROP TABLE IF EXISTS pedidos;`; 