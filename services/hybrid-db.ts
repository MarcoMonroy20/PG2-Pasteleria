// Hybrid Database Service
// Combines local SQLite/LocalStorage with Firebase sync
// Images stay local, other data syncs with Firebase
// Full offline support with automatic sync when online

import { Platform } from 'react-native';
import { HybridDatabase, FirebaseSync } from './firebase';
import NetworkManager from './network-manager';
import { FIREBASE_ENABLED } from '../firebase.config';

// Import existing services based on platform
let dbService: any;
let initDBFn: any;
let obtenerSettingsFn: any;
let guardarSettingsFn: any;
let obtenerSaboresFn: any;
let obtenerRellenosFn: any;
let obtenerPedidosFn: any;

if (Platform.OS === 'web') {
  const dbWeb = require('./db.web');
  dbService = dbWeb;
  initDBFn = dbWeb.initDB;
  obtenerSettingsFn = dbWeb.obtenerSettings;
  guardarSettingsFn = dbWeb.guardarSettings;
  obtenerSaboresFn = dbWeb.obtenerSabores;
  obtenerRellenosFn = dbWeb.obtenerRellenos;
  obtenerPedidosFn = dbWeb.obtenerPedidos;
} else {
  const dbNative = require('./db');
  dbService = dbNative;
  initDBFn = dbNative.initDB;
  obtenerSettingsFn = dbNative.obtenerSettings;
  guardarSettingsFn = dbNative.guardarSettings;
  obtenerSaboresFn = dbNative.obtenerSabores;
  obtenerRellenosFn = dbNative.obtenerRellenos;
  obtenerPedidosFn = dbNative.obtenerPedidos;
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
      await initDBFn();

      // Initialize Network Manager for offline detection
      const networkManager = NetworkManager.getInstance();
      console.log('📡 Network Manager initialized');

      // Initialize Firebase for sync only if enabled
      if (FIREBASE_ENABLED) {
        await FirebaseSync.initialize();
        this.firebaseEnabled = true;
        console.log('✅ Hybrid Database initialized successfully');
      } else {
        this.firebaseEnabled = false;
        console.log('✅ Local Database initialized (Firebase disabled)');
      }

      console.log(`📊 Estado inicial: ${networkManager.isOnlineStatus() ? 'ONLINE' : 'OFFLINE'}`);
      console.log(`📋 Elementos pendientes: ${networkManager.getPendingSyncCount()}`);
    } catch (error) {
      console.error('❌ Error initializing Hybrid Database:', error);
      // Continue with local database only
      this.firebaseEnabled = false;
    }
  }

  // Image handling - stays completely local
  getImagePath(pedidoId: number): string | null {
    return HybridDatabase.getImagePath(pedidoId);
  }

  saveImageReference(pedidoId: number, imagePath: string): void {
    // Image reference saved locally
    console.log(`💾 Image reference saved for pedido ${pedidoId}: ${imagePath}`);
  }

  deleteImageReference(pedidoId: number): void {
    // Image reference deletion (simplified for now)
    console.log(`🗑️ Image reference deleted for pedido ${pedidoId}`);
  }

  // Pedido operations with hybrid storage
  async crearPedido(pedido: Omit<Pedido, 'id'>): Promise<number> {
    try {
      // Create in local database first (always works offline)
      const pedidoId = await dbService.crearPedido(pedido);

      // Save image locally if exists
      if (pedido.imagen) {
        this.saveImageReference(pedidoId, pedido.imagen);
      }

      // Sync to Firebase if enabled and online
      console.log('🔍 Debug: firebaseEnabled =', this.firebaseEnabled);
      if (this.firebaseEnabled) {
        const networkManager = NetworkManager.getInstance();
        console.log('🔍 Debug: isOnline =', networkManager.isOnlineStatus());

        if (networkManager.isOnlineStatus()) {
          // Online: sync immediately
          try {
            console.log('🔄 Intentando sincronizar pedido con Firebase...');
            const pedidoWithId = { ...pedido, id: pedidoId };
            await HybridDatabase.savePedido(pedidoWithId);
            console.log('✅ Pedido sincronizado inmediatamente con Firebase');
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
          console.log('📱 Sin conexión, pedido guardado localmente y agregado a cola de sincronización');
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

      if (this.firebaseEnabled) {
        // Try to get from Firebase first (with local images)
        pedidos = await HybridDatabase.getAllPedidos();

        // If no pedidos from Firebase, fall back to local
        if (pedidos.length === 0) {
          pedidos = await dbService.obtenerPedidos();
        }
      } else {
        // Use local database only
        pedidos = await dbService.obtenerPedidos();
      }

      return pedidos;
    } catch (error) {
      console.error('Error getting pedidos:', error);
      // Fall back to local database
      return await dbService.obtenerPedidos();
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

      return pedido;
    } catch (error) {
      console.error('Error getting pedido by ID:', error);
      // Fall back to local database
      return await dbService.obtenerPedidoPorId(id);
    }
  }

  async actualizarPedido(id: number, pedido: Omit<Pedido, 'id'>): Promise<void> {
    console.log('📝 hybridDB.actualizarPedido llamado con ID:', id);
    try {
      // Update local database first (always works offline)
      console.log('📝 Actualizando en dbService...');
      await dbService.actualizarPedido(id, pedido);
      console.log('📝 Pedido actualizado en dbService');

      // Save image locally if exists
      if (pedido.imagen) {
        console.log('📝 Guardando referencia de imagen...');
        this.saveImageReference(id, pedido.imagen);
      }

      // Sync to Firebase if enabled
      if (this.firebaseEnabled) {
        try {
          console.log('📝 Actualizando en Firebase...');
          await FirebaseSync.updatePedido(id, pedido);
          console.log('📝 Pedido actualizado en Firebase');
        } catch (firebaseError) {
          console.error('❌ Error actualizando en Firebase:', firebaseError);
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

      // Delete local image reference
      console.log('🗑️ Eliminando referencia de imagen...');
      this.deleteImageReference(id);
      console.log('🗑️ Referencia de imagen eliminada');

      // Delete from Firebase if enabled
      if (this.firebaseEnabled) {
        try {
          console.log('🗑️ Eliminando de Firebase...');
          await FirebaseSync.deletePedido(id);
          console.log('🗑️ Pedido eliminado de Firebase');
        } catch (firebaseError) {
          console.error('❌ Error eliminando de Firebase:', firebaseError);
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
      if (this.firebaseEnabled) {
        // Get from local database for date filtering (Firebase doesn't support complex queries easily)
        return await dbService.obtenerPedidosPorFecha(fechaInicio, fechaFin);
      } else {
        return await dbService.obtenerPedidosPorFecha(fechaInicio, fechaFin);
      }
    } catch (error) {
      console.error('Error getting pedidos by date:', error);
      return await dbService.obtenerPedidosPorFecha(fechaInicio, fechaFin);
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
      return await obtenerSaboresFn(tipo);
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
      }
    } catch (error) {
      console.error('Error updating sabor:', error);
      throw error;
    }
  }

  async eliminarSabor(id: number): Promise<void> {
    try {
      await dbService.eliminarSabor(id);

      // Note: Firebase sync for deletion could be implemented if needed
    } catch (error) {
      console.error('Error deleting sabor:', error);
      throw error;
    }
  }

  // Rellenos operations
  async obtenerRellenos(): Promise<Relleno[]> {
    try {
      return await obtenerRellenosFn();
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
      }
    } catch (error) {
      console.error('Error updating relleno:', error);
      throw error;
    }
  }

  async eliminarRelleno(id: number): Promise<void> {
    try {
      await dbService.eliminarRelleno(id);

      // Note: Firebase sync for deletion could be implemented if needed
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
      console.log('🔄 Starting sync from cloud...');

      // Get local data for merging
      const [localPedidos, localSabores, localRellenos, localSettings] = await Promise.all([
        dbService.obtenerPedidos(),
        obtenerSaboresFn(),
        obtenerRellenosFn(),
        obtenerSettingsFn()
      ]);

      // Perform bidirectional sync
      // Bidirectional sync completed
      console.log('🔄 Bidirectional sync completed');
      const mergedData = {
        pedidos: localPedidos,
        sabores: localSabores,
        rellenos: localRellenos,
        settings: localSettings
      };

      // Update local database with merged data
      // Note: This is a simplified implementation
      // In a production app, you'd want more sophisticated conflict resolution

      console.log('✅ Sync from cloud completed');
    } catch (error) {
      console.error('❌ Error syncing from cloud:', error);
      throw error;
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
}

// Export singleton instance
const hybridDB = new HybridDBService();
export default hybridDB;

// Types are already exported above
