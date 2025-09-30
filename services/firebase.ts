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

// Initialize anonymous authentication (only if Firebase is enabled)
export const initFirebaseAuth = async (): Promise<string | null> => {
  if (!FIREBASE_ENABLED || !auth) {
    console.log('Firebase authentication disabled');
    return null;
  }

  console.log('🔐 Iniciando autenticación anónima de Firebase...');

  return new Promise((resolve) => {
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.error('❌ Timeout en autenticación Firebase (10s)');
      console.error('🔧 Posible bloqueo de red o adblocker');
      resolve(null);
    }, 10000);

    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ Usuario autenticado:', user.uid);
        clearTimeout(timeout);
        resolve(user.uid);
      } else {
        console.log('🔐 Iniciando sesión anónima...');
        // Sign in anonymously
        signInAnonymously(auth)
          .then((result) => {
            console.log('✅ Autenticación anónima exitosa:', result.user.uid);
            clearTimeout(timeout);
            resolve(result.user.uid);
          })
          .catch((error) => {
            console.error('❌ Error en autenticación Firebase:', error);
            console.error('🔧 Código de error:', error.code);
            console.error('🔧 Mensaje:', error.message);
            
            // Check for specific error types
            if (error.code === 'auth/network-request-failed') {
              console.error('🌐 Error de red: Verificar conexión a internet');
            } else if (error.code === 'auth/too-many-requests') {
              console.error('🚫 Demasiadas solicitudes: Esperar un momento');
            } else if (error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
              console.error('🚫 Bloqueado por cliente (adblocker/firewall)');
              console.error('💡 Solución: Desactivar adblocker o firewall temporalmente');
            }
            
            clearTimeout(timeout);
            resolve(null);
          });
      }
    });
  });
};

// Types for Firebase documents (without images)
export interface FirebasePedido {
  id: number;
  fecha_entrega: string;
  nombre: string;
  precio_final: number;
  monto_abonado: number;
  descripcion?: string;
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

  static async initialize(): Promise<void> {
    console.log('🔐 FirebaseSync.initialize() - Iniciando autenticación...');
    try {
      this.userId = await initFirebaseAuth();
      console.log('✅ FirebaseSync.initialize() - Autenticación completada:', this.userId);
    } catch (error) {
      console.error('❌ FirebaseSync.initialize() - Error en autenticación:', error);
      this.userId = null;
    }
  }

  static getUserId(): string | null {
    return this.userId;
  }

  static async reinitialize(): Promise<void> {
    console.log('🔄 FirebaseSync.reinitialize() - Reinicializando autenticación...');
    this.userId = null;
    await this.initialize();
  }

  // Convert local pedido to Firebase format (remove image)
  static localPedidoToFirebase(localPedido: any): Omit<FirebasePedido, 'userId' | 'created_at' | 'updated_at'> {
    const { imagen, ...pedidoWithoutImage } = localPedido;
    return {
      ...pedidoWithoutImage,
      productos: JSON.parse(JSON.stringify(pedidoWithoutImage.productos || []))
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

  // Get pedidos from Firebase
  static async getPedidosFromFirebase(): Promise<any[]> {
    if (!this.userId) return [];

    const q = query(
      collection(db, 'pedidos'),
      where('userId', '==', this.userId),
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
    if (!this.userId) return null;

    const docRef = doc(db, 'settings', this.userId);
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

  // Bidirectional sync - merge local and remote data
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
      // Get remote data
      const remotePedidos = await this.getPedidosFromFirebase();
      const remoteSettings = await this.getSettingsFromFirebase();

      // Merge logic: local data takes precedence for conflicts
      const mergedPedidos = this.mergePedidos(localData.pedidos, remotePedidos);
      const mergedSettings = remoteSettings || localData.settings;

      // Sync local data to Firebase
      await this.syncPedidosToFirebase(localData.pedidos);
      await this.syncSaboresToFirebase(localData.sabores);
      await this.syncRellenosToFirebase(localData.rellenos);
      await this.syncSettingsToFirebase(localData.settings);

      return {
        pedidos: mergedPedidos,
        sabores: localData.sabores, // Keep local for now
        rellenos: localData.rellenos, // Keep local for now
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
}

export default HybridDatabase;
