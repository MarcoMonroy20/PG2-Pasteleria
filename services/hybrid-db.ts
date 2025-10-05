// Hybrid Database Service
// Combines local SQLite/LocalStorage with Firebase sync
// Images stay local, other data syncs with Firebase
// Full offline support with automatic sync when online

import { Platform } from 'react-native';
import { HybridDatabase, FirebaseSync } from './firebase';
import NetworkManager from './network-manager';
import HybridImageService from './image-service';
import { FIREBASE_ENABLED } from '../firebase.config';
import VisualLogger from '../utils/VisualLogger';

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
      VisualLogger.error(`[ANDROID] Error initializing database: ${error}`);
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

      // Sync to Firebase if enabled and online
      if (this.firebaseEnabled) {
        const networkManager = NetworkManager.getInstance();

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

        // If we got pedidos from Firebase, save them locally for offline use
        if (pedidos.length > 0) {
          if (__DEV__) console.log('Guardando pedidos de Firebase en local para offline...');
          try {
            // Save each pedido locally (without images for now)
            for (const pedido of pedidos) {
              // Check if pedido already exists locally
              const existingPedido = await dbService.obtenerPedidoPorId(pedido.id!);
              if (!existingPedido) {
                await dbService.crearPedido(pedido);
              }
            }
            if (__DEV__) console.log(`✅ ${pedidos.length} pedidos guardados localmente`);
          } catch (error) {
            console.error('Error saving Firebase pedidos locally:', error);
            VisualLogger.error(`[ANDROID] Error guardando pedidos localmente: ${error}`);
          }
        } else {
          // If no pedidos from Firebase, fall back to local
          pedidos = await dbService.obtenerPedidos();
        }
      } else {
        // Use local database only
        pedidos = await dbService.obtenerPedidos();
      }

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

      // Delete image reference using hybrid service
      console.log('🗑️ Eliminando referencia de imagen...');
      await this.deleteImageReference(id);
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
      let pedidos: Pedido[];
      
      if (this.firebaseEnabled) {
        // Get from local database for date filtering (Firebase doesn't support complex queries easily)
        pedidos = await dbService.obtenerPedidosPorFecha(fechaInicio, fechaFin);
      } else {
        pedidos = await dbService.obtenerPedidosPorFecha(fechaInicio, fechaFin);
      }

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
    } catch (error) {
      console.error('Error getting pedidos by date:', error);
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
      
      if (this.firebaseEnabled) {
        // Try to get from Firebase first (source of truth)
        if (__DEV__) console.log('Intentando obtener sabores desde Firebase...');
        sabores = await HybridDatabase.getAllSabores();
        if (__DEV__) console.log(`Sabores desde Firebase: ${sabores.length}`);
        
        // If we got sabores from Firebase, save them locally for offline use
        if (sabores.length > 0) {
          if (__DEV__) console.log('Guardando sabores de Firebase en local para offline...');
          try {
            // Clear existing sabores and save Firebase data locally
            await eliminarTodosLosSaboresFn();
            for (const sabor of sabores) {
              await crearSaborFn(sabor);
            }
            if (__DEV__) console.log(`✅ ${sabores.length} sabores guardados localmente`);
          } catch (error) {
            console.error('Error saving Firebase sabores locally:', error);
            VisualLogger.error(`[ANDROID] Error guardando sabores localmente: ${error}`);
          }
        } else {
          // If no sabores from Firebase, fall back to local
          if (__DEV__) console.log('No sabores en Firebase, obteniendo desde base de datos local...');
          sabores = await obtenerSaboresFn(tipo);
          if (__DEV__) console.log(`Sabores desde local: ${sabores.length}`);
        }
      } else {
        // Use local database only
        if (__DEV__) console.log('Firebase deshabilitado, usando solo base de datos local...');
        sabores = await obtenerSaboresFn(tipo);
        if (__DEV__) console.log(`Sabores desde local: ${sabores.length}`);
      }

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
      const saborAEliminar = sabores.find(s => s.id === id);
      
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
      
      if (this.firebaseEnabled) {
        // Try to get from Firebase first (source of truth)
        if (__DEV__) console.log('Intentando obtener rellenos desde Firebase...');
        rellenos = await HybridDatabase.getAllRellenos();
        if (__DEV__) console.log(`Rellenos desde Firebase: ${rellenos.length}`);
        
        // If we got rellenos from Firebase, save them locally for offline use
        if (rellenos.length > 0) {
          if (__DEV__) console.log('Guardando rellenos de Firebase en local para offline...');
          try {
            // Clear existing rellenos and save Firebase data locally
            await eliminarTodosLosRellenosFn();
            for (const relleno of rellenos) {
              await crearRellenoFn(relleno);
            }
            if (__DEV__) console.log(`✅ ${rellenos.length} rellenos guardados localmente`);
          } catch (error) {
            console.error('Error saving Firebase rellenos locally:', error);
            VisualLogger.error(`[ANDROID] Error guardando rellenos localmente: ${error}`);
          }
        } else {
          // If no rellenos from Firebase, fall back to local
          if (__DEV__) console.log('No rellenos en Firebase, obteniendo desde base de datos local...');
          rellenos = await obtenerRellenosFn();
          if (__DEV__) console.log(`Rellenos desde local: ${rellenos.length}`);
        }
      } else {
        // Use local database only
        if (__DEV__) console.log('Firebase deshabilitado, usando solo base de datos local...');
        rellenos = await obtenerRellenosFn();
        if (__DEV__) console.log(`Rellenos desde local: ${rellenos.length}`);
      }

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
      const rellenoAEliminar = rellenos.find(r => r.id === id);
      
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
      console.log('🔄 Starting sync from cloud...');

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
        VisualLogger.error('[ANDROID] Database functions not available');
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
        VisualLogger.log(`[ANDROID] Insertando ${firebaseData.sabores.length} sabores en SQLite...`);
        for (const sabor of firebaseData.sabores) {
          try {
            const saborId = await crearSaborFn(sabor);
            VisualLogger.success(`[ANDROID] Sabor insertado: ${sabor.nombre} (ID: ${saborId})`);
          } catch (error) {
            VisualLogger.error(`[ANDROID] Error inserting sabor ${sabor.nombre}: ${error}`);
          }
        }
        
        VisualLogger.log(`[ANDROID] Insertando ${firebaseData.rellenos.length} rellenos en SQLite...`);
        for (const relleno of firebaseData.rellenos) {
          try {
            const rellenoId = await crearRellenoFn(relleno);
            VisualLogger.success(`[ANDROID] Relleno insertado: ${relleno.nombre} (ID: ${rellenoId})`);
          } catch (error) {
            VisualLogger.error(`[ANDROID] Error inserting relleno ${relleno.nombre}: ${error}`);
          }
        }
        
        // Verificar que los datos se guardaron
        try {
          const saboresVerificacion = await obtenerSaboresFn();
          const rellenosVerificacion = await obtenerRellenosFn();
          VisualLogger.success(`[ANDROID] Verificación: ${saboresVerificacion.length} sabores y ${rellenosVerificacion.length} rellenos en SQLite`);
        } catch (error) {
          VisualLogger.error(`[ANDROID] Error verificando datos guardados: ${error}`);
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
}

// Export singleton instance
const hybridDB = new HybridDBService();
export default hybridDB;

// Types are already exported above
