# 🔥 Configuración de Firebase Real

## 📋 **Para Habilitar Firebase y Notificaciones Push**

### **Paso 1: Crear Proyecto en Firebase**
1. Ve a [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Authentication** (Anónima)
4. Habilita **Firestore Database**
5. Habilita **Cloud Messaging**

### **Paso 2: Configurar App Android**
1. En Firebase Console > Project Settings > General
2. Agrega una app Android con:
   - **Package name**: `com.pasteleriacocina.app`
   - **App nickname**: `Pastelería Cocina`
3. Descarga el archivo `google-services.json`

### **Paso 3: Configurar Variables de Entorno**
Crea un archivo `.env.local` en la raíz del proyecto con:

```env
# Firebase Configuration (Production)
EXPO_PUBLIC_FIREBASE_API_KEY=tu-api-key-real
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:android:tu-app-id
EXPO_PUBLIC_FIREBASE_VAPID_KEY=tu-vapid-key

# Project ID para notificaciones push de Expo
EXPO_PUBLIC_PROJECT_ID=tu-expo-project-id
```

### **Paso 4: Configurar Notificaciones Push**
1. En Firebase Console > Project Settings > Cloud Messaging
2. En "Web configuration" genera un **VAPID key**
3. Copia el VAPID key al archivo `.env.local`

### **Paso 5: Configurar Expo Project ID**
1. Ve a [https://expo.dev/](https://expo.dev/)
2. En tu proyecto, copia el **Project ID**
3. Agrégalo al archivo `.env.local`

### **Paso 6: Reiniciar la Aplicación**
```bash
npm start --clear
```

## ✅ **Resultado Esperado**

Con Firebase configurado correctamente:
- ✅ **Sincronización en la nube** funcionando
- ✅ **Notificaciones push** en dispositivos móviles
- ✅ **Backup automático** de datos
- ✅ **Modo offline** sigue funcionando

## 🚨 **Importante**

- **Con valores demo**: Firebase deshabilitado, solo SQLite local
- **Con valores reales**: Firebase habilitado, sincronización completa
- **La app funciona** en ambos casos, pero con valores reales tendrás más funcionalidades

## 📱 **Probar Notificaciones**

1. Instala la app en tu dispositivo
2. Ve a Configuración > Notificaciones
3. Activa las notificaciones
4. Crea un pedido con fecha próxima
5. Deberías recibir notificaciones automáticamente
