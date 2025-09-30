# 🔥 Checklist de Configuración Firebase - Pastelería Cocina App

## 📋 **VERIFICACIÓN PASO A PASO**

### **🔗 Enlaces Directos a Firebase Console:**
- **Proyecto**: https://console.firebase.google.com/project/pasteleria-cocina-app
- **Firestore**: https://console.firebase.google.com/project/pasteleria-cocina-app/firestore
- **Authentication**: https://console.firebase.google.com/project/pasteleria-cocina-app/authentication
- **Cloud Messaging**: https://console.firebase.google.com/project/pasteleria-cocina-app/messaging

---

## ✅ **CHECKLIST DE CONFIGURACIÓN**

### **1. 🏗️ Proyecto Base**
- [ ] **Proyecto existe**: `pasteleria-cocina-app`
- [ ] **Plan**: Gratuito (Blaze) o Spark
- [ ] **Ubicación**: us-central1 (recomendado)

### **2. 🗄️ Firestore Database**
- [ ] **Base de datos creada**: En modo "test" inicialmente
- [ ] **Ubicación**: us-central1
- [ ] **Reglas de seguridad**:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```

### **3. 🔐 Authentication**
- [ ] **Sign-in method**: "Anonymous" habilitado
- [ ] **Estado**: Activo
- [ ] **Configuración**: Sin restricciones adicionales

### **4. 📱 App Web**
- [ ] **App registrada**: "Pastelería Cocina Web"
- [ ] **App ID**: `1:975279453152:web:08c52d6d8e6ef7e8bbb185`
- [ ] **API Key**: `TU_API_KEY_AQUI`
- [ ] **Dominio autorizado**: `pasteleria-cocina-app.firebaseapp.com`

### **5. 🔔 Cloud Messaging**
- [ ] **Cloud Messaging API**: Habilitada
- [ ] **Web Configuration**: Configurada
- [ ] **VAPID Key**: `BP2oeo3Ljf31gfcY_ZGqT5-CYRboieolYcUUKWaVaXxB1aWgUbalSK6P_k1t7mBdV9Y9y9BIB_fT3dGD64Wbwf0`

### **6. 📊 Estructura de Datos Firestore**
- [ ] **Colección "pedidos"**: Para sincronizar pedidos
- [ ] **Colección "settings"**: Para configuración de usuario
- [ ] **Colección "sabores"**: Para catálogo de sabores
- [ ] **Colección "rellenos"**: Para catálogo de rellenos

---

## 🧪 **PRUEBAS DE VERIFICACIÓN**

### **Prueba 1: Conexión Básica**
1. **Abrir la app** en el dispositivo
2. **Ir a Configuración** → Scroll hasta "Diagnóstico de Firebase"
3. **Ejecutar Diagnóstico** → Debe mostrar "✅ Conectado"
4. **Verificar User ID** → Debe mostrar un ID único

### **Prueba 2: Sincronización de Datos**
1. **Crear un pedido** en la app
2. **Ir a Firebase Console** → Firestore Database
3. **Verificar colección "pedidos"** → Debe aparecer el pedido
4. **Verificar estructura** → Debe tener userId, fecha_entrega, etc.

### **Prueba 3: Sincronización Multi-Dispositivo**
1. **Dispositivo A**: Crear pedido
2. **Dispositivo B**: Ir a "Próximos Pedidos" → Pull to refresh
3. **Verificar**: El pedido aparece en Dispositivo B

---

## 🚨 **PROBLEMAS COMUNES Y SOLUCIONES**

### **Problema: "Permission denied"**
**Solución**:
1. Ir a Firestore → Rules
2. Cambiar reglas a:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true; // Temporal para testing
       }
     }
   }
   ```
3. Publicar reglas
4. Probar sincronización

### **Problema: "App not found"**
**Solución**:
1. Verificar que la app web esté registrada
2. Verificar que el App ID coincida: `1:975279453152:web:08c52d6d8e6ef7e8bbb185`
3. Verificar que la API Key sea correcta

### **Problema: "Authentication failed"**
**Solución**:
1. Ir a Authentication → Sign-in method
2. Habilitar "Anonymous"
3. Guardar configuración
4. Reiniciar la app

### **Problema: "Network error"**
**Solución**:
1. Verificar conexión a internet
2. Verificar que no haya firewall bloqueando Firebase
3. Probar en diferentes redes (WiFi, datos móviles)

---

## 📱 **CONFIGURACIÓN EN LA APP**

### **Variables de Entorno (.env.local)**:
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=TU_API_KEY_AQUI
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=pasteleria-cocina-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=pasteleria-cocina-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=pasteleria-cocina-app.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=975279453152
EXPO_PUBLIC_FIREBASE_APP_ID=1:975279453152:web:08c52d6d8e6ef7e8bbb185
EXPO_PUBLIC_FIREBASE_VAPID_KEY=BP2oeo3Ljf31gfcY_ZGqT5-CYRboieolYcUUKWaVaXxB1aWgUbalSK6P_k1t7mBdV9Y9y9BIB_fT3dGD64Wbwf0
EXPO_PUBLIC_FIREBASE_ENABLED=true
```

### **Verificación en la App**:
1. **Reiniciar la aplicación** después de cambios en .env.local
2. **Usar FirebaseDebugger** para diagnóstico
3. **Verificar logs** en consola para errores

---

## 🎯 **PRÓXIMOS PASOS**

### **Si todo está configurado correctamente**:
1. ✅ **Probar sincronización** entre dispositivos
2. ✅ **Verificar que los pedidos** se guardan en Firestore
3. ✅ **Confirmar que los cambios** se propagan entre dispositivos

### **Si hay problemas**:
1. 🔍 **Usar FirebaseDebugger** para diagnóstico
2. 🔍 **Revisar logs** en consola de la app
3. 🔍 **Verificar configuración** en Firebase Console
4. 🔍 **Probar en diferentes dispositivos/redes**

---

## 📞 **SOPORTE**

### **Recursos de Ayuda**:
- **Firebase Console**: https://console.firebase.google.com/project/pasteleria-cocina-app
- **Documentación Firebase**: https://firebase.google.com/docs
- **Expo Firebase**: https://docs.expo.dev/guides/using-firebase/

### **Logs Importantes**:
- **App**: Buscar emojis 🔍, ✅, ❌ en consola
- **Firebase Console**: Revisar "Usage" y "Errors"
- **Network**: Verificar requests a Firebase en DevTools

---

**¡Con esta configuración, la sincronización debería funcionar perfectamente entre todos los dispositivos!** 🎉🔥
