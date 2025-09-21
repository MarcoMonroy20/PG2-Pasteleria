# Configuración de Firebase para Pastelería App

## 📋 Arquitectura Híbrida

Esta aplicación implementa una **arquitectura híbrida** que combina:
- **Imágenes locales** (para optimizar rendimiento y costos)
- **Datos principales en Firebase** (para sincronización y backup)

## 🔧 Configuración Inicial

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Ingresa el nombre: `pasteleria-app`
4. Sigue los pasos del asistente

### 2. Habilitar Servicios

En tu proyecto de Firebase, habilita:

#### Firestore Database
1. Ve a "Firestore Database" en el menú lateral
2. Haz clic en "Crear base de datos"
3. Elige "Comenzar en modo de producción"
4. Selecciona una ubicación (recomendado: `us-central1`)

#### Authentication
1. Ve a "Authentication" en el menú lateral
2. Haz clic en "Comenzar"
3. Ve a la pestaña "Sign-in method"
4. Habilita "Anonymous" (para usuarios sin registro)

### 3. Obtener Configuración

1. Ve a "Configuración del proyecto" (icono de engranaje)
2. Desplázate hacia abajo hasta "Tus apps"
3. Haz clic en "Agregar app" → Web app (</>)
4. Registra la app con nombre: `Pastelería Web`
5. Copia la configuración que aparece

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**O** actualiza el archivo `frontend/firebase.config.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 📊 Estructura de Datos en Firebase

### Colecciones Principales

```
Firestore Database
├── pedidos/
│   ├── {userId}_{pedidoId}/
│   │   ├── id: number
│   │   ├── fecha_entrega: string
│   │   ├── nombre: string
│   │   ├── precio_final: number
│   │   ├── monto_abonado: number
│   │   ├── descripcion?: string
│   │   ├── productos: Product[]
│   │   ├── userId: string
│   │   ├── created_at: Timestamp
│   │   └── updated_at: Timestamp
├── sabores/
│   └── {userId}_{saborId}/
├── rellenos/
│   └── {userId}_{rellenoId}/
└── settings/
    └── {userId}/
```

### Almacenamiento Local (Imágenes)

Las imágenes se almacenan localmente usando:
- **Móvil**: SQLite + sistema de archivos del dispositivo
- **Web**: LocalStorage + referencias de archivos

```typescript
interface LocalImageRef {
  pedidoId: number;
  imagePath: string;        // Ruta local del archivo
  imageType: 'file' | 'base64';
  fileName: string;
  created_at: string;
}
```

## 🔄 Funcionamiento de la Sincronización

### Sincronización Automática
- Los datos se sincronizan automáticamente cuando se crean/modifican
- Las imágenes permanecen siempre locales
- Funciona sin conexión (offline-first)

### Sincronización Manual
- Botón "Sincronizar" en configuración
- Permite forzar subida o descarga de datos
- Indicador de estado de conexión

### Resolución de Conflictos
- Los datos locales tienen prioridad
- Los datos remotos se usan como respaldo
- Sistema de timestamps para detectar cambios

## 🚀 Uso en la Aplicación

### Para Desarrolladores

1. **Inicializar Firebase**:
```typescript
import hybridDB from '../services/hybrid-db';

// Inicializar al inicio de la app
await hybridDB.initialize();
```

2. **Usar operaciones normales**:
```typescript
// Crear pedido (imagen local, datos a Firebase)
const pedidoId = await hybridDB.crearPedido({
  nombre: "Pastel de Chocolate",
  imagen: "/path/to/image.jpg",  // ← Se guarda localmente
  productos: [...],
  // ... otros datos van a Firebase
});

// Obtener pedidos (combina datos locales + Firebase)
const pedidos = await hybridDB.obtenerPedidos();
```

3. **Sincronización manual**:
```typescript
// Subir datos locales a Firebase
await hybridDB.syncToCloud();

// Descargar datos de Firebase
await hybridDB.syncFromCloud();
```

### Para Usuarios Finales

1. **Primer uso**: La app funciona completamente local
2. **Con Firebase**: Se habilita sincronización automática
3. **Sin conexión**: Funciona normalmente con datos locales
4. **Imágenes**: Siempre disponibles localmente

## 📈 Beneficios de Esta Arquitectura

### ✅ Ventajas
- **Rendimiento**: Imágenes locales = carga instantánea
- **Costo**: No sobrecarga Firebase Storage
- **Offline**: Funciona sin conexión a internet
- **Backup**: Datos principales respaldados en la nube
- **Multi-dispositivo**: Sincronización entre dispositivos

### ⚠️ Consideraciones
- Las imágenes no se comparten entre dispositivos
- Requiere configuración inicial de Firebase
- Los datos locales tienen prioridad sobre los remotos

## 🛠️ Solución de Problemas

### Firebase no se conecta
1. Verifica las variables de entorno
2. Asegúrate de que los servicios estén habilitados
3. Revisa la consola del navegador para errores

### Imágenes no se muestran
1. Las imágenes están almacenadas localmente
2. Verifica que el dispositivo tenga espacio suficiente
3. En web, las imágenes se pierden al limpiar LocalStorage

### Sincronización falla
1. Verifica conexión a internet
2. Firebase podría estar en modo mantenimiento
3. Revisa permisos de Firestore

## 🔒 Seguridad

- **Autenticación**: Anonymous (sin registro de usuarios)
- **Reglas de Firestore**: Solo el usuario puede acceder a sus datos
- **Imágenes locales**: No se transmiten por internet
- **Datos sensibles**: Encriptados localmente si es necesario

## 📋 Checklist de Configuración

- [ ] Crear proyecto en Firebase Console
- [ ] Habilitar Firestore Database
- [ ] Habilitar Authentication con Anonymous
- [ ] Obtener configuración de la app web
- [ ] Configurar variables de entorno
- [ ] Probar conexión en la app
- [ ] Verificar sincronización de datos

¡La aplicación está lista para usar con Firebase! 🎉
