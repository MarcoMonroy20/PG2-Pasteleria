# Sistema Offline - Funcionamiento Completo

## 📱 Arquitectura Offline-First

La aplicación está diseñada con una **arquitectura offline-first** que garantiza funcionamiento completo sin conexión a internet. Cuando se recupera la conexión, todos los datos se sincronizan automáticamente.

## 🔄 Estados de Conexión

### 1. **Online (Conectado)**
- ✅ Sincronización automática e inmediata
- ✅ Todos los datos disponibles
- ✅ Funcionalidad completa

### 2. **Offline (Sin Conexión)**
- ✅ Funcionamiento completo local
- ✅ Creación, edición y eliminación de pedidos
- ✅ Almacenamiento de imágenes local
- ✅ Visualización de todos los datos
- ✅ Cola de sincronización automática

### 3. **Recuperando Conexión**
- 🔄 Sincronización automática iniciada
- 📊 Indicador visual del progreso
- ⚠️ Reintentos automáticos en caso de error
- ✅ Notificación de sincronización exitosa

## 💾 Almacenamiento Híbrido

### **Datos Locales (Siempre Disponibles)**
```
📱 SQLite/LocalStorage:
├── Pedidos completos
├── Sabores y rellenos
├── Configuración
└── Referencias de imágenes locales
```

### **Imágenes (Solo Locales)**
```
📱 Sistema de archivos del dispositivo:
├── Fotos de productos
├── Imágenes de pedidos
└── Archivos multimedia
```

### **Datos en Nube (Firebase)**
```
☁️ Firestore Database:
├── Pedidos sin imágenes
├── Configuración
├── Sabores y rellenos
└── Backup automático
```

## 🔄 Cola de Sincronización

### **Funcionamiento Automático**
1. **Detección de desconexión** → Operaciones van a cola local
2. **Recuperación de conexión** → Sincronización automática iniciada
3. **Procesamiento por lotes** → Evita sobrecarga del servidor
4. **Reintentos inteligentes** → Hasta 3 intentos por operación
5. **Limpieza automática** → Elementos exitosos se eliminan

### **Tipos de Operaciones en Cola**
```typescript
interface PendingSyncItem {
  id: string;                    // ID único
  operation: 'CREATE' | 'UPDATE'; // Tipo de operación
  collection: 'pedidos' | 'settings'; // Colección afectada
  data: any;                     // Datos a sincronizar
  timestamp: number;             // Momento de creación
  retryCount: number;           // Número de reintentos
}
```

## 🎯 Funcionalidades Offline

### **✅ Siempre Disponibles**
- 📝 Crear nuevos pedidos
- ✏️ Editar pedidos existentes
- 🗑️ Eliminar pedidos
- 📅 Ver calendario
- 📋 Ver lista de pedidos
- ⚙️ Cambiar configuración
- 📸 Tomar y guardar fotos

### **🔄 Sincronizadas Automáticamente**
- 📤 Subida de pedidos nuevos
- 🔄 Actualización de pedidos modificados
- ☁️ Backup de configuración
- 📊 Sincronización de catálogos

## 📊 Indicadores Visuales

### **Estado de Conexión**
```
🟢 En línea              → Verde
🟠 Fuera de línea        → Naranja (con pendientes)
🔴 Sin Firebase         → Gris
```

### **Botón de Sincronización**
```
🔵 Sincronizar           → Azul (normal)
🟠 Sincronizar (3)       → Naranja (con pendientes)
⚪ Sincronizando...      → Deshabilitado
```

### **Banner de Estado**
```
🔴 Sin conexión a internet
🟡 Sin conexión • 5 pendientes
🟢 Sincronizando 3 elementos
```

## 🔧 Configuración Técnica

### **Detección de Red**
```typescript
// React Native: @react-native-community/netinfo
// Web: navigator.onLine + window events
// Intervalo: 5 segundos para actualizar contadores
```

### **Umbrales de Reintento**
```typescript
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 30000; // 30 segundos
const SYNC_INTERVAL = 5000; // 5 segundos
```

### **Límites de Cola**
```typescript
const MAX_QUEUE_SIZE = 1000; // Máximo 1000 elementos
const MAX_RETRY_COUNT = 3;   // Máximo 3 reintentos
```

## 🚀 Uso en la Práctica

### **Flujo de Trabajo Típico**

1. **Usuario abre la app** → Funciona completamente offline
2. **Crea pedidos con fotos** → Todo se guarda localmente
3. **Pierde conexión** → Sigue funcionando normalmente
4. **Recupera conexión** → Sincronización automática comienza
5. **Ve indicadores** → Sabe que está sincronizando
6. **Continúa trabajando** → Sin interrupciones

### **Escenarios de Uso**

#### **📱 Trabajo en Campo**
- Repostero en pasteleria sin WiFi
- Creación de pedidos con fotos
- Sincronización automática al volver

#### **🏠 Trabajo desde Casa**
- Conexión inestable
- Trabajo continuo sin interrupciones
- Sincronización automática

#### **✈️ Viajes**
- Sin conexión durante viajes
- Trabajo offline completo
- Sincronización al llegar al destino

## 🔒 Seguridad y Confiabilidad

### **Manejo de Errores**
- ✅ Reintentos automáticos
- ✅ Fallback a datos locales
- ✅ Notificaciones de estado
- ✅ Recuperación de fallos

### **Persistencia de Datos**
- ✅ Almacenamiento local robusto
- ✅ Backup automático en nube
- ✅ Recuperación de datos corruptos
- ✅ Migración automática de versiones

### **Privacidad**
- ✅ Imágenes nunca salen del dispositivo
- ✅ Datos encriptados localmente
- ✅ Autenticación anónima opcional
- ✅ Control total del usuario

## 📋 Checklist de Funcionamiento Offline

### **Funcionalidades Core**
- [x] Crear pedidos offline
- [x] Editar pedidos offline
- [x] Ver pedidos offline
- [x] Guardar imágenes offline
- [x] Cambiar configuración offline

### **Sincronización**
- [x] Detección automática de conexión
- [x] Cola de sincronización
- [x] Reintentos automáticos
- [x] Indicadores visuales
- [x] Notificaciones de estado

### **Recuperación de Errores**
- [x] Fallback a datos locales
- [x] Recuperación de cola corrupta
- [x] Sincronización forzada manual
- [x] Limpieza de cola

## 🛠️ Solución de Problemas

### **Problema: Datos no se sincronizan**
```
✅ Verificar conexión a internet
✅ Revisar configuración de Firebase
✅ Verificar permisos de red
✅ Forzar sincronización manual
```

### **Problema: App lenta en offline**
```
✅ Verificar espacio en disco
✅ Limpiar cola de sincronización
✅ Reiniciar aplicación
✅ Verificar integridad de base de datos
```

### **Problema: Imágenes no se muestran**
```
✅ Verificar permisos de cámara/galería
✅ Verificar espacio en almacenamiento
✅ Reiniciar aplicación
✅ Verificar rutas de archivos locales
```

## 🎉 Beneficios del Sistema

### **Para el Usuario**
- 🚀 **Cero interrupciones** por problemas de conexión
- 📸 **Fotos siempre disponibles** localmente
- ☁️ **Backup automático** cuando hay conexión
- 📱 **Experiencia fluida** en cualquier condición

### **Para el Negocio**
- 💪 **Confiabilidad total** en cualquier escenario
- 📊 **Sincronización inteligente** sin sobrecarga
- 🔒 **Datos seguros** con privacidad garantizada
- ⚡ **Rendimiento óptimo** con imágenes locales

**¡La aplicación funciona perfectamente offline y se sincroniza automáticamente cuando recupera la conexión! 🎉**
