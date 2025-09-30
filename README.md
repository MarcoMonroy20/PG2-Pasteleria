# 🍰 Pastelería Cocina App

Una aplicación móvil desarrollada con React Native y Expo para la gestión de pedidos de pastelería.

## 🚀 Características

- **Gestión de Pedidos**: Crear, editar y eliminar pedidos de pastelería
- **Calendario de Entregas**: Visualizar pedidos por fecha
- **Sincronización en Tiempo Real**: Firebase para sincronización entre dispositivos
- **Notificaciones Push**: Recordatorios automáticos de pedidos
- **Soporte Offline**: Funciona sin conexión a internet
- **Roles de Usuario**: Admin, Dueño, Repostero con permisos diferenciados
- **Multiplataforma**: Android, iOS y Web

## 🛠️ Tecnologías

- **React Native** con Expo
- **TypeScript** para tipado estático
- **Firebase** (Firestore, Authentication, Cloud Messaging)
- **SQLite** para almacenamiento local
- **React Navigation** para navegación
- **Expo Notifications** para push notifications

## 📱 Plataformas Soportadas

- ✅ Android (APK disponible)
- ✅ iOS (requiere Apple Developer Account)
- ✅ Web (PWA)

## 🔧 Configuración

### Prerrequisitos

- Node.js 18+
- Expo CLI
- Cuenta de Firebase
- Android Studio (para desarrollo Android)

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/pasteleria-cocina-app.git
   cd pasteleria-cocina-app
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Firebase**
   ```bash
   # Copiar archivo de ejemplo
   cp env.example .env.local
   
   # Editar .env.local con tus credenciales de Firebase
   ```

4. **Configurar Firebase**
   - Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilitar Firestore Database
   - Habilitar Authentication (modo anónimo)
   - Habilitar Cloud Messaging
   - Configurar Firestore Rules

5. **Ejecutar la aplicación**
   ```bash
   # Desarrollo
   npx expo start
   
   # Android
   npx expo start --android
   
   # Web
   npx expo start --web
   ```

## 🔐 Variables de Entorno

Crear archivo `.env.local` con las siguientes variables:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_ENABLED=true
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
EXPO_PUBLIC_FIREBASE_VAPID_KEY=tu_vapid_key
```

## 📦 Compilación

### APK para Android

```bash
# Usando EAS Build
eas build --platform android --profile preview

# Script automatizado
./build-apk-optimized.sh
```

### iOS (requiere Apple Developer Account)

```bash
eas build --platform ios --profile preview
```

## 🏗️ Arquitectura

```
src/
├── app/                    # Pantallas principales (Expo Router)
├── components/             # Componentes reutilizables
├── services/              # Servicios (Firebase, Base de datos)
├── contexts/              # Contextos de React
├── hooks/                 # Custom hooks
├── utils/                 # Utilidades
├── constants/             # Constantes y colores
└── assets/               # Imágenes y recursos
```

## 🔄 Sincronización de Datos

La aplicación utiliza un sistema híbrido:

- **Almacenamiento Local**: SQLite para datos offline
- **Sincronización en Tiempo Real**: Firebase Firestore
- **Conflictos**: Resolución automática por timestamp
- **Modo Offline**: Funcionalidad completa sin internet

## 📋 Roles de Usuario

### 👨‍💼 Admin
- Acceso completo a todas las funciones
- Gestión de usuarios
- Estadísticas y reportes

### 👑 Dueño
- Gestión de pedidos
- Cotizaciones
- Estadísticas

### 👨‍🍳 Repostero
- Visualización de pedidos
- Actualización de estados
- Lista de productos a trabajar

## 🔔 Notificaciones

- **Recordatorios de Entrega**: Notificaciones automáticas
- **Sincronización**: Notificaciones de nuevos pedidos
- **Configuración**: Habilitar/deshabilitar por usuario

## 🛡️ Seguridad

- ✅ Variables de entorno para credenciales
- ✅ Autenticación anónima de Firebase
- ✅ Reglas de Firestore configuradas
- ✅ Validación de entrada de datos
- ✅ Almacenamiento seguro local

## 📚 Documentación

- [Guía de Configuración de Firebase](FIREBASE_SETUP.md)
- [Guía de Sincronización](FIREBASE_SYNC_GUIDE.md)
- [Guía de Notificaciones](NOTIFICATIONS_GUIDE.md)
- [Guía de Seguridad](SECURITY_GUIDE.md)

## 🐛 Solución de Problemas

### Error de Conexión Firebase
```bash
# Verificar configuración
node debug-firebase-connection.js

# Verificar variables de entorno
node debug-env-vars.js
```

### Error de Notificaciones
- Verificar permisos en configuración del dispositivo
- Revisar configuración de Firebase Cloud Messaging
- Ejecutar diagnóstico en la app: Configuración > Diagnósticos

### Error de Sincronización
- Verificar conexión a internet
- Revisar reglas de Firestore
- Verificar índice de Firestore (crear manualmente si es necesario)

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Autores

- **Marco Alejandro Monroy Rousselin** - *Desarrollo inicial* - [GitHub](https://github.com/marcopolo2.0)

## 🙏 Agradecimientos

- Equipo de Expo por la excelente plataforma
- Comunidad de React Native
- Documentación de Firebase

---

**⚠️ Importante**: Nunca subas credenciales de Firebase al repositorio. Usa siempre variables de entorno.
