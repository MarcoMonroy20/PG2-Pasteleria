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
  activo: boolean;
}

export interface AppSettings {
  notifications_enabled: boolean;
  days_before: number;
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
  // Inicializar sabores por defecto
  if (!localStorage.getItem(STORAGE_KEYS.SABORES)) {
    const saboresPorDefecto = [
      { id: 1, nombre: 'Chocolate', tipo: 'pastel' as const, activo: true },
      { id: 2, nombre: 'Vainilla', tipo: 'pastel' as const, activo: true },
      { id: 3, nombre: 'Fresa', tipo: 'pastel' as const, activo: true },
      { id: 4, nombre: 'Limón', tipo: 'pastel' as const, activo: true },
      { id: 5, nombre: 'Chocolate', tipo: 'cupcakes' as const, activo: true },
      { id: 6, nombre: 'Vainilla', tipo: 'cupcakes' as const, activo: true },
      { id: 7, nombre: 'Fresa', tipo: 'cupcakes' as const, activo: true },
      { id: 8, nombre: 'Limón', tipo: 'cupcakes' as const, activo: true },
    ];
    localStorage.setItem(STORAGE_KEYS.SABORES, JSON.stringify(saboresPorDefecto));
  }

  // Inicializar rellenos por defecto
  if (!localStorage.getItem(STORAGE_KEYS.RELLENOS)) {
    const rellenosPorDefecto = [
      { id: 1, nombre: 'Crema de Mantequilla', activo: true },
      { id: 2, nombre: 'Crema de Vainilla', activo: true },
      { id: 3, nombre: 'Mermelada de Fresa', activo: true },
      { id: 4, nombre: 'Mermelada de Durazno', activo: true },
      { id: 5, nombre: 'Dulce de Leche', activo: true },
      { id: 6, nombre: 'Chocolate', activo: true },
      { id: 7, nombre: 'Frutas', activo: true },
      { id: 8, nombre: 'Sin Relleno', activo: true },
    ];
    localStorage.setItem(STORAGE_KEYS.RELLENOS, JSON.stringify(rellenosPorDefecto));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    const defaultSettings: AppSettings = { notifications_enabled: false, days_before: 0 };
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
    const pedidos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEDIDOS) || '[]');
    const index = pedidos.findIndex((p: Pedido) => p.id === id);
    if (index !== -1) {
      pedidos[index] = { ...pedido, id };
      localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(pedidos));
    }
    resolve();
  });
};

export const eliminarPedido = (id: number): Promise<void> => {
  return new Promise((resolve) => {
    console.log('eliminarPedido web - ID recibido:', id);
    const pedidos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEDIDOS) || '[]');
    console.log('Pedidos antes de eliminar:', pedidos.length);
    const filteredPedidos = pedidos.filter((p: Pedido) => p.id !== id);
    console.log('Pedidos después de filtrar:', filteredPedidos.length);
    localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(filteredPedidos));
    console.log('Pedido eliminado exitosamente');
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
    const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{"notifications_enabled":false,"days_before":0}');
    resolve(s);
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
    let sabores = JSON.parse(localStorage.getItem(STORAGE_KEYS.SABORES) || '[]');
    sabores = sabores.filter((s: Sabor) => s.activo);
    if (tipo) {
      sabores = sabores.filter((s: Sabor) => s.tipo === tipo);
    }
    resolve(sabores.sort((a: Sabor, b: Sabor) => a.nombre.localeCompare(b.nombre)));
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
    const index = sabores.findIndex((s: Sabor) => s.id === id);
    if (index !== -1) {
      sabores[index].activo = false;
      localStorage.setItem(STORAGE_KEYS.SABORES, JSON.stringify(sabores));
    }
    resolve();
  });
};

// Funciones para Rellenos
export const obtenerRellenos = (): Promise<Relleno[]> => {
  return new Promise((resolve) => {
    const rellenos = JSON.parse(localStorage.getItem(STORAGE_KEYS.RELLENOS) || '[]');
    const activeRellenos = rellenos.filter((r: Relleno) => r.activo);
    resolve(activeRellenos.sort((a: Relleno, b: Relleno) => a.nombre.localeCompare(b.nombre)));
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
    const index = rellenos.findIndex((r: Relleno) => r.id === id);
    if (index !== -1) {
      rellenos[index].activo = false;
      localStorage.setItem(STORAGE_KEYS.RELLENOS, JSON.stringify(rellenos));
    }
    resolve();
  });
};

// Export por defecto (compatibilidad)
export default {};
