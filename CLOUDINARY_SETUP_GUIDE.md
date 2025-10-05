# 🌟 Guía de Configuración de Cloudinary

## 📋 Resumen
Cloudinary es un servicio de gestión de imágenes en la nube que permite:
- **25 GB de almacenamiento gratuito**
- **25 GB de ancho de banda por mes**
- **25,000 transformaciones por mes**
- **Optimización automática de imágenes**
- **CDN global para carga rápida**

## 🚀 Configuración Paso a Paso

### 1. Crear cuenta en Cloudinary
1. Ve a [https://cloudinary.com/](https://cloudinary.com/)
2. Haz clic en "Sign Up For Free"
3. Completa el formulario de registro
4. Verifica tu email

### 2. Obtener credenciales
1. Inicia sesión en tu dashboard
2. En la página principal verás:
   - **Cloud Name**: `tu-cloud-name`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghijklmnopqrstuvwxyz`

### 3. Crear Upload Preset
1. Ve a **Settings** > **Upload**
2. Haz clic en **Add upload preset**
3. Configura:
   - **Preset name**: `pasteleria-upload`
   - **Signing Mode**: `Unsigned` (para subidas directas)
   - **Folder**: `pasteleria-cocina`
   - **Access Mode**: `Public`
4. Guarda el preset

### 4. Configurar variables de entorno
Crea o actualiza tu archivo `.env.local`:

```env
# Cloudinary Configuration
EXPO_PUBLIC_CLOUDINARY_ENABLED=true
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=pasteleria-upload
EXPO_PUBLIC_CLOUDINARY_API_KEY=123456789012345
EXPO_PUBLIC_CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

### 5. Reiniciar la aplicación
```bash
npm start
```

## 🔧 Funcionamiento del Sistema Híbrido

### 📱 Modo Offline
- Las imágenes se guardan localmente
- Se agregan a la cola de subidas pendientes
- Los pedidos funcionan normalmente

### 🌐 Modo Online
- Las imágenes se suben automáticamente a Cloudinary
- Se obtiene una URL optimizada
- Se mantiene copia local como respaldo

### 🔄 Sincronización Automática
- Cuando se restaura la conexión, se sincronizan las imágenes pendientes
- Las URLs de Cloudinary se actualizan en la base de datos
- Todas las imágenes quedan disponibles en la nube

## 📊 Ventajas del Sistema

### ✅ Para el Usuario
- **Carga más rápida**: Imágenes optimizadas desde CDN
- **Menos espacio local**: Las imágenes se almacenan en la nube
- **Sincronización**: Las imágenes se comparten entre dispositivos
- **Funciona offline**: Puede trabajar sin conexión

### ✅ Para el Desarrollador
- **Plan gratuito generoso**: 25 GB es suficiente para miles de imágenes
- **Optimización automática**: Redimensiona según el dispositivo
- **API simple**: Fácil de integrar
- **Escalable**: Puede crecer con la aplicación

## 🛠️ Configuración Avanzada

### Transformaciones de Imagen
Puedes agregar transformaciones a las URLs:
```
https://res.cloudinary.com/tu-cloud/image/upload/w_300,h_200,c_fill/pasteleria-cocina/pedido_123.jpg
```

### Configuración de Seguridad
Para producción, considera:
- Usar **Signed uploads** para mayor seguridad
- Configurar **Access controls**
- Establecer **Rate limits**

## 🚨 Solución de Problemas

### Error: "Upload failed"
- Verifica que el **Upload Preset** esté configurado como **Unsigned**
- Confirma que las credenciales sean correctas
- Revisa que la imagen no exceda 10 MB

### Error: "Invalid cloud name"
- Verifica el **Cloud Name** en las variables de entorno
- Asegúrate de que no tenga espacios o caracteres especiales

### Las imágenes no se sincronizan
- Verifica la conexión a internet
- Revisa los logs de la consola
- Confirma que `EXPO_PUBLIC_CLOUDINARY_ENABLED=true`

## 📈 Monitoreo y Estadísticas

### Dashboard de Cloudinary
- Ve a **Analytics** para ver estadísticas de uso
- Monitorea el ancho de banda consumido
- Revisa las transformaciones realizadas

### Límites del Plan Gratuito
- **Almacenamiento**: 25 GB
- **Ancho de banda**: 25 GB/mes
- **Transformaciones**: 25,000/mes
- **Subidas**: Ilimitadas

## 🔄 Migración desde Solo Local

Si ya tienes imágenes guardadas localmente:
1. Habilita Cloudinary
2. Las nuevas imágenes se subirán automáticamente
3. Las imágenes existentes permanecerán locales
4. Puedes migrar manualmente si es necesario

## 📞 Soporte

- **Documentación**: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Comunidad**: [https://support.cloudinary.com/](https://support.cloudinary.com/)
- **Status**: [https://status.cloudinary.com/](https://status.cloudinary.com/)

---

## 🎯 Próximos Pasos

1. **Configurar Cloudinary** siguiendo esta guía
2. **Probar la funcionalidad** creando un pedido con imagen
3. **Verificar la sincronización** entre dispositivos
4. **Monitorear el uso** en el dashboard de Cloudinary

¡El sistema híbrido está listo para usar! 🚀
