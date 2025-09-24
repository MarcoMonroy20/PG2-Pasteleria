# 🚀 Guía de Configuración Firebase

Esta guía te ayudará a configurar Firebase para la aplicación de pastelería.

## 📋 Prerrequisitos

1. **Cuenta de Google**: Necesitas una cuenta de Google para acceder a Firebase Console
2. **Proyecto de Firebase**: Crear un proyecto en https://console.firebase.google.com/

## 🔥 Configuración Paso a Paso

### 1. Crear Proyecto en Firebase

1. Ve a https://console.firebase.google.com/
2. Haz clic en "Crear un proyecto" o "Add project"
3. Ingresa el nombre: `pasteleria-cocina-app`
4. Selecciona si quieres Google Analytics (recomendado)
5. Elige la cuenta de Google Analytics
6. Haz clic en "Crear proyecto"

### 2. Configurar Firestore Database

1. En el menú lateral, ve a "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Elige "Comenzar en modo de producción"
4. Selecciona una ubicación (recomendado: `us-central1` o `southamerica-east1`)
5. Haz clic en "Listo"

### 3. Configurar Autenticación

1. En el menú lateral, ve a "Authentication"
2. Ve a la pestaña "Método de inicio de sesión"
3. Habilita "Inicio de sesión anónimo" (necesario para la app)
4. Haz clic en "Guardar"

### 4. Configurar Cloud Messaging (Push Notifications)

1. En el menú lateral, ve a "Project Settings" (el ícono de engranaje)
2. Ve a la pestaña "Cloud Messaging"
3. Si es necesario, habilita la API de Cloud Messaging
4. Ve a "Web Configuration" en Cloud Messaging
5. Genera un nuevo par de claves VAPID
6. **Guarda la clave pública VAPID** (la necesitarás después)

### 5. Crear App Web en Firebase

1. En Project Settings > General, ve a "Your apps"
2. Haz clic en el ícono de Web (`</>`) para agregar una app web
3. Ingresa el nombre: `Pastelería Cocina Web`
4. **IMPORTANTE**: Marca la casilla "También configurar Firebase Hosting"
5. Haz clic en "Registrar app"

### 6. Obtener las Credenciales

Después de registrar la app web, Firebase te mostrará un objeto de configuración. **Copia estos valores**, los necesitarás para configurar las variables de entorno.

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",           // ← Este valor
  authDomain: "tu-proyecto.firebaseapp.com",  // ← Este valor
  projectId: "tu-proyecto",       // ← Este valor
  storageBucket: "tu-proyecto.appspot.com",   // ← Este valor
  messagingSenderId: "123456789", // ← Este valor
  appId: "1:123456789:web:abc123" // ← Este valor
};
```

## 🔧 Configuración de Variables de Entorno

### Opción 1: Archivo .env.local (Recomendado para desarrollo)

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# VAPID Key para notificaciones push
EXPO_PUBLIC_FIREBASE_VAPID_KEY=tu_clave_vapid_publica_aqui
```

### Opción 2: Variables de Sistema

En Linux/Mac:
```bash
export EXPO_PUBLIC_FIREBASE_API_KEY="tu_api_key"
export EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
# ... etc
```

En Windows:
```cmd
set EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
set EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
# ... etc
```

## 📱 Configuración de Android (Opcional para Push Notifications)

### Descargar google-services.json

1. En Firebase Console, ve a Project Settings > General > Your apps
2. Para la app de Android, descarga el archivo `google-services.json`
3. Coloca este archivo en la raíz del proyecto (`./google-services.json`)

### Actualizar app.json

Asegúrate de que en `app.json` esté configurado:

```json
{
  "android": {
    "config": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

## ✅ Verificar Configuración

### Paso 1: Reiniciar la aplicación

```bash
# Limpiar cache y reiniciar
npm run clean
npm run android
```

### Paso 2: Verificar logs

En la consola deberías ver:
```
✅ Firebase initialized successfully
✅ Firestore ready
✅ Authentication ready
```

### Paso 3: Probar sincronización

1. Crea un pedido en la app
2. Ve a Firebase Console > Firestore Database
3. Deberías ver el pedido sincronizado

## 🔧 Solución de Problemas

### Error: "Firebase not configured"
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que el archivo `.env.local` esté en la raíz del proyecto
- Reinicia la aplicación completamente

### Error: "Auth domain not allowed"
- Verifica que la URL de tu app esté agregada en Firebase Console > Authentication > Settings > Authorized domains

### Error: "Messaging not supported"
- Para desarrollo local, las push notifications solo funcionan en HTTPS
- En Expo Go, las push notifications están limitadas
- Para testing completo, usa build de desarrollo: `npm run android:build:preview`

## 📊 Funcionalidades de Firebase

Una vez configurado, tendrás:

### ✅ Sincronización Automática
- Pedidos se sincronizan automáticamente entre dispositivos
- Funciona tanto online como offline
- Datos se fusionan inteligentemente

### ✅ Backup en la Nube
- Todos los pedidos respaldados automáticamente
- Configuración sincronizada entre dispositivos
- Recuperación de datos en caso de pérdida

### ✅ Notificaciones Push (Opcional)
- Recordatorios automáticos de pedidos
- Configurables por el usuario
- Funcionan en background

### ✅ Autenticación Segura
- Inicio de sesión anónimo automático
- Datos segregados por usuario
- Privacidad garantizada

## 🎯 Próximos Pasos

1. **Configura Firebase** siguiendo esta guía
2. **Prueba la sincronización** creando algunos pedidos
3. **Verifica el backup** en Firebase Console
4. **Opcional**: Configura push notifications

¡Tu aplicación estará lista para uso multi-dispositivo con backup automático! 🚀📱

## 📞 Soporte

Si tienes problemas:
1. Verifica los logs de la aplicación
2. Revisa Firebase Console por errores
3. Asegúrate de que todas las APIs estén habilitadas
4. Verifica que las variables de entorno sean correctas
