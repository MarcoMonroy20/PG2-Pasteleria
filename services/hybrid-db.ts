// Hybrid Database Service
// Combines local SQLite/LocalStorage with Firebase sync
// Images stay local, other data syncs with Firebase
// Full offline support with automatic sync when online

import { Platform } from 'react-native';
import { HybridDatabase, FirebaseSync } from './firebase';
import NetworkManager from './network-manager';
import HybridImageService from './image-service';
import { FIREBASE_ENABLED } from '../firebase.config';
// import VisualLogger from '../utils/VisualLogger'; // Removed - no longer needed
import { scheduleMultiplePedidoNotifications } from './notifications';
import { setNotificationIdForPedido, getNotificationIdForPedido } from './db';

// Import existing services based on platform
let dbService: any;
let initDBFn: any;
let obtenerSettingsFn: any;
let guardarSettingsFn: any;
let obtenerSaboresFn: any;
let obtenerRellenosFn: any;
let obtenerPedidosFn: any;
let eliminarTodosLosSaboresFn: any;
let eliminarTodosLosRellenosFn: any;
let crearSaborFn: any;
let crearRellenoFn: any;
let eliminarPedidoFn: any;
let crearPedidoFn: any;
let upsertPedidoWithIdFn: any;

if (Platform.OS === 'web') {
  const dbWeb = require('./db.web');
  dbService = dbWeb;
  initDBFn = dbWeb.initDB;
  obtenerSettingsFn = dbWeb.obtenerSettings;
  guardarSettingsFn = dbWeb.guardarSettings;
  obtenerSaboresFn = dbWeb.obtenerSabores;
  obtenerRellenosFn = dbWeb.obtenerRellenos;
  obtenerPedidosFn = dbWeb.obtenerPedidos;
  eliminarTodosLosSaboresFn = dbWeb.eliminarTodosLosSabores;
  eliminarTodosLosRellenosFn = dbWeb.eliminarTodosLosRellenos;
  crearSaborFn = dbWeb.crearSabor;
  crearRellenoFn = dbWeb.crearRelleno;
  eliminarPedidoFn = dbWeb.eliminarPedido;
  crearPedidoFn = dbWeb.crearPedido;
  upsertPedidoWithIdFn = dbWeb.upsertPedidoWithId;
} else {
  const dbNative = require('./db');
  dbService = dbNative;
  initDBFn = dbNative.initDB;
  obtenerSettingsFn = dbNative.obtenerSettings;
  guardarSettingsFn = dbNative.guardarSettings;
  obtenerSaboresFn = dbNative.obtenerSabores;
  obtenerRellenosFn = dbNative.obtenerRellenos;
  obtenerPedidosFn = dbNative.obtenerPedidos;
  eliminarTodosLosSaboresFn = dbNative.eliminarTodosLosSabores;
  eliminarTodosLosRellenosFn = dbNative.eliminarTodosLosRellenos;
  crearSaborFn = dbNative.crearSabor;
  crearRellenoFn = dbNative.crearRelleno;
  eliminarPedidoFn = dbNative.eliminarPedido;
  crearPedidoFn = dbNative.crearPedido;
  upsertPedidoWithIdFn = dbNative.upsertPedidoWithId;
}

// Interfaces
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
  contact_name?: string;
  company_name?: string;
  phone?: string;
}

// Hybrid Database Class
class HybridDBService {
  private firebaseEnabled = false;

  async initialize(): Promise<void> {
    try {
      // Initialize local database first
      console.log('🔄 Initializing local database...');
      await initDBFn();
      console.log('✅ Local database initialized');

      // Initialize Network Manager for offline detection
      const networkManager = NetworkManager.getInstance();
      console.log('📡 Network Manager initialized');

      // Initialize Firebase for sync only if enabled
      if (FIREBASE_ENABLED) {
        try {
          await FirebaseSync.initialize();
          this.firebaseEnabled = true;
          console.log('✅ Hybrid Database initialized successfully with Firebase');
        } catch (firebaseError) {
          console.error('❌ Firebase initialization failed:', firebaseError);
          this.firebaseEnabled = false;
          console.log('⚠️ Continuing with local database only');
        }
      } else {
        this.firebaseEnabled = false;
        console.log('✅ Local Database initialized (Firebase disabled)');
      }

      console.log(`📊 Estado inicial: ${networkManager.isOnlineStatus() ? 'ONLINE' : 'OFFLINE'}`);
      console.log(`📋 Elementos pendientes: ${networkManager.getPendingSyncCount()}`);
    } catch (error) {
      console.error('❌ Error initializing Hybrid Database:', error);
      console.error(`[ANDROID] Error initializing database: ${error}`);
      // Continue with local database only
      this.firebaseEnabled = false;
    }
  }

  // Image handling - hybrid (Cloudinary + local)
  async getImagePath(pedidoId: number): Promise<string | null> {
    // Try to get from hybrid image service first
    const imageUrl = await HybridImageService.getImageUrl(pedidoId);
    if (imageUrl) {
      return imageUrl;
    }
    
    // Fallback to local database
    return HybridDatabase.getImagePath(pedidoId);
  }

  // Cleanup methods for fixing duplication issues
  async limpiarDatosDuplicados(): Promise<void> {
    try {
      if (__DEV__) console.log('🧹 Iniciando limpieza de datos duplicados...');
      console.log('[ANDROID] Iniciando limpieza de duplicados...');
      
      // Clean duplicate sabores
      const sabores = await obtenerSaboresFn();
      const saboresUnicos = new Map<string, Sabor>();
      for (const sabor of sabores) {
        if (!saboresUnicos.has(sabor.nombre)) {
          saboresUnicos.set(sabor.nombre, sabor);
        }
      }
      
      if (sabores.length !== saboresUnicos.size) {
        if (__DEV__) console.log(`🧹 Eliminando ${sabores.length - saboresUnicos.size} sabores duplicados...`);
        console.log(`[ANDROID] Eliminando ${sabores.length - saboresUnicos.size} sabores duplicados...`);
        await eliminarTodosLosSaboresFn();
        for (const sabor of saboresUnicos.values()) {
          await crearSaborFn(sabor);
        }
      }
      
      // Clean duplicate rellenos
      const rellenos = await obtenerRellenosFn();
      const rellenosUnicos = new Map<string, Relleno>();
      for (const relleno of rellenos) {
        if (!rellenosUnicos.has(relleno.nombre)) {
          rellenosUnicos.set(relleno.nombre, relleno);
        }
      }
      
      if (rellenos.length !== rellenosUnicos.size) {
        if (__DEV__) console.log(`🧹 Eliminando ${rellenos.length - rellenosUnicos.size} rellenos duplicados...`);
        console.log(`[ANDROID] Eliminando ${rellenos.length - rellenosUnicos.size} rellenos duplicados...`);
        await eliminarTodosLosRellenosFn();
        for (const relleno of rellenosUnicos.values()) {
          await crearRellenoFn(relleno);
        }
      }
      
      // Clean duplicate pedidos (by ID only - CONSISTENT WITH REST OF SYSTEM)
      const pedidos = await dbService.obtenerPedidos();
      const pedidosUnicos = new Map<number, Pedido>();
      for (const pedido of pedidos) {
        if (pedido.id) {
          if (!pedidosUnicos.has(pedido.id)) {
            pedidosUnicos.set(pedido.id, pedido);
          }
        }
      }
      
      if (pedidos.length !== pedidosUnicos.size) {
        if (__DEV__) console.log(`🧹 Eliminando ${pedidos.length - pedidosUnicos.size} pedidos duplicados...`);
        console.log(`[ANDROID] Eliminando ${pedidos.length - pedidosUnicos.size} pedidos duplicados...`);
        // Delete all pedidos and recreate unique ones
        for (const pedido of pedidos) {
          if (pedido.id) {
            await dbService.eliminarPedido(pedido.id);
          }
        }
        for (const pedido of pedidosUnicos.values()) {
          await upsertPedidoWithIdFn(pedido);
        }
      }
      
      if (__DEV__) console.log('✅ Limpieza de datos duplicados completada');
      console.log('[ANDROID] Limpieza de duplicados completada');
    } catch (error) {
      console.error('❌ Error en limpieza de duplicados:', error);
      console.error(`[ANDROID] Error en limpieza: ${error}`);
    }
  }

  // Limpia duplicados locales de pedidos por contenido (nombre+fecha+precio)
  private async limpiarDuplicadosPorContenido(): Promise<void> {
    try {
      const pedidos: any[] = await dbService.obtenerPedidos();
      if (!pedidos || pedidos.length <= 1) return;

      const keyFor = (p: any) => `${p.nombre}|${p.fecha_entrega}|${p.precio_final}`;
      const groups = new Map<string, any[]>();
      for (const p of pedidos) {
        const k = keyFor(p);
        const arr = groups.get(k) || [];
        arr.push(p);
        groups.set(k, arr);
      }

      for (const [, arr] of groups.entries()) {
        if (arr.length > 1) {
          // Mantener el de menor id para estabilidad
          arr.sort((a, b) => (a.id ?? Infinity) - (b.id ?? Infinity));
          const toKeep = arr[0];
          const toDelete = arr.slice(1);
          for (const d of toDelete) {
            if (d.id != null) {
              await eliminarPedidoFn(d.id);
            }
          }
          console.warn(`[ANDROID] Duplicados por contenido eliminados: kept ${toKeep.id}, removed ${toDelete.length}`);
        }
      }
    } catch (e) {
      console.warn('⚠️ Error limpiando duplicados por contenido:', e);
    }
  }

  // Cleanup Firebase duplicates (more aggressive cleanup)
  async limpiarDuplicadosFirebase(): Promise<void> {
    try {
      if (!this.firebaseEnabled) {
        console.warn('[ANDROID] Firebase no habilitado, saltando limpieza de Firebase');
        return;
      }

      if (__DEV__) console.log('🧹 Iniciando limpieza de duplicados en Firebase...');
      console.log('[ANDROID] Iniciando limpieza de duplicados en Firebase...');
      
      // Get all data from Firebase
      const [firebaseSabores, firebaseRellenos, firebasePedidos] = await Promise.all([
        HybridDatabase.getAllSabores(),
        HybridDatabase.getAllRellenos(),
        HybridDatabase.getAllPedidos()
      ]);

      if (__DEV__) {
        console.log(`📊 Datos obtenidos de Firebase:`);
        console.log(`  - Sabores: ${firebaseSabores.length}`);
        console.log(`  - Rellenos: ${firebaseRellenos.length}`);
        console.log(`  - Pedidos: ${firebasePedidos.length}`);
      }
      console.log(`[ANDROID] Firebase datos: Sabores=${firebaseSabores.length}, Rellenos=${firebaseRellenos.length}, Pedidos=${firebasePedidos.length}`);

      // Clean Firebase sabores duplicates
      const saboresUnicos = new Map<string, Sabor>();
      for (const sabor of firebaseSabores) {
        if (!saboresUnicos.has(sabor.nombre)) {
          saboresUnicos.set(sabor.nombre, sabor);
        } else {
          if (__DEV__) console.log(`🔍 Sabor duplicado encontrado: ${sabor.nombre}`);
          console.log(`[ANDROID] Sabor duplicado: ${sabor.nombre}`);
        }
      }

      if (__DEV__) {
        console.log(`📊 Análisis de sabores:`);
        console.log(`  - Total en Firebase: ${firebaseSabores.length}`);
        console.log(`  - Únicos por nombre: ${saboresUnicos.size}`);
        console.log(`  - Duplicados detectados: ${firebaseSabores.length - saboresUnicos.size}`);
      }
      console.log(`[ANDROID] Sabores: ${firebaseSabores.length} total, ${saboresUnicos.size} únicos, ${firebaseSabores.length - saboresUnicos.size} duplicados`);

      if (firebaseSabores.length !== saboresUnicos.size) {
        if (__DEV__) console.log(`🧹 Limpiando ${firebaseSabores.length - saboresUnicos.size} sabores duplicados en Firebase...`);
        console.log(`[ANDROID] Limpiando ${firebaseSabores.length - saboresUnicos.size} sabores duplicados en Firebase...`);
        
        // Clear all sabores in Firebase and re-upload unique ones
        await HybridDatabase.clearAllSabores();
        for (const sabor of saboresUnicos.values()) {
          // await HybridDatabase.saveSabor(sabor); // TODO: Implement save method
        }
        console.log(`[ANDROID] ${saboresUnicos.size} sabores únicos re-insertados en Firebase`);
      } else {
        if (__DEV__) console.log(`✅ No hay sabores duplicados en Firebase`);
        console.log(`[ANDROID] No hay sabores duplicados en Firebase`);
      }

      // Clean Firebase rellenos duplicates
      const rellenosUnicos = new Map<string, Relleno>();
      for (const relleno of firebaseRellenos) {
        if (!rellenosUnicos.has(relleno.nombre)) {
          rellenosUnicos.set(relleno.nombre, relleno);
        } else {
          if (__DEV__) console.log(`🔍 Relleno duplicado encontrado: ${relleno.nombre}`);
          console.log(`[ANDROID] Relleno duplicado: ${relleno.nombre}`);
        }
      }

      if (__DEV__) {
        console.log(`📊 Análisis de rellenos:`);
        console.log(`  - Total en Firebase: ${firebaseRellenos.length}`);
        console.log(`  - Únicos por nombre: ${rellenosUnicos.size}`);
        console.log(`  - Duplicados detectados: ${firebaseRellenos.length - rellenosUnicos.size}`);
      }
      console.log(`[ANDROID] Rellenos: ${firebaseRellenos.length} total, ${rellenosUnicos.size} únicos, ${firebaseRellenos.length - rellenosUnicos.size} duplicados`);

      if (firebaseRellenos.length !== rellenosUnicos.size) {
        if (__DEV__) console.log(`🧹 Limpiando ${firebaseRellenos.length - rellenosUnicos.size} rellenos duplicados en Firebase...`);
        console.log(`[ANDROID] Limpiando ${firebaseRellenos.length - rellenosUnicos.size} rellenos duplicados en Firebase...`);
        
        // Clear all rellenos in Firebase and re-upload unique ones
        await HybridDatabase.clearAllRellenos();
        for (const relleno of rellenosUnicos.values()) {
          // await HybridDatabase.saveRelleno(relleno); // TODO: Implement save method
        }
        console.log(`[ANDROID] ${rellenosUnicos.size} rellenos únicos re-insertados en Firebase`);
      } else {
        if (__DEV__) console.log(`✅ No hay rellenos duplicados en Firebase`);
        console.log(`[ANDROID] No hay rellenos duplicados en Firebase`);
      }

      // Clean Firebase pedidos duplicates (by description, date, and client)
      const pedidosUnicos = new Map<string, Pedido>();
      for (const pedido of firebasePedidos) {
        const key = `${pedido.descripcion}_${pedido.fechaEntrega}_${pedido.cliente}`;
        if (!pedidosUnicos.has(key)) {
          pedidosUnicos.set(key, pedido);
        } else {
          if (__DEV__) console.log(`🔍 Pedido duplicado encontrado: ${pedido.descripcion} - ${pedido.cliente}`);
          console.log(`[ANDROID] Pedido duplicado: ${pedido.descripcion} - ${pedido.cliente}`);
        }
      }

      if (__DEV__) {
        console.log(`📊 Análisis de pedidos:`);
        console.log(`  - Total en Firebase: ${firebasePedidos.length}`);
        console.log(`  - Únicos por descripción+fecha+cliente: ${pedidosUnicos.size}`);
        console.log(`  - Duplicados detectados: ${firebasePedidos.length - pedidosUnicos.size}`);
      }
      console.log(`[ANDROID] Pedidos: ${firebasePedidos.length} total, ${pedidosUnicos.size} únicos, ${firebasePedidos.length - pedidosUnicos.size} duplicados`);

      if (firebasePedidos.length !== pedidosUnicos.size) {
        if (__DEV__) console.log(`🧹 Limpiando ${firebasePedidos.length - pedidosUnicos.size} pedidos duplicados en Firebase...`);
        console.log(`[ANDROID] Limpiando ${firebasePedidos.length - pedidosUnicos.size} pedidos duplicados en Firebase...`);
        
        // Clear all pedidos in Firebase and re-upload unique ones
        await HybridDatabase.clearAllPedidos();
        for (const pedido of pedidosUnicos.values()) {
          await HybridDatabase.savePedido(pedido);
        }
        console.log(`[ANDROID] ${pedidosUnicos.size} pedidos únicos re-insertados en Firebase`);
      } else {
        if (__DEV__) console.log(`✅ No hay pedidos duplicados en Firebase`);
        console.log(`[ANDROID] No hay pedidos duplicados en Firebase`);
      }

      if (__DEV__) console.log('✅ Limpieza de duplicados en Firebase completada');
      console.log('[ANDROID] Limpieza de duplicados en Firebase completada');
      
      // Now clean local duplicates too
      await this.limpiarDatosDuplicados();
      
    } catch (error) {
      console.error('❌ Error en limpieza de duplicados de Firebase:', error);
      console.error(`[ANDROID] Error en limpieza de Firebase: ${error}`);
    }
  }

  // Force cleanup - clears everything and re-uploads unique data (for testing)
  async forzarLimpiezaCompleta(): Promise<void> {
    try {
      if (!this.firebaseEnabled) {
        console.warn('[ANDROID] Firebase no habilitado, saltando limpieza forzada');
        return;
      }

      if (__DEV__) console.log('🧹 Iniciando limpieza forzada completa...');
      console.log('[ANDROID] Iniciando limpieza forzada completa...');
      
      // Get all data from Firebase first
      const [firebaseSabores, firebaseRellenos, firebasePedidos] = await Promise.all([
        HybridDatabase.getAllSabores(),
        HybridDatabase.getAllRellenos(),
        HybridDatabase.getAllPedidos()
      ]);

      if (__DEV__) {
        console.log(`📊 Datos a limpiar:`);
        console.log(`  - Sabores: ${firebaseSabores.length}`);
        console.log(`  - Rellenos: ${firebaseRellenos.length}`);
        console.log(`  - Pedidos: ${firebasePedidos.length}`);
      }
      console.log(`[ANDROID] Limpiando: Sabores=${firebaseSabores.length}, Rellenos=${firebaseRellenos.length}, Pedidos=${firebasePedidos.length}`);
      
      // Clear ALL Firebase data
      await Promise.all([
        HybridDatabase.clearAllSabores(),
        HybridDatabase.clearAllRellenos(),
        HybridDatabase.clearAllPedidos()
      ]);
      
      if (__DEV__) console.log('🧹 Todos los datos eliminados de Firebase');
      console.log('[ANDROID] Todos los datos eliminados de Firebase');
      
      // Re-upload only unique data
      const saboresUnicos = new Map<string, Sabor>();
      const rellenosUnicos = new Map<string, Relleno>();
      const pedidosUnicos = new Map<string, Pedido>();
      
      // Deduplicate sabores
      for (const sabor of firebaseSabores) {
        if (!saboresUnicos.has(sabor.nombre)) {
          saboresUnicos.set(sabor.nombre, sabor);
        }
      }
      
      // Deduplicate rellenos
      for (const relleno of firebaseRellenos) {
        if (!rellenosUnicos.has(relleno.nombre)) {
          rellenosUnicos.set(relleno.nombre, relleno);
        }
      }
      
      // Deduplicate pedidos
      for (const pedido of firebasePedidos) {
        const key = `${pedido.descripcion}_${pedido.fechaEntrega}_${pedido.cliente}`;
        if (!pedidosUnicos.has(key)) {
          pedidosUnicos.set(key, pedido);
        }
      }
      
      // Re-upload unique data
        for (const sabor of saboresUnicos.values()) {
          // await HybridDatabase.saveSabor(sabor); // TODO: Implement save method
        }
      
      for (const relleno of rellenosUnicos.values()) {
        // await HybridDatabase.saveRelleno(relleno); // TODO: Implement save method
      }
      
      for (const pedido of pedidosUnicos.values()) {
        await HybridDatabase.savePedido(pedido);
      }
      
      if (__DEV__) {
        console.log(`✅ Datos únicos re-insertados:`);
        console.log(`  - Sabores: ${saboresUnicos.size}`);
        console.log(`  - Rellenos: ${rellenosUnicos.size}`);
        console.log(`  - Pedidos: ${pedidosUnicos.size}`);
      }
      console.log(`[ANDROID] Datos únicos re-insertados: Sabores=${saboresUnicos.size}, Rellenos=${rellenosUnicos.size}, Pedidos=${pedidosUnicos.size}`);
      
      // Clean local data too
      await this.limpiarDatosDuplicados();
      
    } catch (error) {
      console.error('❌ Error en limpieza forzada:', error);
      console.error(`[ANDROID] Error en limpieza forzada: ${error}`);
    }
  }

  // Show detailed Firebase data info (for debugging)
  async mostrarInfoFirebase(): Promise<void> {
    try {
      if (!this.firebaseEnabled) {
        console.warn('[ANDROID] Firebase no habilitado');
        return;
      }

      if (__DEV__) console.log('📊 Obteniendo información detallada de Firebase...');
      console.log('[ANDROID] Obteniendo información detallada de Firebase...');
      
      // Get all data from Firebase
      const [firebaseSabores, firebaseRellenos, firebasePedidos] = await Promise.all([
        HybridDatabase.getAllSabores(),
        HybridDatabase.getAllRellenos(),
        HybridDatabase.getAllPedidos()
      ]);

      // Show sabores details
      if (__DEV__) {
        console.log(`📊 SABORES (${firebaseSabores.length}):`);
        firebaseSabores.forEach((sabor, index) => {
          console.log(`  ${index + 1}. ${sabor.nombre} (ID: ${sabor.id}, Tipo: ${sabor.tipo})`);
        });
      }
      console.log(`[ANDROID] SABORES: ${firebaseSabores.map(s => s.nombre).join(', ')}`);

      // Show rellenos details
      if (__DEV__) {
        console.log(`📊 RELLENOS (${firebaseRellenos.length}):`);
        firebaseRellenos.forEach((relleno, index) => {
          console.log(`  ${index + 1}. ${relleno.nombre} (ID: ${relleno.id})`);
        });
      }
      console.log(`[ANDROID] RELLENOS: ${firebaseRellenos.map(r => r.nombre).join(', ')}`);

      // Show pedidos details
      if (__DEV__) {
        console.log(`📊 PEDIDOS (${firebasePedidos.length}):`);
        firebasePedidos.forEach((pedido, index) => {
          console.log(`  ${index + 1}. ${pedido.descripcion} - ${pedido.cliente} (ID: ${pedido.id}, Fecha: ${pedido.fechaEntrega})`);
        });
      }
      console.log(`[ANDROID] PEDIDOS: ${firebasePedidos.map(p => `${p.descripcion}-${p.cliente}`).join(', ')}`);

      // Check for duplicates
      const saboresNombres = firebaseSabores.map(s => s.nombre);
      const rellenosNombres = firebaseRellenos.map(r => r.nombre);
      const pedidosKeys = firebasePedidos.map(p => `${p.descripcion}_${p.fechaEntrega}_${p.cliente}`);

      const saboresDuplicados = saboresNombres.length !== new Set(saboresNombres).size;
      const rellenosDuplicados = rellenosNombres.length !== new Set(rellenosNombres).size;
      const pedidosDuplicados = pedidosKeys.length !== new Set(pedidosKeys).size;

      if (__DEV__) {
        console.log(`🔍 ANÁLISIS DE DUPLICADOS:`);
        console.log(`  - Sabores duplicados: ${saboresDuplicados}`);
        console.log(`  - Rellenos duplicados: ${rellenosDuplicados}`);
        console.log(`  - Pedidos duplicados: ${pedidosDuplicados}`);
      }
      console.log(`[ANDROID] Duplicados: Sabores=${saboresDuplicados}, Rellenos=${rellenosDuplicados}, Pedidos=${pedidosDuplicados}`);
      
    } catch (error) {
      console.error('❌ Error obteniendo información de Firebase:', error);
      console.error(`[ANDROID] Error obteniendo info: ${error}`);
    }
  }

  // Emergency function to clean up massive duplication in local database
  async limpiarDuplicadosMasivos(): Promise<void> {
    try {
      if (__DEV__) console.log('🚨 Iniciando limpieza de duplicados masivos...');
      console.warn('[ANDROID] Iniciando limpieza de duplicados masivos...');
      
      // Get all local data
      const [sabores, rellenos, pedidos] = await Promise.all([
        obtenerSaboresFn(),
        obtenerRellenosFn(),
        dbService.obtenerPedidos()
      ]);

      if (__DEV__) {
        console.log(`📊 Datos locales actuales:`);
        console.log(`  - Sabores: ${sabores.length}`);
        console.log(`  - Rellenos: ${rellenos.length}`);
        console.log(`  - Pedidos: ${pedidos.length}`);
      }
      console.log(`[ANDROID] Datos locales: Sabores=${sabores.length}, Rellenos=${rellenos.length}, Pedidos=${pedidos.length}`);

      // Clean sabores duplicates
      const saboresUnicos = new Map<string, Sabor>();
      for (const sabor of sabores) {
        if (!saboresUnicos.has(sabor.nombre)) {
          saboresUnicos.set(sabor.nombre, sabor);
        }
      }

      // Clean rellenos duplicates
      const rellenosUnicos = new Map<string, Relleno>();
      for (const relleno of rellenos) {
        if (!rellenosUnicos.has(relleno.nombre)) {
          rellenosUnicos.set(relleno.nombre, relleno);
        }
      }

      // Clean pedidos duplicates (by ID only - CONSISTENT WITH REST OF SYSTEM)
      const pedidosUnicos = new Map<number, Pedido>();
      for (const pedido of pedidos) {
        if (pedido.id) {
          if (!pedidosUnicos.has(pedido.id)) {
            pedidosUnicos.set(pedido.id, pedido);
          }
        }
      }

      if (__DEV__) {
        console.log(`🧹 Duplicados encontrados:`);
        console.log(`  - Sabores: ${sabores.length} → ${saboresUnicos.size} (eliminando ${sabores.length - saboresUnicos.size})`);
        console.log(`  - Rellenos: ${rellenos.length} → ${rellenosUnicos.size} (eliminando ${rellenos.length - rellenosUnicos.size})`);
        console.log(`  - Pedidos: ${pedidos.length} → ${pedidosUnicos.size} (eliminando ${pedidos.length - pedidosUnicos.size})`);
      }
      console.warn(`[ANDROID] Eliminando: Sabores=${sabores.length - saboresUnicos.size}, Rellenos=${rellenos.length - rellenosUnicos.size}, Pedidos=${pedidos.length - pedidosUnicos.size}`);

      // Clear and recreate sabores
      await eliminarTodosLosSaboresFn();
      for (const sabor of saboresUnicos.values()) {
        await crearSaborFn(sabor);
      }

      // Clear and recreate rellenos
      await eliminarTodosLosRellenosFn();
      for (const relleno of rellenosUnicos.values()) {
        await crearRellenoFn(relleno);
      }

      // Clear and recreate pedidos
      for (const pedido of pedidos) {
        if (pedido.id) {
          await dbService.eliminarPedido(pedido.id);
        }
      }
      for (const pedido of pedidosUnicos.values()) {
        await upsertPedidoWithIdFn(pedido);
      }

      if (__DEV__) console.log('✅ Limpieza de duplicados masivos completada');
      console.log('[ANDROID] Limpieza de duplicados masivos completada');
      
    } catch (error) {
      console.error('❌ Error en limpieza de duplicados masivos:', error);
      console.error(`[ANDROID] Error en limpieza masiva: ${error}`);
    }
  }

  // 🛡️ SEPARATE SYNC FUNCTIONS FOR DIFFERENT DATA TYPES
  
  // Sync sabores with FLEXIBLE duplicates (nombre + tipo)
  private async syncSaboresWithFlexibleDuplicates(localSabores: any[], firebaseSabores: any[]): Promise<any[]> {
    const saboresMap = new Map();
    
    // Add local sabores first
    localSabores.forEach(sabor => {
      const key = `${sabor.nombre}-${sabor.tipo || 'todos'}`;
      saboresMap.set(key, sabor);
    });
    
    // Add Firebase sabores only if not duplicate (FLEXIBLE)
    let firebaseAdded = 0;
    firebaseSabores.forEach(sabor => {
      const key = `${sabor.nombre}-${sabor.tipo || 'todos'}`;
      if (!saboresMap.has(key)) {
        saboresMap.set(key, sabor);
        firebaseAdded++;
      }
    });
    
    if (__DEV__) console.log(`Sabores únicos agregados desde Firebase: ${firebaseAdded}`);
    return Array.from(saboresMap.values());
  }

  // Sync rellenos with FLEXIBLE duplicates (nombre + tipo)
  private async syncRellenosWithFlexibleDuplicates(localRellenos: any[], firebaseRellenos: any[]): Promise<any[]> {
    const rellenosMap = new Map();
    
    // Add local rellenos first
    localRellenos.forEach(relleno => {
      const key = `${relleno.nombre}-${relleno.tipo || 'todos'}`;
      rellenosMap.set(key, relleno);
    });
    
    // Add Firebase rellenos only if not duplicate (FLEXIBLE)
    let firebaseAdded = 0;
    firebaseRellenos.forEach(relleno => {
      const key = `${relleno.nombre}-${relleno.tipo || 'todos'}`;
      if (!rellenosMap.has(key)) {
        rellenosMap.set(key, relleno);
        firebaseAdded++;
      }
    });
    
    if (__DEV__) console.log(`Rellenos únicos agregados desde Firebase: ${firebaseAdded}`);
    return Array.from(rellenosMap.values());
  }

  // 🛡️ Limpiar duplicados locales antes de sincronizar
  private async limpiarDuplicadosLocales(): Promise<void> {
    try {
      const todosLosPedidos = await dbService.obtenerPedidos();
      const pedidosUnicos = new Map();
      
      // Identificar duplicados por ID
      const duplicados = [];
      for (const pedido of todosLosPedidos) {
        if (pedido.id) {
          if (pedidosUnicos.has(pedido.id)) {
            duplicados.push(pedido.id);
          } else {
            pedidosUnicos.set(pedido.id, pedido);
          }
        }
      }
      
      // Eliminar duplicados
      if (duplicados.length > 0) {
        for (const id of duplicados) {
          await eliminarPedidoFn(id);
        }
      }
    } catch (error) {
      console.error('❌ Error limpiando duplicados locales:', error);
    }
  }

  // Sync pedidos with STRICT duplicates (by ID only)
  private async syncPedidosWithStrictDuplicates(localPedidos: any[], firebasePedidos: any[]): Promise<any[]> {
    const pedidosMap = new Map();
    
    // Add local pedidos first (STRICT BY ID)
    localPedidos.forEach(pedido => {
      if (pedido.id) {
        pedidosMap.set(pedido.id, pedido);
      }
    });
    
    // Add Firebase pedidos only if not duplicate (STRICT BY ID). Si algún
    // remoto no tiene id válido, generamos clave de contenido para evitar
    // repetir el mismo pedido con distintos ids.
    let firebaseAdded = 0;
    const contentKey = (p: any) => `${p.nombre}|${p.fecha_entrega}|${p.precio_final}`;
    const contentKeys = new Set(Array.from(pedidosMap.values()).map(contentKey));
    firebasePedidos.forEach(pedido => {
      if (pedido.id && !pedidosMap.has(pedido.id)) {
        pedidosMap.set(pedido.id, pedido);
        firebaseAdded++;
        contentKeys.add(contentKey(pedido));
      } else if (!pedido.id) {
        const key = contentKey(pedido);
        if (!contentKeys.has(key)) {
          // Guardamos con clave compuesta para no perderlo visualmente, el
          // upsert local lo normaliza por id cuando exista.
          pedidosMap.set(key, pedido);
          contentKeys.add(key);
          firebaseAdded++;
        }
      }
    });
    
    if (__DEV__) console.log(`Pedidos únicos agregados desde Firebase: ${firebaseAdded}`);
    return Array.from(pedidosMap.values());
  }

  // Emergency function to completely clear all local pedidos
  async eliminarTodosLosPedidos(): Promise<void> {
    try {
      if (__DEV__) console.log('🚨 Eliminando TODOS los pedidos locales...');
      console.warn('[ANDROID] Eliminando TODOS los pedidos locales...');
      
      // Get all pedidos
      const pedidos = await dbService.obtenerPedidos();
      
      if (__DEV__) {
        console.log(`📊 Pedidos a eliminar: ${pedidos.length}`);
      }
      console.warn(`[ANDROID] Eliminando ${pedidos.length} pedidos locales`);
      
      // Delete all pedidos
      for (const pedido of pedidos) {
        if (pedido.id) {
          await dbService.eliminarPedido(pedido.id);
        }
      }
      
      if (__DEV__) console.log('✅ Todos los pedidos eliminados localmente');
      console.log('[ANDROID] Todos los pedidos eliminados localmente');
      
    } catch (error) {
      console.error('❌ Error eliminando todos los pedidos:', error);
      console.error(`[ANDROID] Error eliminando pedidos: ${error}`);
    }
  }

  async saveImageReference(pedidoId: number, imagePath: string): Promise<void> {
    // Save using hybrid image service (Cloudinary + local)
    await HybridImageService.saveImageReference(pedidoId, imagePath);
    console.log(`💾 Image reference saved for pedido ${pedidoId}: ${imagePath}`);
  }

  async deleteImageReference(pedidoId: number): Promise<void> {
    // Delete using hybrid image service (including Cloudinary deletion)
    await HybridImageService.deleteImageReference(pedidoId, true);
    console.log(`🗑️ Image reference deleted for pedido ${pedidoId}`);
  }

  // Pedido operations with hybrid storage
  async crearPedido(pedido: Omit<Pedido, 'id'>): Promise<number> {
    try {
      // Create in local database first (always works offline)
      const pedidoId = await dbService.crearPedido(pedido);

      // Save image using hybrid service if exists
      if (pedido.imagen) {
        await this.saveImageReference(pedidoId, pedido.imagen);
      }

      // Sync to Firebase if enabled and online (WITH DUPLICATION PROTECTION)
      if (this.firebaseEnabled) {
        const networkManager = NetworkManager.getInstance();

        if (networkManager.isOnlineStatus()) {
          // Online: sync immediately with protection
          try {
            console.log('🔄 Intentando sincronizar pedido con Firebase (con protección)...');
            const pedidoWithId = { ...pedido, id: pedidoId };
            
            // 🛡️ PROTECTION: Check if pedido already exists in Firebase (STRICT BY ID)
            const existingPedidos = await FirebaseSync.getPedidosFromFirebase();
            const isDuplicate = existingPedidos.some(existing => 
              existing.id === pedidoWithId.id
            );
            
            if (isDuplicate) {
              console.log('⚠️ Pedido duplicado detectado, saltando sincronización');
              console.warn(`[ANDROID] Pedido duplicado detectado: ${pedidoWithId.nombre} - ${pedidoWithId.fecha_entrega}`);
            } else {
              await HybridDatabase.savePedido(pedidoWithId);
              console.log('✅ Pedido sincronizado con Firebase (sin duplicados)');
              console.log(`[ANDROID] Pedido sincronizado: ${pedidoWithId.nombre}`);
            }
          } catch (syncError) {
            console.warn('⚠️ Error sincronizando pedido, agregando a cola:', syncError);
            // Add to sync queue for later
            networkManager.addToSyncQueue({
              operation: 'CREATE',
              collection: 'pedidos',
              data: { ...pedido, id: pedidoId }
            });
          }
        } else {
          // Offline: add to sync queue
          console.log('📱 Sin conexión, agregando pedido a cola de sincronización');
          networkManager.addToSyncQueue({
            operation: 'CREATE',
            collection: 'pedidos',
            data: { ...pedido, id: pedidoId }
          });
        }
      }

      return pedidoId;
    } catch (error) {
      console.error('❌ Error creating pedido:', error);
      throw error;
    }
  }

  async obtenerPedidos(): Promise<Pedido[]> {
    try {
      let pedidos: Pedido[];

      // 🛡️ CLEANUP: Limpiar duplicados por contenido e ID antes de sincronizar
      await this.limpiarDuplicadosPorContenido();
      await this.limpiarDuplicadosLocales();

      // 🛡️ Firebase sync REACTIVATED with duplication protection
      if (this.firebaseEnabled) {
        try {
          // Limpieza de duplicados remotos antes de leer
          try {
            await FirebaseSync.cleanupRemotePedidoDuplicates();
          } catch {}
          // Obtener datos ya limpiados desde Firebase
          const firebasePedidos = await FirebaseSync.getPedidosFromFirebase();
          
          // Get local data
          const localPedidos = await dbService.obtenerPedidos();
          
          // 🛡️ PROTECTION: Merge without duplicates
          const pedidosMap = new Map();
          
          // 🛡️ SYNC PEDIDOS WITH STRICT DUPLICATES (by ID only)
          pedidos = await this.syncPedidosWithStrictDuplicates(localPedidos, firebasePedidos);
          
          // Save merged data to local storage for offline access (SAFE METHOD)
          if (pedidos.length > localPedidos.length) {
            // Identificar pedidos nuevos desde Firebase
            const pedidosNuevos = pedidos.filter(pedido => 
              !localPedidos.some((local: any) => local.id === pedido.id)
            );
            
          // 🛡️ SAFE METHOD: Upsert por ID para evitar duplicación
            for (const pedido of pedidosNuevos) {
              try {
                await upsertPedidoWithIdFn(pedido);
              } catch (createError) {
                console.error(`❌ Error creando pedido ${pedido.id}:`, createError);
              }
            }
            
            // 🔔 Programar notificaciones para pedidos nuevos desde Firebase
            if (pedidosNuevos.length > 0) {
              await this.programarNotificacionesParaPedidosSincronizados(pedidosNuevos);
            }
          }
          
        } catch (syncError) {
          if (__DEV__) console.warn('⚠️ Error sincronizando con Firebase, usando datos locales:', syncError);
          console.warn(`[ANDROID] Error sincronizando pedidos: ${syncError}`);
          // Fallback to local data
          pedidos = await dbService.obtenerPedidos();
        }
      } else {
        // Firebase disabled, use local data only
        if (__DEV__) console.log('🚨 Firebase deshabilitado, usando solo datos locales...');
        pedidos = await dbService.obtenerPedidos();
      }
      
      if (__DEV__) console.log(`Pedidos finales: ${pedidos.length}`);

      // Update image URLs with Cloudinary URLs if available
      for (const pedido of pedidos) {
        if (pedido.id) {
          const imageUrl = await HybridImageService.getImageUrl(pedido.id);
          if (imageUrl) {
            pedido.imagen = imageUrl;
          }
        }
      }

      return pedidos;
    } catch (error) {
      console.error('Error getting pedidos:', error);
      // Fall back to local database
      const pedidos = await dbService.obtenerPedidos();
      
      // Update image URLs with Cloudinary URLs if available
      for (const pedido of pedidos) {
        if (pedido.id) {
          try {
            const imageUrl = await HybridImageService.getImageUrl(pedido.id);
            if (imageUrl) {
              pedido.imagen = imageUrl;
            }
          } catch (imageError) {
            console.warn(`Error getting image for pedido ${pedido.id}:`, imageError);
          }
        }
      }
      
      return pedidos;
    }
  }

  async obtenerPedidoPorId(id: number): Promise<Pedido | null> {
    try {
      let pedido: Pedido | null = null;

      if (this.firebaseEnabled) {
        // Try Firebase first
        pedido = await HybridDatabase.getPedido(id);
      }

      // Fall back to local if not found in Firebase
      if (!pedido) {
        pedido = await dbService.obtenerPedidoPorId(id);
      }

      // Update image URL with Cloudinary URL if available
      if (pedido) {
        try {
          const imageUrl = await HybridImageService.getImageUrl(id);
          if (imageUrl) {
            pedido.imagen = imageUrl;
          }
        } catch (imageError) {
          console.warn(`Error getting image for pedido ${id}:`, imageError);
        }
      }

      return pedido;
    } catch (error) {
      console.error('Error getting pedido by ID:', error);
      // Fall back to local database
      const pedido = await dbService.obtenerPedidoPorId(id);
      
      // Update image URL with Cloudinary URL if available
      if (pedido) {
        try {
          const imageUrl = await HybridImageService.getImageUrl(id);
          if (imageUrl) {
            pedido.imagen = imageUrl;
          }
        } catch (imageError) {
          console.warn(`Error getting image for pedido ${id}:`, imageError);
        }
      }
      
      return pedido;
    }
  }

  async actualizarPedido(id: number, pedido: Omit<Pedido, 'id'>): Promise<void> {
    console.log('📝 hybridDB.actualizarPedido llamado con ID:', id);
    try {
      // Update local database first (always works offline)
      console.log('📝 Actualizando en dbService...');
      await dbService.actualizarPedido(id, pedido);
      console.log('📝 Pedido actualizado en dbService');

      // Save image using hybrid service if exists
      if (pedido.imagen) {
        console.log('📝 Guardando referencia de imagen...');
        await this.saveImageReference(id, pedido.imagen);
      }

      // Sync to Firebase if enabled (WITH DUPLICATION PROTECTION)
      if (this.firebaseEnabled) {
        try {
          console.log('📝 Actualizando en Firebase (con protección)...');
          await FirebaseSync.updatePedido(id, pedido);
          console.log('📝 Pedido actualizado en Firebase');
          console.log(`[ANDROID] Pedido actualizado en Firebase: ID ${id}`);
        } catch (firebaseError) {
          console.error('❌ Error actualizando en Firebase:', firebaseError);
          console.warn(`[ANDROID] Error actualizando en Firebase: ${firebaseError}`);
          // Don't throw error, local update was successful
        }
      }

      console.log('📝 Actualización completada exitosamente');
    } catch (error) {
      console.error('❌ Error updating pedido:', error);
      throw error;
    }
  }

  async eliminarPedido(id: number): Promise<void> {
    console.log('🗑️ hybridDB.eliminarPedido llamado con ID:', id);
    try {
      // Delete from local database first
      console.log('🗑️ Llamando a dbService.eliminarPedido...');
      await dbService.eliminarPedido(id);
      console.log('🗑️ Pedido eliminado de dbService');

      // Delete image reference using hybrid service
      console.log('🗑️ Eliminando referencia de imagen...');
      await this.deleteImageReference(id);
      console.log('🗑️ Referencia de imagen eliminada');

      // Delete from Firebase if enabled (WITH DUPLICATION PROTECTION)
      if (this.firebaseEnabled) {
        try {
          console.log('🗑️ Eliminando de Firebase (con protección)...');
          await FirebaseSync.deletePedido(id);
          console.log('🗑️ Pedido eliminado de Firebase');
          console.log(`[ANDROID] Pedido eliminado de Firebase: ID ${id}`);
        } catch (firebaseError) {
          console.error('❌ Error eliminando de Firebase:', firebaseError);
          console.warn(`[ANDROID] Error eliminando de Firebase: ${firebaseError}`);
          // Don't throw error, local deletion was successful
        }
      }

      console.log('🗑️ Eliminación completada exitosamente');
    } catch (error) {
      console.error('❌ Error deleting pedido:', error);
      throw error;
    }
  }

  async obtenerPedidosPorFecha(fechaInicio: string, fechaFin: string): Promise<Pedido[]> {
    try {
      // 🛡️ USAR obtenerPedidos() CON PROTECCIONES ANTI-DUPLICACIÓN Y LUEGO FILTRAR
      console.log(`📅 Obteniendo pedidos por fecha: ${fechaInicio} a ${fechaFin}`);
      
      // Obtener todos los pedidos con protecciones anti-duplicación
      const todosLosPedidos = await this.obtenerPedidos();
      
      // Filtrar por fecha
      const pedidosFiltrados = todosLosPedidos.filter(pedido => {
        const fechaEntrega = pedido.fecha_entrega;
        return fechaEntrega >= fechaInicio && fechaEntrega <= fechaFin;
      });
      
      console.log(`📅 Pedidos filtrados por fecha: ${pedidosFiltrados.length} de ${todosLosPedidos.length} total`);
      
      // Update image URLs with Cloudinary URLs if available
      for (const pedido of pedidosFiltrados) {
        if (pedido.id) {
          try {
            const imageUrl = await HybridImageService.getImageUrl(pedido.id);
            if (imageUrl) {
              pedido.imagen = imageUrl;
            }
          } catch (imageError) {
            console.warn(`Error getting image for pedido ${pedido.id}:`, imageError);
          }
        }
      }

      return pedidosFiltrados;
    } catch (error) {
      console.error('Error getting pedidos by date:', error);
      
      // Fallback: usar método directo sin protecciones (solo en caso de error)
      const pedidos = await dbService.obtenerPedidosPorFecha(fechaInicio, fechaFin);
      
      // Update image URLs with Cloudinary URLs if available
      for (const pedido of pedidos) {
        if (pedido.id) {
          try {
            const imageUrl = await HybridImageService.getImageUrl(pedido.id);
            if (imageUrl) {
              pedido.imagen = imageUrl;
            }
          } catch (imageError) {
            console.warn(`Error getting image for pedido ${pedido.id}:`, imageError);
          }
        }
      }
      
      return pedidos;
    }
  }

  // Settings operations
  async obtenerSettings(): Promise<AppSettings> {
    try {
      if (this.firebaseEnabled) {
        const firebaseSettings = await HybridDatabase.getSettings();
        if (firebaseSettings) {
          return firebaseSettings;
        }
      }

      // Fall back to local settings
      return await obtenerSettingsFn();
    } catch (error) {
      console.error('Error getting settings:', error);
      return await obtenerSettingsFn();
    }
  }

  async guardarSettings(settings: AppSettings): Promise<void> {
    try {
      // Save to local database first (always works offline)
      await guardarSettingsFn(settings);

      // Sync to Firebase if enabled and online
      if (this.firebaseEnabled) {
        const networkManager = NetworkManager.getInstance();

        if (networkManager.isOnlineStatus()) {
          // Online: sync immediately
          try {
            await HybridDatabase.saveSettings(settings);
            console.log('✅ Configuración sincronizada inmediatamente');
          } catch (syncError) {
            console.warn('⚠️ Error sincronizando configuración, agregando a cola:', syncError);
            networkManager.addToSyncQueue({
              operation: 'UPDATE',
              collection: 'settings',
              data: settings
            });
          }
        } else {
          // Offline: add to sync queue
          console.log('📱 Sin conexión, configuración guardada localmente y agregada a cola');
          networkManager.addToSyncQueue({
            operation: 'UPDATE',
            collection: 'settings',
            data: settings
          });
        }
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      throw error;
    }
  }

  // Sabores operations
  async obtenerSabores(tipo?: 'pastel' | 'cupcakes'): Promise<Sabor[]> {
    try {
      let sabores: Sabor[];

      if (__DEV__) {
        console.log(`obtenerSabores() - Firebase enabled: ${this.firebaseEnabled}`);
      }
      
      // 🛡️ Firebase sync REACTIVATED with duplication protection
      if (this.firebaseEnabled) {
        try {
          if (__DEV__) console.log('🔄 Sincronizando sabores desde Firebase (con protección)...');
          
          // Get data from Firebase with protection
          const firebaseSabores = await FirebaseSync.getSaboresFromFirebase();
          if (__DEV__) console.log(`Sabores desde Firebase: ${firebaseSabores.length}`);
          
          // Get local data
          const localSabores = await obtenerSaboresFn(tipo);
          if (__DEV__) console.log(`Sabores desde local: ${localSabores.length}`);
          
          // 🛡️ SYNC SABORES WITH FLEXIBLE DUPLICATES (nombre + tipo)
          sabores = await this.syncSaboresWithFlexibleDuplicates(localSabores, firebaseSabores);
          
          // Save merged data to local storage for offline access
          if (sabores.length > localSabores.length) {
            if (__DEV__) console.log('💾 Guardando sabores fusionados localmente...');
            // Clear local and re-insert merged data
            await eliminarTodosLosSaboresFn();
            for (const sabor of sabores) {
              await crearSaborFn(sabor);
            }
            if (__DEV__) console.log('✅ Sabores fusionados guardados localmente');
          }
          
        } catch (syncError) {
          if (__DEV__) console.warn('⚠️ Error sincronizando sabores con Firebase, usando datos locales:', syncError);
          console.warn(`[ANDROID] Error sincronizando sabores: ${syncError}`);
          // Fallback to local data
          sabores = await obtenerSaboresFn(tipo);
        }
      } else {
        // Firebase disabled, use local data only
        if (__DEV__) console.log('🚨 Firebase deshabilitado, usando solo datos locales...');
        sabores = await obtenerSaboresFn(tipo);
      }
      
      if (__DEV__) console.log(`Sabores finales: ${sabores.length}`);

      // Filter by type if specified
      if (tipo) {
        sabores = sabores.filter(sabor => sabor.tipo === tipo);
        if (__DEV__) console.log(`Sabores filtrados por tipo '${tipo}': ${sabores.length}`);
      }

      if (__DEV__) {
        console.log(`Total sabores obtenidos: ${sabores.length} (tipo: ${tipo || 'todos'})`);
      }
      return sabores;
    } catch (error) {
      console.error('Error getting sabores:', error);
      throw error;
    }
  }

  async crearSabor(sabor: Omit<Sabor, 'id'>): Promise<number> {
    try {
      const saborId = await dbService.crearSabor(sabor);

      // Sync to Firebase if enabled
      if (this.firebaseEnabled) {
        const saborWithId = { ...sabor, id: saborId };
        await FirebaseSync.syncSaboresToFirebase([saborWithId]);
      }

      return saborId;
    } catch (error) {
      console.error('Error creating sabor:', error);
      throw error;
    }
  }

  async actualizarSabor(id: number, sabor: Omit<Sabor, 'id'>): Promise<void> {
    try {
      await dbService.actualizarSabor(id, sabor);

      // Sync to Firebase if enabled
      if (this.firebaseEnabled) {
        const saborWithId = { ...sabor, id };
        await FirebaseSync.syncSaboresToFirebase([saborWithId]);
        console.log(`🔄 Sabor ${id} actualizado y sincronizado con Firebase`);
      }
    } catch (error) {
      console.error('Error updating sabor:', error);
      throw error;
    }
  }

  async eliminarSabor(id: number): Promise<void> {
    try {
      // Obtener el sabor antes de eliminarlo para sincronizar con Firebase
      const sabores = await dbService.obtenerSabores();
      const saborAEliminar = sabores.find((s: any) => s.id === id);
      
      await dbService.eliminarSabor(id);

      // Sync deletion to Firebase if enabled
      if (this.firebaseEnabled && saborAEliminar) {
        await FirebaseSync.deleteSaborFromFirebase(saborAEliminar.id!);
      }
    } catch (error) {
      console.error('Error deleting sabor:', error);
      throw error;
    }
  }

  // Rellenos operations
  async obtenerRellenos(): Promise<Relleno[]> {
    try {
      let rellenos: Relleno[];

      if (__DEV__) {
        console.log(`obtenerRellenos() - Firebase enabled: ${this.firebaseEnabled}`);
      }
      
      // 🛡️ Firebase sync REACTIVATED with duplication protection
      if (this.firebaseEnabled) {
        try {
          if (__DEV__) console.log('🔄 Sincronizando rellenos desde Firebase (con protección)...');
          
          // Get data from Firebase with protection
          const firebaseRellenos = await FirebaseSync.getRellenosFromFirebase();
          if (__DEV__) console.log(`Rellenos desde Firebase: ${firebaseRellenos.length}`);
          
          // Get local data
          const localRellenos = await obtenerRellenosFn();
          if (__DEV__) console.log(`Rellenos desde local: ${localRellenos.length}`);
          
          // 🛡️ SYNC RELLENOS WITH FLEXIBLE DUPLICATES (nombre + tipo)
          rellenos = await this.syncRellenosWithFlexibleDuplicates(localRellenos, firebaseRellenos);
          
          // Save merged data to local storage for offline access
          if (rellenos.length > localRellenos.length) {
            if (__DEV__) console.log('💾 Guardando rellenos fusionados localmente...');
            // Clear local and re-insert merged data
            await eliminarTodosLosRellenosFn();
            for (const relleno of rellenos) {
              await crearRellenoFn(relleno);
            }
            if (__DEV__) console.log('✅ Rellenos fusionados guardados localmente');
          }
          
        } catch (syncError) {
          if (__DEV__) console.warn('⚠️ Error sincronizando rellenos con Firebase, usando datos locales:', syncError);
          console.warn(`[ANDROID] Error sincronizando rellenos: ${syncError}`);
          // Fallback to local data
          rellenos = await obtenerRellenosFn();
        }
      } else {
        // Firebase disabled, use local data only
        if (__DEV__) console.log('🚨 Firebase deshabilitado, usando solo datos locales...');
        rellenos = await obtenerRellenosFn();
      }
      
      if (__DEV__) console.log(`Rellenos finales: ${rellenos.length}`);

      if (__DEV__) {
        console.log(`Total rellenos obtenidos: ${rellenos.length}`);
      }
      return rellenos;
    } catch (error) {
      console.error('Error getting rellenos:', error);
      throw error;
    }
  }

  async crearRelleno(relleno: Omit<Relleno, 'id'>): Promise<number> {
    try {
      const rellenoId = await dbService.crearRelleno(relleno);

      // Sync to Firebase if enabled
      if (this.firebaseEnabled) {
        const rellenoWithId = { ...relleno, id: rellenoId };
        await FirebaseSync.syncRellenosToFirebase([rellenoWithId]);
      }

      return rellenoId;
    } catch (error) {
      console.error('Error creating relleno:', error);
      throw error;
    }
  }

  async actualizarRelleno(id: number, relleno: Omit<Relleno, 'id'>): Promise<void> {
    try {
      await dbService.actualizarRelleno(id, relleno);

      // Sync to Firebase if enabled
      if (this.firebaseEnabled) {
        const rellenoWithId = { ...relleno, id };
        await FirebaseSync.syncRellenosToFirebase([rellenoWithId]);
        console.log(`🔄 Relleno ${id} actualizado y sincronizado con Firebase`);
      }
    } catch (error) {
      console.error('Error updating relleno:', error);
      throw error;
    }
  }

  async eliminarRelleno(id: number): Promise<void> {
    try {
      // Obtener el relleno antes de eliminarlo para sincronizar con Firebase
      const rellenos = await dbService.obtenerRellenos();
      const rellenoAEliminar = rellenos.find((r: any) => r.id === id);
      
      await dbService.eliminarRelleno(id);

      // Sync deletion to Firebase if enabled
      if (this.firebaseEnabled && rellenoAEliminar) {
        await FirebaseSync.deleteRellenoFromFirebase(rellenoAEliminar.id!);
      }
    } catch (error) {
      console.error('Error deleting relleno:', error);
      throw error;
    }
  }

  // Sync operations
  async syncToCloud(): Promise<void> {
    if (!this.firebaseEnabled) {
      throw new Error('Firebase not enabled');
    }

    try {
      console.log('🔄 Starting sync to cloud...');

      // Get all local data
      const [pedidos, sabores, rellenos, settings] = await Promise.all([
        obtenerPedidosFn(),
        obtenerSaboresFn(),
        obtenerRellenosFn(),
        obtenerSettingsFn()
      ]);

      // Sync to Firebase
      const { FirebaseSync } = require('./firebase');
      await Promise.all([
        FirebaseSync.syncPedidosToFirebase(pedidos),
        FirebaseSync.syncSaboresToFirebase(sabores),
        FirebaseSync.syncRellenosToFirebase(rellenos),
        FirebaseSync.syncSettingsToFirebase(settings)
      ]);

      console.log('✅ Sync to cloud completed');
    } catch (error) {
      console.error('❌ Error syncing to cloud:', error);
      throw error;
    }
  }

  async syncFromCloud(): Promise<void> {
    if (!this.firebaseEnabled) {
      throw new Error('Firebase not enabled');
    }

    try {
      console.log('🔄 Starting sync from cloud (with protection)...');

      // Get local data for merging
      const [localPedidos, localSabores, localRellenos, localSettings] = await Promise.all([
        dbService.obtenerPedidos(),
        obtenerSaboresFn(),
        obtenerRellenosFn(),
        obtenerSettingsFn()
      ]);

      // Perform bidirectional sync with Firebase as source of truth
      const mergedData = await FirebaseSync.bidirectionalSync({
        pedidos: localPedidos,
        sabores: localSabores,
        rellenos: localRellenos,
        settings: localSettings
      });

      console.log('🔄 Bidirectional sync completed');
      console.log(`📊 Firebase data: ${mergedData.sabores.length} sabores, ${mergedData.rellenos.length} rellenos`);

      // Update local database with Firebase data (source of truth)
      await this.updateLocalDataWithFirebase(mergedData);

      console.log('✅ Sync from cloud completed');
    } catch (error) {
      console.error('❌ Error syncing from cloud:', error);
      throw error;
    }
  }

  private async updateLocalDataWithFirebase(firebaseData: {
    pedidos: any[],
    sabores: any[],
    rellenos: any[],
    settings: any
  }): Promise<void> {
    try {
      console.log('🔄 Updating local storage with Firebase data...');
      
      // Verify functions are available
      if (!crearSaborFn || !crearRellenoFn) {
        console.error('[ANDROID] Database functions not available');
        console.error('❌ Database functions not available:', { crearSaborFn: !!crearSaborFn, crearRellenoFn: !!crearRellenoFn });
        return;
      }
      
      // Update local storage with Firebase data
      if (Platform.OS === 'web') {
        // For web, update localStorage directly
        localStorage.removeItem('pasteleria_sabores');
        localStorage.removeItem('pasteleria_rellenos');
        localStorage.removeItem('sabores');
        localStorage.removeItem('rellenos');
        
        // Set Firebase data using the correct keys
        localStorage.setItem('pasteleria_sabores', JSON.stringify(firebaseData.sabores));
        localStorage.setItem('pasteleria_rellenos', JSON.stringify(firebaseData.rellenos));
      } else {
        // For native, update SQLite database
        // Clear existing sabores and rellenos
        console.log('🗑️ Eliminando sabores y rellenos existentes...');
        await eliminarTodosLosSaboresFn();
        await eliminarTodosLosRellenosFn();
        
        // Insert Firebase data using imported functions
        console.log(`[ANDROID] Insertando ${firebaseData.sabores.length} sabores en SQLite...`);
        for (const sabor of firebaseData.sabores) {
          try {
            const saborId = await crearSaborFn(sabor);
            console.log(`[ANDROID] Sabor insertado: ${sabor.nombre} (ID: ${saborId})`);
          } catch (error) {
            console.error(`[ANDROID] Error inserting sabor ${sabor.nombre}: ${error}`);
          }
        }
        
        console.log(`[ANDROID] Insertando ${firebaseData.rellenos.length} rellenos en SQLite...`);
        for (const relleno of firebaseData.rellenos) {
          try {
            const rellenoId = await crearRellenoFn(relleno);
            console.log(`[ANDROID] Relleno insertado: ${relleno.nombre} (ID: ${rellenoId})`);
          } catch (error) {
            console.error(`[ANDROID] Error inserting relleno ${relleno.nombre}: ${error}`);
          }
        }
        
        // Upsert pedidos por id/contenido para borrar clones locales
        try {
          const keyFor = (p: any) => `${p.nombre}|${p.fecha_entrega}|${p.precio_final}`;
          const vistos = new Set<string>();
          for (const p of firebaseData.pedidos || []) {
            const k = keyFor(p);
            if (!vistos.has(k)) {
              vistos.add(k);
              if (p.id != null) {
                await upsertPedidoWithIdFn(p);
              }
            }
          }
        } catch (e) {
          console.warn('[ANDROID] Upsert de pedidos al actualizar datos locales falló:', e);
        }

        // Verificar que los datos se guardaron
        try {
          const saboresVerificacion = await obtenerSaboresFn();
          const rellenosVerificacion = await obtenerRellenosFn();
          console.log(`[ANDROID] Verificación: ${saboresVerificacion.length} sabores y ${rellenosVerificacion.length} rellenos en SQLite`);
        } catch (error) {
          console.error(`[ANDROID] Error verificando datos guardados: ${error}`);
        }
      }
    } catch (error) {
      console.error('❌ Error updating local data with Firebase:', error);
    }
  }

  // Utility methods
  isFirebaseEnabled(): boolean {
    return this.firebaseEnabled;
  }

  async getFirebaseUserId(): Promise<string | null> {
    const { FirebaseSync } = require('./firebase');
    return FirebaseSync.getUserId();
  }

  // Network and sync status methods
  isOnline(): boolean {
    const networkManager = NetworkManager.getInstance();
    return networkManager.isOnlineStatus();
  }

  getPendingSyncCount(): number {
    const networkManager = NetworkManager.getInstance();
    return networkManager.getPendingSyncCount();
  }

  forceSyncNow(): void {
    const networkManager = NetworkManager.getInstance();
    networkManager.forceSyncNow();
  }

  clearPendingSync(): void {
    const networkManager = NetworkManager.getInstance();
    networkManager.clearSyncQueue();
  }

  getNetworkStatus() {
    const networkManager = NetworkManager.getInstance();
    return networkManager.getCurrentStatus();
  }

  // Sync all data when connection is restored (including images)
  async syncAllData(): Promise<void> {
    const networkManager = NetworkManager.getInstance();
    if (!networkManager.isOnlineStatus()) {
      console.log('📱 No internet connection, skipping sync');
      return;
    }

    if (!FIREBASE_ENABLED) {
      console.log('🔥 Firebase disabled, skipping sync');
      return;
    }

    try {
      console.log('🔄 Starting full data sync...');
      
      // Get local data first
      const localPedidos = await dbService.obtenerPedidos();
      const localSettings = await obtenerSettingsFn();
      
      // Sync pedidos (without images)
      if (localPedidos.length > 0) {
        await FirebaseSync.syncPedidosToFirebase(localPedidos);
        console.log(`📊 Synced ${localPedidos.length} pedidos to Firebase`);
      }
      
      // Sync settings
      if (localSettings) {
        await FirebaseSync.syncSettingsToFirebase(localSettings);
        console.log('⚙️ Synced settings to Firebase');
      }
      
      // Sync pending image uploads to Cloudinary
      await HybridImageService.syncPendingUploads();
      
      console.log('✅ Full data sync completed');
    } catch (error) {
      console.error('❌ Error in full data sync:', error);
    }
  }

  // Get image sync status
  async getImageSyncStatus() {
    return await HybridImageService.getSyncStatus();
  }

  // 🔔 Programar notificaciones para pedidos sincronizados desde Firebase
  private async programarNotificacionesParaPedidosSincronizados(pedidosNuevos: any[]): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('⚠️ Web platform: notifications not supported for synced pedidos');
        return;
      }

      // Obtener configuración de notificaciones
      const settings = await obtenerSettingsFn();
      if (!settings?.notifications_enabled) {
        console.log('🔕 Notificaciones deshabilitadas, no se programarán para pedidos sincronizados');
        return;
      }

      const notificationDays = settings.notification_days || [settings.days_before || 0];
      console.log(`🔔 Programando notificaciones para ${pedidosNuevos.length} pedidos sincronizados desde Firebase`);

      for (const pedido of pedidosNuevos) {
        if (!pedido.id || !pedido.fecha_entrega) {
          console.log(`⚠️ Saltando pedido sin ID o fecha:`, pedido);
          continue;
        }

        // Verificar si ya tiene notificaciones programadas
        const existingNotificationId = await getNotificationIdForPedido(pedido.id);
        if (existingNotificationId) {
          console.log(`📱 Pedido ${pedido.id} ya tiene notificaciones programadas, saltando`);
          continue;
        }

        // Programar notificaciones para el pedido sincronizado
        try {
          const scheduledIds = await scheduleMultiplePedidoNotifications(
            pedido.id,
            pedido.nombre || 'Pedido sin nombre',
            pedido.fecha_entrega,
            notificationDays
          );

          // Guardar el ID de la primera notificación
          if (scheduledIds.length > 0) {
            await setNotificationIdForPedido(pedido.id, scheduledIds[0]);
            console.log(`✅ ${scheduledIds.length} notificaciones programadas para pedido sincronizado ${pedido.id}`);
            console.log(`[ANDROID] Notificaciones programadas para pedido sincronizado: ${pedido.nombre}`);
          }
        } catch (notificationError) {
          console.error(`❌ Error programando notificaciones para pedido ${pedido.id}:`, notificationError);
          console.error(`[ANDROID] Error programando notificaciones para pedido sincronizado: ${pedido.nombre}`);
        }
      }

      console.log(`🎯 Procesamiento de notificaciones para pedidos sincronizados completado`);
    } catch (error) {
      console.error('❌ Error en programación de notificaciones para pedidos sincronizados:', error);
      console.error(`[ANDROID] Error general programando notificaciones para pedidos sincronizados: ${error}`);
    }
  }
}

// Export singleton instance
const hybridDB = new HybridDBService();
export default hybridDB;

// Types are already exported above
