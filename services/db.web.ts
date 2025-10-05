// Versión web-compatible de la base de datos usando localStorage
// Esta versión se usa cuando la app se ejecuta en el navegador web

// Interfaces para TypeScript
export interface Producto {
  tipo: 'pastel' | 'cupcakes' | 'otros';
  sabor?: string;
  relleno?: string;
  tamaño?: string;
  cantidad?: number;
  esMinicupcake?: boolean;
  descripcion?: string;
}

export interface Pedido {
  id?: number;
  fecha_entrega: string;
  nombre: string;
  precio_final: number;
  monto_abonado: number;
  descripcion?: string;
  imagen?: string;
  productos: Producto[];
}

export interface Sabor {
  id?: number;
  nombre: string;
  tipo: 'pastel' | 'cupcakes';
  activo: boolean;
}

export interface Relleno {
  id?: number;
  nombre: string;
  tipo: 'pastel' | 'cupcakes';
  activo: boolean;
}

export interface AppSettings {
  notifications_enabled: boolean;
  days_before: number;
  notification_days: number[];
  contact_name?: string;
  company_name?: string;
  phone?: string;
}

// Simulación de base de datos usando localStorage
const STORAGE_KEYS = {
  PEDIDOS: 'pasteleria_pedidos',
  SABORES: 'pasteleria_sabores',
  RELLENOS: 'pasteleria_rellenos',
  SETTINGS: 'pasteleria_settings',
  NOTIFICATIONS: 'pasteleria_notifications', // pedido_id -> notification_id
};

let nextId = 1;

// Función para obtener el siguiente ID
const getNextId = (): number => {
  const stored = localStorage.getItem('pasteleria_next_id');
  const id = stored ? parseInt(stored) : 1;
  localStorage.setItem('pasteleria_next_id', (id + 1).toString());
  return id;
};

// Función para inicializar datos por defecto
const initDefaultData = () => {
  // Solo inicializar si no existen datos y Firebase no está habilitado
  const hasFirebaseData = localStorage.getItem('firebase_enabled') === 'true';
  
  // Inicializar sabores vacíos - el usuario los agregará
  if (!localStorage.getItem(STORAGE_KEYS.SABORES)) {
    localStorage.setItem(STORAGE_KEYS.SABORES, JSON.stringify([]));
  }

  // Inicializar rellenos vacíos - el usuario los agregará
  if (!localStorage.getItem(STORAGE_KEYS.RELLENOS)) {
    localStorage.setItem(STORAGE_KEYS.RELLENOS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    const defaultSettings: AppSettings = { 
      notifications_enabled: false, 
      days_before: 0, 
      contact_name: '', 
      company_name: '', 
      phone: '' 
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify({}));
  }
};

export const initDB = (): Promise<void> => {
  return new Promise((resolve) => {
    initDefaultData();
    resolve();
  });
};

// Funciones para Pedidos
export const crearPedido = (pedido: Omit<Pedido, 'id'>): Promise<number> => {
  return new Promise((resolve) => {
    const pedidos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEDIDOS) || '[]');
    const nuevoPedido = { ...pedido, id: getNextId() };
    pedidos.push(nuevoPedido);
    localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(pedidos));
    resolve(nuevoPedido.id!);
  });
};

export const obtenerPedidos = (): Promise<Pedido[]> => {
  return new Promise((resolve) => {
    const pedidos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEDIDOS) || '[]');
    resolve(pedidos.sort((a: Pedido, b: Pedido) => new Date(a.fecha_entrega).getTime() - new Date(b.fecha_entrega).getTime()));
  });
};

export const obtenerPedidoPorId = (id: number): Promise<Pedido | null> => {
  return new Promise((resolve) => {
    const pedidos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEDIDOS) || '[]');
    const pedido = pedidos.find((p: Pedido) => p.id === id);
    resolve(pedido || null);
  });
};

export const actualizarPedido = (id: number, pedido: Omit<Pedido, 'id'>): Promise<void> => {
  return new Promise((resolve) => {
    console.log('📝 db.web.actualizarPedido llamado con ID:', id);
    const pedidos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEDIDOS) || '[]');
    console.log('📝 Pedidos antes de actualizar:', pedidos.length);
    const index = pedidos.findIndex((p: Pedido) => p.id === id);
    console.log('📝 Índice encontrado:', index);
    if (index !== -1) {
      pedidos[index] = { ...pedido, id };
      localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(pedidos));
      console.log('📝 Pedido actualizado en localStorage');
    } else {
      console.log('❌ Pedido no encontrado para actualizar');
    }
    resolve();
  });
};

export const eliminarPedido = (id: number): Promise<void> => {
  return new Promise((resolve) => {
    console.log('🗑️ db.web.eliminarPedido llamado con ID:', id);
    const pedidos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEDIDOS) || '[]');
    console.log('🗑️ Pedidos antes de eliminar:', pedidos.length);
    console.log('🗑️ IDs de pedidos antes:', pedidos.map((p: Pedido) => p.id));
    const filteredPedidos = pedidos.filter((p: Pedido) => {
      console.log(`🗑️ Comparando ${p.id} !== ${id}:`, p.id !== id);
      return p.id !== id;
    });
    console.log('🗑️ Pedidos después de filtrar:', filteredPedidos.length);
    console.log('🗑️ IDs de pedidos después:', filteredPedidos.map((p: Pedido) => p.id));
    localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(filteredPedidos));
    console.log('🗑️ Pedidos guardados en localStorage');
    resolve();
  });
};

export const obtenerPedidosPorFecha = (fechaInicio: string, fechaFin: string): Promise<Pedido[]> => {
  return new Promise((resolve) => {
    const pedidos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEDIDOS) || '[]');
    const filteredPedidos = pedidos.filter((p: Pedido) => 
      p.fecha_entrega >= fechaInicio && p.fecha_entrega <= fechaFin
    );
    resolve(filteredPedidos.sort((a: Pedido, b: Pedido) => new Date(a.fecha_entrega).getTime() - new Date(b.fecha_entrega).getTime()));
  });
};

// Settings
export const obtenerSettings = (): Promise<AppSettings> => {
  return new Promise((resolve) => {
    const defaultSettings = {
      "notifications_enabled": false,
      "days_before": 0,
      "notification_days": [0],
      "contact_name": "",
      "company_name": "",
      "phone": ""
    };
    
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    let settings;
    
    if (stored) {
      try {
        settings = JSON.parse(stored);
        // Asegurar que notification_days existe
        if (!settings.notification_days) {
          settings.notification_days = [0];
        }
      } catch (error) {
        console.log('⚠️ Error parseando settings, usando valores por defecto');
        settings = defaultSettings;
      }
    } else {
      settings = defaultSettings;
    }
    
    resolve(settings);
  });
};

export const guardarSettings = (settings: AppSettings): Promise<void> => {
  return new Promise((resolve) => {
    const clamped = { ...settings, days_before: Math.max(0, Math.min(7, settings.days_before)) };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(clamped));
    resolve();
  });
};

// Notifications mapping
export const getNotificationIdForPedido = (pedidoId: number): Promise<string | null> => {
  return new Promise((resolve) => {
    const map = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '{}');
    resolve(map[String(pedidoId)] ?? null);
  });
};

export const setNotificationIdForPedido = (pedidoId: number, notificationId: string): Promise<void> => {
  return new Promise((resolve) => {
    const map = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '{}');
    map[String(pedidoId)] = notificationId;
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(map));
    resolve();
  });
};

export const clearNotificationForPedido = (pedidoId: number): Promise<void> => {
  return new Promise((resolve) => {
    const map = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '{}');
    delete map[String(pedidoId)];
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(map));
    resolve();
  });
};

// Funciones para Sabores
export const obtenerSabores = (tipo?: 'pastel' | 'cupcakes'): Promise<Sabor[]> => {
  return new Promise((resolve) => {
    const saboresJson = localStorage.getItem(STORAGE_KEYS.SABORES);
    console.log(`🔍 db.web.ts - obtenerSabores: Raw localStorage item for SABORES: ${saboresJson ? saboresJson.substring(0, 100) + '...' : 'null/undefined'}`);
    let sabores = saboresJson ? JSON.parse(saboresJson) : [];
    console.log(`📊 db.web.ts - obtenerSabores: Parsed ${sabores.length} sabores.`);
    console.log(`📊 db.web.ts - obtenerSabores: First 3 sabores:`, sabores.slice(0, 3));
    
    // Ya no filtramos por activo porque eliminamos físicamente
    if (tipo) {
      sabores = sabores.filter((s: Sabor) => s.tipo === tipo);
      console.log(`📊 db.web.ts - obtenerSabores: After filtering by tipo '${tipo}': ${sabores.length} sabores`);
    }
    
    const sortedSabores = sabores.sort((a: Sabor, b: Sabor) => a.nombre.localeCompare(b.nombre));
    console.log(`📊 db.web.ts - obtenerSabores: Returning ${sortedSabores.length} sorted sabores`);
    resolve(sortedSabores);
  });
};

export const crearSabor = (sabor: Omit<Sabor, 'id'>): Promise<number> => {
  return new Promise((resolve) => {
    const sabores = JSON.parse(localStorage.getItem(STORAGE_KEYS.SABORES) || '[]');
    const nuevoSabor = { ...sabor, id: getNextId() };
    sabores.push(nuevoSabor);
    localStorage.setItem(STORAGE_KEYS.SABORES, JSON.stringify(sabores));
    resolve(nuevoSabor.id!);
  });
};

export const actualizarSabor = (id: number, sabor: Omit<Sabor, 'id'>): Promise<void> => {
  return new Promise((resolve) => {
    const sabores = JSON.parse(localStorage.getItem(STORAGE_KEYS.SABORES) || '[]');
    const index = sabores.findIndex((s: Sabor) => s.id === id);
    if (index !== -1) {
      sabores[index] = { ...sabor, id };
      localStorage.setItem(STORAGE_KEYS.SABORES, JSON.stringify(sabores));
    }
    resolve();
  });
};

export const eliminarSabor = (id: number): Promise<void> => {
  return new Promise((resolve) => {
    const sabores = JSON.parse(localStorage.getItem(STORAGE_KEYS.SABORES) || '[]');
    // Eliminación física en lugar de lógica
    const saboresFiltrados = sabores.filter((s: Sabor) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SABORES, JSON.stringify(saboresFiltrados));
    resolve();
  });
};

export const eliminarTodosLosSabores = (): Promise<void> => {
  return new Promise((resolve) => {
    localStorage.setItem(STORAGE_KEYS.SABORES, JSON.stringify([]));
    console.log('Todos los sabores eliminados del localStorage');
    resolve();
  });
};

// Funciones para Rellenos
export const obtenerRellenos = (): Promise<Relleno[]> => {
  return new Promise((resolve) => {
    const rellenosJson = localStorage.getItem(STORAGE_KEYS.RELLENOS);
    console.log(`🔍 db.web.ts - obtenerRellenos: Raw localStorage item for RELLENOS: ${rellenosJson ? rellenosJson.substring(0, 100) + '...' : 'null/undefined'}`);
    const rellenos = rellenosJson ? JSON.parse(rellenosJson) : [];
    console.log(`📊 db.web.ts - obtenerRellenos: Parsed ${rellenos.length} rellenos.`);
    console.log(`📊 db.web.ts - obtenerRellenos: First 3 rellenos:`, rellenos.slice(0, 3));
    
    // Migrar rellenos existentes que no tienen tipo
    const rellenosMigrados = rellenos.map((relleno: any) => ({
      ...relleno,
      tipo: relleno.tipo || 'pastel' // Agregar tipo por defecto si no existe
    }));
    
    // Guardar rellenos migrados si hubo cambios
    if (rellenosMigrados.some((r: any, index: number) => !rellenos[index]?.tipo)) {
      localStorage.setItem(STORAGE_KEYS.RELLENOS, JSON.stringify(rellenosMigrados));
      console.log('🔄 Rellenos migrados automáticamente con campo tipo');
    }
    
    // Ya no filtramos por activo porque eliminamos físicamente
    const sortedRellenos = rellenosMigrados.sort((a: Relleno, b: Relleno) => a.nombre.localeCompare(b.nombre));
    console.log(`📊 db.web.ts - obtenerRellenos: Returning ${sortedRellenos.length} sorted rellenos`);
    resolve(sortedRellenos);
  });
};

export const crearRelleno = (relleno: Omit<Relleno, 'id'>): Promise<number> => {
  return new Promise((resolve) => {
    const rellenos = JSON.parse(localStorage.getItem(STORAGE_KEYS.RELLENOS) || '[]');
    const nuevoRelleno = { ...relleno, id: getNextId() };
    rellenos.push(nuevoRelleno);
    localStorage.setItem(STORAGE_KEYS.RELLENOS, JSON.stringify(rellenos));
    resolve(nuevoRelleno.id!);
  });
};

export const actualizarRelleno = (id: number, relleno: Omit<Relleno, 'id'>): Promise<void> => {
  return new Promise((resolve) => {
    const rellenos = JSON.parse(localStorage.getItem(STORAGE_KEYS.RELLENOS) || '[]');
    const index = rellenos.findIndex((r: Relleno) => r.id === id);
    if (index !== -1) {
      rellenos[index] = { ...relleno, id };
      localStorage.setItem(STORAGE_KEYS.RELLENOS, JSON.stringify(rellenos));
    }
    resolve();
  });
};

export const eliminarRelleno = (id: number): Promise<void> => {
  return new Promise((resolve) => {
    const rellenos = JSON.parse(localStorage.getItem(STORAGE_KEYS.RELLENOS) || '[]');
    // Eliminación física en lugar de lógica
    const rellenosFiltrados = rellenos.filter((r: Relleno) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RELLENOS, JSON.stringify(rellenosFiltrados));
    resolve();
  });
};

export const eliminarTodosLosRellenos = (): Promise<void> => {
  return new Promise((resolve) => {
    localStorage.setItem(STORAGE_KEYS.RELLENOS, JSON.stringify([]));
    console.log('Todos los rellenos eliminados del localStorage');
    resolve();
  });
};

// Export por defecto (compatibilidad)
export default {};
