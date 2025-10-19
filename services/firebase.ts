// Firebase configuration and services for hybrid storage
// Images stay local, other data syncs with Firebase

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Import centralized Firebase configuration
import { firebaseConfig, FIREBASE_ENABLED } from '../firebase.config';

// Initialize Firebase only if enabled and properly configured
let app: any = null;
let db: any = null;
let auth: any = null;
let messaging: any = null;

if (FIREBASE_ENABLED && firebaseConfig.apiKey) {
  try {
    console.log('🔍 Initializing Firebase with secure configuration...');
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    // Initialize Firebase Messaging (only for web)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        messaging = getMessaging(app);
        console.log('✅ Firebase Messaging initialized');
      } catch (error) {
        console.warn('⚠️ Firebase Messaging not available:', error);
      }
    }
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.error('🔧 Check your .env.local file and Firebase credentials');
  }
} else {
  console.warn('⚠️ Firebase disabled or not properly configured');
  console.warn('📋 Create .env.local file with your Firebase credentials to enable');
}

// Export Firebase services (null if disabled)
export { db, auth, messaging };

// Shared user ID for all app instances to access the same data
const SHARED_APP_USER_ID = 'pasteleria-cocina-shared-user';

// Initialize anonymous authentication (only if Firebase is enabled)
export const initFirebaseAuth = async (): Promise<string | null> => {
  if (!FIREBASE_ENABLED || !auth) {
    console.log('Firebase authentication disabled, using shared user ID');
    return SHARED_APP_USER_ID;
  }

  console.log('🔐 Iniciando autenticación anónima de Firebase...');

  // Always return shared user ID for consistent data access
  // Perform anonymous auth in background for security
  try {
    await signInAnonymously(auth);
    console.log('✅ Autenticación anónima completada en background');
  } catch (error) {
    console.log('⚠️ Error en autenticación anónima, continuando con shared user ID:', error);
  }

  return SHARED_APP_USER_ID;
};

// Types for Firebase documents (without images)
export interface FirebasePedido {
  id: number;
  fecha_entrega: string;
  nombre: string;
  precio_final: number;
  monto_abonado: number;
  descripcion?: string;
  direccion_entrega?: string;
  // imagen field removed - stays local
  productos: any[];
  userId: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface FirebaseSabor {
  id: number;
  nombre: string;
  tipo: 'pastel' | 'cupcakes';
  activo: boolean;
  userId: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface FirebaseRelleno {
  id: number;
  nombre: string;
  activo: boolean;
  userId: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface FirebaseSettings {
  id: string; // Always 'settings'
  notifications_enabled: boolean;
  days_before: number;
  contact_name: string;
  company_name: string;
  phone: string;
  userId: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Image reference system - stores image metadata locally
export interface LocalImageRef {
  pedidoId: number;
  imagePath: string; // Local file path or base64
  imageType: 'file' | 'base64';
  fileName: string;
  created_at: string;
}

// Local image storage utilities
export class LocalImageManager {
  private static STORAGE_KEY = 'pasteleria_local_images';

  static saveImageReference(pedidoId: number, imagePath: string, imageType: 'file' | 'base64' = 'file'): void {
    const refs = this.getAllImageReferences();
    const existingIndex = refs.findIndex(ref => ref.pedidoId === pedidoId);

    const imageRef: LocalImageRef = {
      pedidoId,
      imagePath,
      imageType,
      fileName: imageType === 'file' ? imagePath.split('/').pop() || 'image.jpg' : 'base64_image.jpg',
      created_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      refs[existingIndex] = imageRef;
    } else {
      refs.push(imageRef);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(refs));
  }

  static getImageReference(pedidoId: number): LocalImageRef | null {
    const refs = this.getAllImageReferences();
    return refs.find(ref => ref.pedidoId === pedidoId) || null;
  }

  static getAllImageReferences(): LocalImageRef[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static deleteImageReference(pedidoId: number): void {
    const refs = this.getAllImageReferences();
    const filteredRefs = refs.filter(ref => ref.pedidoId !== pedidoId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredRefs));
  }

  static getImagePath(pedidoId: number): string | null {
    const ref = this.getImageReference(pedidoId);
    return ref ? ref.imagePath : null;
  }
}

// Firebase sync utilities
export class FirebaseSync {
  private static userId: string | null = null;
  private static SHARED_APP_USER_ID = 'pasteleria-cocina-shared-user';

  static async initialize(): Promise<void> {
    console.log('🔐 FirebaseSync.initialize() - Iniciando autenticación...');
    try {
      // Always use shared user ID for consistency
      this.userId = this.SHARED_APP_USER_ID;
      
      // Perform anonymous authentication in background for security
      if (FIREBASE_ENABLED && auth) {
        try {
          await signInAnonymously(auth);
          console.log('✅ Firebase authentication completed in background');
        } catch (authError) {
          console.warn('⚠️ Background authentication failed, but continuing with shared user ID');
        }
      }
      
      console.log('✅ FirebaseSync.initialize() - Usando usuario compartido:', this.userId);
    } catch (error) {
      console.error('❌ FirebaseSync.initialize() - Error en inicialización:', error);
      // Even if Firebase fails, use shared user ID for consistency
      this.userId = this.SHARED_APP_USER_ID;
    }
  }

  // =====================
  // IMAGE REFERENCES (Cloudinary URL por pedido, compartida entre dispositivos)
  // =====================
  static async savePedidoImageRef(pedidoId: number, url: string): Promise<void> {
    if (!this.userId) return;
    try {
      const docRef = doc(db, 'pedido_images', `${this.userId}_${pedidoId}`);
      await setDoc(docRef, { url, userId: this.userId, pedidoId, created_at: Timestamp.now(), updated_at: Timestamp.now() });
    } catch (e) {
      console.warn('⚠️ No se pudo guardar referencia de imagen en Firebase:', e);
    }
  }

  static async getPedidoImageRef(pedidoId: number): Promise<string | null> {
    const userId = this.userId || this.SHARED_APP_USER_ID;
    if (!userId) return null;
    try {
      const docRef = doc(db, 'pedido_images', `${userId}_${pedidoId}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        return data?.url || null;
      }
      return null;
    } catch (e) {
      console.warn('⚠️ No se pudo obtener referencia de imagen de Firebase:', e);
      return null;
    }
  }

  static async deletePedidoImageRef(pedidoId: number): Promise<void> {
    if (!this.userId) return;
    try {
      const docRef = doc(db, 'pedido_images', `${this.userId}_${pedidoId}`);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('⚠️ No se pudo eliminar referencia de imagen en Firebase:', e);
    }
  }

  static getUserId(): string | null {
    return this.userId || this.SHARED_APP_USER_ID;
  }

  static async reinitialize(): Promise<void> {
    console.log('🔄 FirebaseSync.reinitialize() - Reinicializando autenticación...');
    this.userId = null;
    await this.initialize();
  }

  // Convert local pedido to Firebase format (remove image and undefined values)
  static localPedidoToFirebase(localPedido: any): any {
    const { imagen, ...pedidoWithoutImage } = localPedido;
    
    // Clean undefined values - Firebase doesn't accept undefined
    const cleanPedido = Object.fromEntries(
      Object.entries(pedidoWithoutImage).map(([key, value]) => [
        key, 
        value === undefined ? null : value
      ])
    );
    
    return {
      ...cleanPedido,
      productos: JSON.parse(JSON.stringify(cleanPedido.productos || []))
    };
  }

  // Sync pedido to Firebase (without image)
  static async syncPedidoToFirebase(localPedido: any): Promise<void> {
    if (!this.userId) return;

    const firebasePedido = this.localPedidoToFirebase(localPedido);

    const docRef = doc(db, 'pedidos', `${this.userId}_${localPedido.id}`);
    await setDoc(docRef, {
      ...firebasePedido,
      userId: this.userId,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });
  }

  // Sync multiple pedidos
  static async syncPedidosToFirebase(localPedidos: any[]): Promise<void> {
    if (!this.userId) return;

    const batchPromises = localPedidos.map(pedido => this.syncPedidoToFirebase(pedido));
    await Promise.all(batchPromises);
  }

  // Delete pedido from Firebase
  static async deletePedido(id: number): Promise<void> {
    if (!this.userId) return;

    console.log(`🗑️ FirebaseSync.deletePedido - Eliminando pedido ${id} de Firebase`);
    const docRef = doc(db, 'pedidos', `${this.userId}_${id}`);
    await deleteDoc(docRef);
    console.log(`✅ FirebaseSync.deletePedido - Pedido ${id} eliminado de Firebase`);
  }

  // Update pedido in Firebase
  static async updatePedido(id: number, pedido: Omit<any, 'id'>): Promise<void> {
    if (!this.userId) return;

    console.log(`📝 FirebaseSync.updatePedido - Actualizando pedido ${id} en Firebase`);
    const firebasePedido = this.localPedidoToFirebase({ ...pedido, id });
    
    // Clean undefined values in the update data
    const cleanUpdateData = Object.fromEntries(
      Object.entries(firebasePedido).filter(([_, value]) => value !== undefined)
    );
    
    const docRef = doc(db, 'pedidos', `${this.userId}_${id}`);
    await updateDoc(docRef, {
      ...cleanUpdateData,
      updated_at: Timestamp.now()
    });
    console.log(`✅ FirebaseSync.updatePedido - Pedido ${id} actualizado en Firebase`);
  }

  // Get pedidos from Firebase
  static async getPedidosFromFirebase(): Promise<any[]> {
    const userId = this.userId || this.SHARED_APP_USER_ID;
    if (!userId) return [];

    const q = query(
      collection(db, 'pedidos'),
      where('userId', '==', userId),
      orderBy('fecha_entrega', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const pedidos: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirebasePedido;
      // Add local image reference if exists
      const localImageRef = LocalImageManager.getImageReference(data.id);
      pedidos.push({
        ...data,
        imagen: localImageRef ? localImageRef.imagePath : null
      });
    });

    return pedidos;
  }

  // Limpia duplicados en Firebase: por id y por contenido (nombre+fecha+precio)
  static async cleanupRemotePedidoDuplicates(): Promise<{ removedById: number; removedByContent: number; }> {
    const userId = this.userId || this.SHARED_APP_USER_ID;
    if (!userId) return { removedById: 0, removedByContent: 0 };

    const q = query(
      collection(db, 'pedidos'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    let removedById = 0;
    let removedByContent = 0;

    // 1) Duplicados por id (campo data.id)
    const byLocalId = new Map<number, Array<any>>();
    snapshot.docs.forEach((docSnap: any) => {
      const data = docSnap.data() as FirebasePedido;
      const list = byLocalId.get(data.id) || [];
      list.push({ ref: docSnap.ref, data });
      byLocalId.set(data.id, list);
    });

    for (const [, list] of byLocalId.entries()) {
      if (list.length > 1) {
        // Mantener el más reciente por updated_at
        list.sort((a, b) => {
          const ta = (a.data.updated_at?.seconds || 0);
          const tb = (b.data.updated_at?.seconds || 0);
          return tb - ta;
        });
        const keep = list[0];
        const toDelete = list.slice(1);
        await Promise.all(toDelete.map(item => deleteDoc(item.ref)));
        removedById += toDelete.length;
      }
    }

    // 2) Duplicados por contenido (nombre+fecha_entrega+precio_final)
    const refreshed = await getDocs(q);
    const byContent = new Map<string, any>();
    const toDeleteContent: any[] = [];
    refreshed.docs.forEach((docSnap: any) => {
      const data = docSnap.data() as FirebasePedido;
      const key = `${data.nombre}|${data.fecha_entrega}|${data.precio_final}`;
      if (!byContent.has(key)) {
        byContent.set(key, { ref: docSnap.ref, data });
      } else {
        // Mantener el más reciente por updated_at
        const existing = byContent.get(key);
        const tExisting = (existing.data.updated_at?.seconds || 0);
        const tCurrent = (data.updated_at?.seconds || 0);
        if (tCurrent > tExisting) {
          toDeleteContent.push(existing.ref);
          byContent.set(key, { ref: docSnap.ref, data });
        } else {
          toDeleteContent.push(docSnap.ref);
        }
      }
    });
    if (toDeleteContent.length) {
      await Promise.all(toDeleteContent.map(ref => deleteDoc(ref)));
      removedByContent += toDeleteContent.length;
    }

    if (removedById || removedByContent) {
      console.log(`🧹 FirebaseSync.cleanupRemotePedidoDuplicates(): removedById=${removedById}, removedByContent=${removedByContent}`);
    }
    return { removedById, removedByContent };
  }

  // Sync settings to Firebase
  static async syncSettingsToFirebase(localSettings: any): Promise<void> {
    if (!this.userId) return;

    const docRef = doc(db, 'settings', this.userId);
    await setDoc(docRef, {
      id: 'settings',
      ...localSettings,
      userId: this.userId,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });
  }

  // Get settings from Firebase
  static async getSettingsFromFirebase(): Promise<any | null> {
    const userId = this.userId || this.SHARED_APP_USER_ID;
    if (!userId) return null;

    const docRef = doc(db, 'settings', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  }

  // Sync sabores to Firebase
  static async syncSaboresToFirebase(localSabores: any[]): Promise<void> {
    if (!this.userId) return;

    const batchPromises = localSabores.map(sabor => {
      const docRef = doc(db, 'sabores', `${this.userId}_${sabor.id}`);
      return setDoc(docRef, {
        ...sabor,
        userId: this.userId,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
    });

    await Promise.all(batchPromises);
  }

  // Sync rellenos to Firebase
  static async syncRellenosToFirebase(localRellenos: any[]): Promise<void> {
    if (!this.userId) return;

    const batchPromises = localRellenos.map(relleno => {
      const docRef = doc(db, 'rellenos', `${this.userId}_${relleno.id}`);
      return setDoc(docRef, {
        ...relleno,
        userId: this.userId,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
    });

    await Promise.all(batchPromises);
  }

  // Delete relleno from Firebase
  static async deleteRellenoFromFirebase(rellenoId: number): Promise<void> {
    if (!this.userId) return;

    try {
      const docRef = doc(db, 'rellenos', `${this.userId}_${rellenoId}`);
      await deleteDoc(docRef);
      console.log(`🗑️ Relleno ${rellenoId} eliminado de Firebase`);
    } catch (error) {
      console.error('❌ Error eliminando relleno de Firebase:', error);
      throw error;
    }
  }

  // Delete sabor from Firebase
  static async deleteSaborFromFirebase(saborId: number): Promise<void> {
    if (!this.userId) return;

    try {
      const docRef = doc(db, 'sabores', `${this.userId}_${saborId}`);
      await deleteDoc(docRef);
      console.log(`🗑️ Sabor ${saborId} eliminado de Firebase`);
    } catch (error) {
      console.error('❌ Error eliminando sabor de Firebase:', error);
      throw error;
    }
  }

  // Get sabores from Firebase
  static async getSaboresFromFirebase(): Promise<any[]> {
    const userId = this.userId || this.SHARED_APP_USER_ID;
    if (!userId) return [];

    try {
      const q = query(
        collection(db, 'sabores'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const sabores = querySnapshot.docs.map(doc => ({
        id: doc.data().id,
        nombre: doc.data().nombre,
        tipo: doc.data().tipo,
        activo: doc.data().activo
      }));
      console.log(`📊 Obtenidos ${sabores.length} sabores de Firebase (userId: ${userId})`);
      return sabores;
    } catch (error) {
      console.error('❌ Error obteniendo sabores de Firebase:', error);
      return [];
    }
  }

  // Get rellenos from Firebase
  static async getRellenosFromFirebase(): Promise<any[]> {
    const userId = this.userId || this.SHARED_APP_USER_ID;
    if (!userId) return [];

    try {
      const q = query(
        collection(db, 'rellenos'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const rellenos = querySnapshot.docs.map(doc => ({
        id: doc.data().id,
        nombre: doc.data().nombre,
        tipo: doc.data().tipo,
        activo: doc.data().activo
      }));
      console.log(`📊 Obtenidos ${rellenos.length} rellenos de Firebase (userId: ${userId})`);
      return rellenos;
    } catch (error) {
      console.error('❌ Error obteniendo rellenos de Firebase:', error);
      return [];
    }
  }

  // Bidirectional sync - Firebase is the source of truth
  static async bidirectionalSync(localData: {
    pedidos: any[],
    sabores: any[],
    rellenos: any[],
    settings: any
  }): Promise<{
    pedidos: any[],
    sabores: any[],
    rellenos: any[],
    settings: any
  }> {
    try {
      // Get remote data from Firebase (source of truth)
      const remotePedidos = await this.getPedidosFromFirebase();
      const remoteSabores = await this.getSaboresFromFirebase();
      const remoteRellenos = await this.getRellenosFromFirebase();
      const remoteSettings = await this.getSettingsFromFirebase();

      // Firebase is the source of truth - use remote data
      const mergedPedidos = this.mergePedidos(localData.pedidos, remotePedidos);
      const mergedSettings = remoteSettings || localData.settings;

      // IMPORTANT: no subir pedidos locales en esta fase para evitar
      // recrear duplicados remotos. Las escrituras se realizan solo en
      // crear/actualizar/eliminar individuales del flujo de la app.
      // Skip syncing sabores and rellenos - Firebase is source of truth

      console.log('🔄 Firebase sync: Using Firebase as source of truth');
      console.log(`📊 Remote sabores: ${remoteSabores.length}, Remote rellenos: ${remoteRellenos.length}`);

      return {
        pedidos: mergedPedidos,
        sabores: remoteSabores, // Use Firebase data
        rellenos: remoteRellenos, // Use Firebase data
        settings: mergedSettings
      };
    } catch (error) {
      console.error('Error en sincronización bidireccional:', error);
      // Return local data if sync fails
      return localData;
    }
  }

  private static mergePedidos(local: any[], remote: any[]): any[] {
    const merged = [...local];
    const localIds = new Set(local.map(p => p.id));

    // Add remote pedidos that don't exist locally
    remote.forEach(remotePedido => {
      if (!localIds.has(remotePedido.id)) {
        merged.push(remotePedido);
      }
    });

    return merged;
  }
}

// Hybrid database service that combines local storage (for images)
// with Firebase sync (for other data)
export class HybridDatabase {
  private static initialized = false;

  static async initialize(): Promise<void> {
    console.log('🔍 HybridDatabase.initialize() called, FIREBASE_ENABLED =', FIREBASE_ENABLED);
    if (!this.initialized) {
      if (FIREBASE_ENABLED) {
        console.log('🔄 Inicializando FirebaseSync...');
        await FirebaseSync.initialize();
        console.log('✅ FirebaseSync inicializado');
      } else {
        console.log('Firebase disabled - running in local-only mode');
      }
      this.initialized = true;
      console.log('✅ HybridDatabase inicializado');
    } else {
      console.log('ℹ️ HybridDatabase ya estaba inicializado');
    }
  }

  static async reinitialize(): Promise<void> {
    console.log('🔄 HybridDatabase.reinitialize() - Forzando reinicialización...');
    this.initialized = false;
    await this.initialize();
  }

  // Enhanced pedido operations with image handling
  static async savePedido(pedido: any): Promise<void> {
    // Save image locally if exists
    if (pedido.imagen) {
      LocalImageManager.saveImageReference(pedido.id, pedido.imagen);
    }

    // Save pedido data to Firebase only if enabled
    if (FIREBASE_ENABLED) {
      await FirebaseSync.syncPedidoToFirebase(pedido);
    }
  }

  static async getPedido(id: number): Promise<any | null> {
    if (!FIREBASE_ENABLED || !db) {
      return null;
    }

    const docRef = doc(db, 'pedidos', `${FirebaseSync.getUserId()}_${id}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as FirebasePedido;
      // Add local image if exists
      const localImage = LocalImageManager.getImagePath(data.id);
      return {
        ...data,
        imagen: localImage
      };
    }

    return null;
  }

  static async getAllPedidos(): Promise<any[]> {
    if (!FIREBASE_ENABLED) {
      return [];
    }

    const pedidos = await FirebaseSync.getPedidosFromFirebase();
    // Images are already added in FirebaseSync.getPedidosFromFirebase()
    return pedidos;
  }

  // Settings operations
  static async saveSettings(settings: any): Promise<void> {
    if (!FIREBASE_ENABLED) {
      console.log('Firebase disabled - settings not synced to cloud');
      return;
    }

    await FirebaseSync.syncSettingsToFirebase(settings);
  }

  static async getSettings(): Promise<any | null> {
    if (!FIREBASE_ENABLED) {
      return null;
    }

    return await FirebaseSync.getSettingsFromFirebase();
  }

  // Sabores operations
  static async getAllSabores(): Promise<any[]> {
    if (!FIREBASE_ENABLED) {
      console.log('Firebase disabled - returning empty sabores array');
      return [];
    }

    try {
      const sabores = await FirebaseSync.getSaboresFromFirebase();
      console.log(`📊 HybridDatabase.getAllSabores(): Obtenidos ${sabores.length} sabores de Firebase`);
      return sabores;
    } catch (error) {
      console.error('❌ Error getting sabores from HybridDatabase:', error);
      return [];
    }
  }

  // Rellenos operations
  static async getAllRellenos(): Promise<any[]> {
    if (!FIREBASE_ENABLED) {
      console.log('Firebase disabled - returning empty rellenos array');
      return [];
    }

    try {
      const rellenos = await FirebaseSync.getRellenosFromFirebase();
      console.log(`📊 HybridDatabase.getAllRellenos(): Obtenidos ${rellenos.length} rellenos de Firebase`);
      return rellenos;
    } catch (error) {
      console.error('❌ Error getting rellenos from HybridDatabase:', error);
      return [];
    }
  }

  // Utility methods
  static getImagePath(pedidoId: number): string | null {
    return LocalImageManager.getImagePath(pedidoId);
  }

  static deleteImageReference(pedidoId: number): void {
    LocalImageManager.deleteImageReference(pedidoId);
  }

  // Push Notifications Methods (only work when Firebase is enabled)
  static async getPushToken(): Promise<string | null> {
    if (!FIREBASE_ENABLED || !messaging) {
      console.log('Push notifications disabled (Firebase not configured)');
      return null;
    }

    try {
      const token = await getToken(messaging, {
        vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY || 'your-vapid-key'
      });
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static setupPushNotificationListener(callback: (payload: any) => void): () => void {
    if (!FIREBASE_ENABLED || !messaging) {
      console.log('Push notification listener disabled (Firebase not configured)');
      return () => {};
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Push notification received:', payload);
      callback(payload);
    });

    return unsubscribe;
  }

  static async sendPushNotification(token: string, title: string, body: string, data?: any): Promise<boolean> {
    if (!FIREBASE_ENABLED) {
      console.log('Push notification sending disabled (Firebase not configured)');
      return false;
    }

    try {
      // This would typically be done from a server-side function
      // For client-side, you'd need to use Firebase Functions or a backend service
      console.log('Push notification would be sent to:', token, { title, body, data });
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Clear all sabores from Firebase (for cleanup)
  static async clearAllSabores(): Promise<void> {
    const userId = FirebaseSync.getUserId();
    if (!userId) return;

    try {
      const q = query(
        collection(db, 'sabores'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`🧹 Eliminados ${querySnapshot.docs.length} sabores de Firebase`);
    } catch (error) {
      console.error('❌ Error limpiando sabores de Firebase:', error);
      throw error;
    }
  }

  // Clear all rellenos from Firebase (for cleanup)
  static async clearAllRellenos(): Promise<void> {
    const userId = FirebaseSync.getUserId();
    if (!userId) return;

    try {
      const q = query(
        collection(db, 'rellenos'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`🧹 Eliminados ${querySnapshot.docs.length} rellenos de Firebase`);
    } catch (error) {
      console.error('❌ Error limpiando rellenos de Firebase:', error);
      throw error;
    }
  }

  // Clear all pedidos from Firebase (for cleanup)
  static async clearAllPedidos(): Promise<void> {
    const userId = FirebaseSync.getUserId();
    if (!userId) return;

    try {
      const q = query(
        collection(db, 'pedidos'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`🧹 Eliminados ${querySnapshot.docs.length} pedidos de Firebase`);
    } catch (error) {
      console.error('❌ Error limpiando pedidos de Firebase:', error);
      throw error;
    }
  }
}

export default HybridDatabase;
