Pastelería Cocina App — Resumen de Avances
Objetivo
Aplicación móvil interna para la gestión de pedidos en una pastelería. El personal registra, consulta y administra pedidos confirmados con clientes.
Tecnologías: React Native (Expo), SQLite local (futuro: MySQL).

## 📁 Estructura del Proyecto

### Frontend (React Native/Expo)
```
frontend/
├── app/                 # Navegación y pantallas principales
├── components/          # Componentes reutilizables
├── constants/           # Constantes y configuración de colores
├── assets/             # Imágenes, fuentes y recursos
├── screens/            # Pantallas adicionales
├── app.json            # Configuración de Expo
├── tsconfig.json       # Configuración de TypeScript
└── package.json        # Dependencias del frontend
```

### Backend (Servicios y Base de Datos)
```
backend/
├── database/            # Esquemas y configuración de BD
│   └── schema.ts       # Estructura de tablas
├── services/            # Servicios de datos
│   └── db.ts           # Conexión y operaciones de BD
└── package.json         # Dependencias del backend
```

### Beneficios de la Separación:
- **Organización clara**: Frontend y backend separados por responsabilidades
- **Mantenimiento fácil**: Cada parte puede evolucionar independientemente
- **Escalabilidad**: Fácil migración a MySQL y API REST en el futuro
- **Desarrollo en equipo**: Diferentes desarrolladores pueden trabajar en paralelo

## Paleta de Colores Implementada

### Colores Principales:
- **Rosa claro (fondo principal)**: `#FDC8E3` - Fondo general de la aplicación
- **Rosa medio (acentos, botones secundarios)**: `#F28DB2` - Botones secundarios y elementos de acento
- **Rosa fuerte/Fucsia (botones principales)**: `#E75480` - Botón principal "Nuevo Pedido" y elementos destacados
- **Lila suave (fondos de tarjetas)**: `#D6A8E9` - Fondos de tarjetas o menús
- **Morado oscuro (texto, títulos)**: `#5E336F` - Títulos, encabezados y texto principal
- **Blanco**: `#FFFFFF` - Para dar descanso visual y fondos de inputs
- **Negro suave**: `#2C2C2C` - Para texto legible en contraste

### Aplicación en la Interfaz:
- **Fondo general**: Rosa claro `#FDC8E3` (uniforme y menos saturado)
- **Botón "Nuevo Pedido"**: Fucsia `#E75480` con texto blanco (más llamativo)
- **Botones secundarios**: Rosa medio `#F28DB2` con texto morado oscuro
- **Título "Gestión de Pedidos"**: Morado oscuro `#5E336F` para contraste
- **Inputs**: Bordes rosa medio, fondo blanco, texto negro suave
- **Iconos activos**: Morado oscuro para mejor visibilidad

Funcionalidades principales (plan general)
Login simple (solo contraseña).
Pantalla de inicio con 4 botones:
Nuevo Pedido
Ver Próximos Pedidos
Modificar Rellenos y Masas
Configuración (esquina superior derecha)
Navegador inferior (bottom tab):
Inicio
Calendario de pedidos
Notificaciones locales configurables.
Persistencia en SQLite.
Avances hasta ahora
Estructura de carpetas organizada (components, screens, services, database, etc.).
Navegación implementada con react-navigation y tabs.
Pantalla de Login funcional (validación de contraseña local).
Pantalla de Inicio con los 3 botones principales y acceso a Configuración.
Barra de navegación inferior con:
Tab de Inicio
Tab de Calendario (ya creada, muestra mensaje básico)
Pantallas ocultas en la barra: Nuevo Pedido, Próximos Pedidos, Rellenos y Masas, Configuración.
Esquema básico de SQLite preparado para pedidos (por revisar/expandir según necesidades).
Próximos pasos sugeridos
Implementar la pantalla de “Nuevo Pedido” (formulario y guardado en SQLite).
Mejorar la pantalla de Calendario para mostrar pedidos por fecha.
Implementar la pantalla de “Ver Próximos Pedidos” (lista editable).
Pantalla de “Modificar Rellenos y Masas”.
Configuración de notificaciones locales.
Mejorar la experiencia visual y de usuario.

Idea Inicial *Solo para tener un contexto"
(Estoy desarrollando una aplicación móvil **interna** para una pastelería. Esta app está pensada para el personal que gestiona los pedidos confirmados con clientes después de una reunión presencial. La aplicación será construida con **React Native** y la base de datos será **SQLite local** inicialmente, pero en el futuro se migrará a una solución en la nube como MySQL.

### Objetivo de la App:
La app servirá para **registrar, consultar y gestionar** los pedidos programados en la pastelería. No es una app para clientes.

### Funcionalidades principales:

1. **Login simple**:
   - Solo requiere una contraseña (sin usuario).
   
2. **Pantalla de inicio con 4 botones principales**:
   - **Nuevo Pedido** (botón principal y más grande).
   - **Ver Próximos Pedidos** (lista ordenada por fecha) debe incluir un botón pequeño por pedido que permita modificar lo que se ingreso.
   - **Modificar Rellenos y Masas** (pantalla para editar los sabores disponibles).
   - **Navegador inferior con dos botones**:
     - Ver Calendario con pedidos por fecha.
     - Regresar al Inicio.

3. **Nuevo Pedido** debe incluir:
   - Fecha de entrega.
   - Nombre del pedido.
   - Precio final.
   - Monto abonado.
   - Productos: pueden incluir varios de los siguientes en un solo pedido, se pueden agregar varios a un solo pedido:
     - Pastel: sabor, relleno, tamaño.
     - Cupcakes: sabor, relleno, cantidad, 
opción de minicupcakes.
     - Otros productos (galletas, espumillas, trenzas, cakepops, paletas, etc.)
   - Imagen de referencia.
   - Descripción opcional.

4. **Boton de Configuración en la esquina superior derecha**:
   - Opción para configurar recordatorios (notificaciones locales).
   - El usuario puede elegir con cuántos días de anticipación quiere recibir una notificación de entrega próxima.
   - Activar/desactivar notificaciones.
   - Otras recomendadas.

5. **Notificaciones**:
   - Se deben enviar notificaciones locales usando `expo-notifications` a partir de las preferencias del usuario.

6. **Persistencia**:
   - Toda la información se guardará en SQLite usando `expo-sqlite` o `react-native-sqlite-storage`.
   - Los datos deben poder migrarse en el futuro a MySQL.

### Estructura sugerida de carpetas:
/pasteleria-cocina-app
├── /components/
├── /screens/
├── /services/
├── /database/
├── App.js
└── navigation.js

markdown
Copiar
Editar

### ¿Qué necesito que generes ahora?
Comienza por generar:
- La estructura básica del proyecto con navegación (`react-navigation`).
- La pantalla de Login funcional que solo valide una clave local.
- La pantalla de Inicio con los 4 botones mencionados.
- Un esquema básico para guardar pedidos con SQLite.

Trabajaremos el resto en etapas. Todo debe estar optimizado para uso interno, fluido y claro para el usuario.)

""Primer registro"
Estoy desarrollando una aplicación móvil **interna** para una pastelería. Esta app está pensada para el personal que gestiona los pedidos confirmados con clientes después de una reunión presencial. La aplicación será construida con **React Native** y la base de datos será **SQLite local** inicialmente, pero en el futuro se migrará a una solución en la nube como MySQL.

### Objetivo de la App:
La app servirá para **registrar, consultar y gestionar** los pedidos programados en la pastelería. No es una app para clientes.

### Funcionalidades principales:

1. **Login simple**:
   - Solo requiere una contraseña (sin usuario).
   
2. **Pantalla de inicio con 4 botones principales**:
   - **Nuevo Pedido** (botón principal y más grande).
   - **Ver Próximos Pedidos** (lista ordenada por fecha) debe incluir un botón pequeño por pedido que permita modificar lo que se ingreso.
   - **Modificar Rellenos y Masas** (pantalla para editar los sabores disponibles).
   - **Navegador inferior con dos botones**:
     - Ver Calendario con pedidos por fecha.
     - Regresar al Inicio.

3. **Nuevo Pedido** debe incluir:
   - Fecha de entrega.
   - Nombre del pedido.
   - Precio final.
   - Monto abonado.
   - Productos: pueden incluir varios de los siguientes en un solo pedido, se pueden agregar varios a un solo pedido:
     - Pastel: sabor, relleno, tamaño.
     - Cupcakes: sabor, relleno, cantidad, 
opción de minicupcakes.
     - Otros productos (galletas, espumillas, trenzas, cakepops, paletas, etc.)
   - Imagen de referencia.
   - Descripción opcional.

4. **Boton de Configuración en la esquina superior derecha**:
   - Opción para configurar recordatorios (notificaciones locales).
   - El usuario puede elegir con cuántos días de anticipación quiere recibir una notificación de entrega próxima.
   - Activar/desactivar notificaciones.
   - Otras recomendadas.

5. **Notificaciones**:
   - Se deben enviar notificaciones locales usando `expo-notifications` a partir de las preferencias del usuario.

6. **Persistencia**:
   - Toda la información se guardará en SQLite usando `expo-sqlite` o `react-native-sqlite-storage`.
   - Los datos deben poder migrarse en el futuro a MySQL.

### Estructura sugerida de carpetas:
/pasteleria-cocina-app
├── /components/
├── /screens/
├── /services/
├── /database/
├── App.js
└── navigation.js

markdown
Copiar
Editar

### ¿Qué necesito que generes ahora?
Comienza por generar:
- La estructura básica del proyecto con navegación (`react-navigation`).
- La pantalla de Login funcional que solo valide una clave local.
- La pantalla de Inicio con los 4 botones mencionados.
- Un esquema básico para guardar pedidos con SQLite.

Trabajaremos el resto en etapas. Todo debe estar optimizado para uso interno, fluido y claro para el usuario."

