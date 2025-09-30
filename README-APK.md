# 📱 Pastelería Cocina - Generar APK

## 🚀 **Generar APK en 3 Pasos Simples**

### **Paso 1: Preparar Cuenta Expo (Gratuita)**
1. Ve a [https://expo.dev](https://expo.dev)
2. Crea una cuenta gratuita
3. En tu terminal, ejecuta:
   ```bash
   npx eas login
   ```

### **Paso 2: Generar APK**
**Opción A: Script Automático (Recomendado)**
```bash
# Windows
build-apk.bat

# Mac/Linux
chmod +x build-apk.sh
./build-apk.sh
```

**Opción B: Comando Manual**
```bash
npx eas build --platform android --profile preview
```

### **Paso 3: Descargar APK**
1. Ve a [https://expo.dev](https://expo.dev)
2. Inicia sesión con tu cuenta
3. Ve a "Builds" → "Android"
4. Descarga el APK generado

---

## 📋 **Requisitos Previos**

### **Sistema:**
- ✅ Node.js 18+ (ya tienes 22.16.0)
- ✅ Cuenta Expo gratuita
- ✅ Conexión a internet

### **No Necesitas:**
- ❌ Android Studio
- ❌ Android SDK
- ❌ Configuración compleja

---

## 🔧 **Comandos Útiles**

### **Desarrollo:**
```bash
npm start                    # Iniciar servidor de desarrollo
npm run android             # Probar en Android (requiere Android Studio)
npm run web                 # Probar en navegador web
```

### **Build:**
```bash
npm run build:android       # Generar APK (preview)
npm run build:android:production  # Generar AAB (producción)
```

### **Mantenimiento:**
```bash
npm install                 # Instalar dependencias
npx expo-doctor            # Verificar configuración
npx expo install --check   # Actualizar dependencias
```

---

## 📱 **Distribución del APK**

### **Instalación en Dispositivos:**
1. **Habilitar fuentes desconocidas** en Android:
   - Configuración → Seguridad → Fuentes desconocidas
2. **Transferir APK** al dispositivo (USB, email, etc.)
3. **Instalar** tocando el archivo APK

### **Distribución Interna:**
- Envía el APK por WhatsApp, email, o Google Drive
- Los usuarios solo necesitan habilitar "Fuentes desconocidas"
- No requiere Google Play Store

---

## 🎯 **Características del APK**

### **Funcionalidades Completas:**
- ✅ Sistema de login multi-rol (Admin, Dueño, Repostero)
- ✅ Gestión completa de pedidos
- ✅ Calendario de entregas
- ✅ Cotizaciones PDF
- ✅ Estadísticas y reportes
- ✅ Notificaciones locales
- ✅ Base de datos SQLite local

### **Optimizaciones:**
- 📱 **Tamaño optimizado** para distribución
- 🚀 **Rendimiento mejorado** para Android
- 🔒 **Seguridad** con autenticación local
- 📊 **Sin dependencias** de internet (modo offline)

---

## 🆘 **Solución de Problemas**

### **Error: "No estás logueado"**
```bash
npx eas login
```

### **Error: "Build failed"**
```bash
npx expo-doctor
npx expo install --check
```

### **Error: "Dependencies conflict"**
```bash
npm install --legacy-peer-deps
```

### **APK no se instala en Android:**
1. Verificar que "Fuentes desconocidas" esté habilitado
2. Verificar que el APK no esté corrupto
3. Intentar con otro dispositivo

---

## 📞 **Soporte**

Si tienes problemas:
1. Revisa los logs en [expo.dev](https://expo.dev)
2. Ejecuta `npx expo-doctor` para diagnóstico
3. Verifica que todas las dependencias estén actualizadas

---

## 🎉 **¡Listo!**

Con estos pasos tendrás tu APK de **Pastelería Cocina** listo para distribuir en minutos. La aplicación está completamente optimizada para Android y lista para uso en producción.

**¡Disfruta tu nueva aplicación móvil!** 🚀📱✨

