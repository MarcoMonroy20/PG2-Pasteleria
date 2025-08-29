# Backend - Pastelería Cocina App

## Descripción
Servicios y base de datos para la aplicación de gestión de pedidos de pastelería.

## Tecnologías
- SQLite (local)
- Node.js (futuro)
- MySQL (futuro)

## Estructura de Carpetas
```
backend/
├── database/            # Esquemas y configuración de BD
│   └── schema.ts       # Estructura de tablas
├── services/            # Servicios de datos
│   └── db.ts           # Conexión y operaciones de BD
└── package.json         # Dependencias del backend
```

## Instalación
```bash
cd backend
npm install
```

## Base de Datos
### Tabla: pedidos
- `id`: Identificador único
- `fecha_entrega`: Fecha de entrega del pedido
- `nombre`: Nombre del pedido
- `precio_final`: Precio total
- `monto_abonado`: Cantidad pagada
- `descripcion`: Descripción opcional
- `imagen`: Ruta de imagen de referencia
- `productos`: Lista de productos en formato JSON

## Funcionalidades
- Inicialización de base de datos
- Operaciones CRUD para pedidos
- Migración futura a MySQL
- Servicios de notificaciones (futuro)

## Futuro
- API REST con Node.js
- Base de datos MySQL en la nube
- Autenticación y autorización
- Logs y monitoreo 