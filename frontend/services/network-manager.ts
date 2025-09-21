// Network Manager - Detecta conexión a internet y maneja sincronización offline
import { NetInfoStateType, useNetInfo } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface NetworkStatus {
  isConnected: boolean;
  type: NetInfoStateType;
  isInternetReachable: boolean | null;
}

export interface PendingSyncItem {
  id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: 'pedidos' | 'sabores' | 'rellenos' | 'settings';
  data: any;
  timestamp: number;
  retryCount: number;
}

class NetworkManager {
  private static instance: NetworkManager;
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private pendingSyncQueue: PendingSyncItem[] = [];
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  private constructor() {
    this.initializeNetworkDetection();
    this.loadPendingSyncQueue();
  }

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  private async initializeNetworkDetection() {
    // Para React Native, usamos NetInfo
    if (Platform.OS !== 'web') {
      const NetInfo = require('@react-native-community/netinfo');
      const unsubscribe = NetInfo.addEventListener(state => {
        const newStatus: NetworkStatus = {
          isConnected: state.isConnected ?? false,
          type: state.type,
          isInternetReachable: state.isInternetReachable
        };

        this.handleNetworkChange(newStatus);
      });

      // Cleanup function
      return unsubscribe;
    } else {
      // Para web, usamos navigator.onLine
      this.handleNetworkChange({
        isConnected: navigator.onLine,
        type: 'wifi' as NetInfoStateType,
        isInternetReachable: navigator.onLine
      });

      window.addEventListener('online', () => {
        this.handleNetworkChange({
          isConnected: true,
          type: 'wifi' as NetInfoStateType,
          isInternetReachable: true
        });
      });

      window.addEventListener('offline', () => {
        this.handleNetworkChange({
          isConnected: false,
          type: 'none' as NetInfoStateType,
          isInternetReachable: false
        });
      });
    }
  }

  private handleNetworkChange(status: NetworkStatus) {
    const wasOffline = !this.isOnline;
    const isNowOnline = status.isConnected && status.isInternetReachable !== false;

    this.isOnline = isNowOnline;

    // Notificar a todos los listeners
    this.listeners.forEach(listener => listener(status));

    // Si acabamos de recuperar conexión, iniciar sincronización
    if (wasOffline && isNowOnline && this.pendingSyncQueue.length > 0) {
      console.log('🔄 Conexión recuperada, iniciando sincronización automática...');
      this.processPendingSyncQueue();
    }

    console.log(`📡 Estado de red: ${isNowOnline ? 'ONLINE' : 'OFFLINE'} (${status.type})`);
  }

  // Gestión de listeners
  addNetworkListener(callback: (status: NetworkStatus) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Gestión de cola de sincronización
  addToSyncQueue(item: Omit<PendingSyncItem, 'id' | 'timestamp' | 'retryCount'>) {
    if (!this.isOnline) {
      const syncItem: PendingSyncItem = {
        ...item,
        id: `${item.collection}_${item.operation}_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        retryCount: 0
      };

      this.pendingSyncQueue.push(syncItem);
      this.savePendingSyncQueue();

      console.log(`📝 Agregado a cola de sincronización: ${item.operation} ${item.collection}`);
    }
  }

  private async processPendingSyncQueue() {
    if (this.syncInProgress || this.pendingSyncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`🔄 Procesando ${this.pendingSyncQueue.length} elementos en cola de sincronización...`);

    const itemsToProcess = [...this.pendingSyncQueue];
    const successfulSyncs: string[] = [];
    const failedSyncs: string[] = [];

    for (const item of itemsToProcess) {
      try {
        await this.syncItem(item);
        successfulSyncs.push(item.id);
        console.log(`✅ Sincronizado: ${item.operation} ${item.collection}`);
      } catch (error) {
        item.retryCount++;

        if (item.retryCount < 3) {
          console.log(`⚠️ Reintento ${item.retryCount}/3 para: ${item.operation} ${item.collection}`);
          // Mantener en cola para reintento
        } else {
          console.error(`❌ Error permanente en sincronización: ${item.operation} ${item.collection}`, error);
          failedSyncs.push(item.id);
        }
      }
    }

    // Remover elementos exitosos y fallidos permanentemente
    this.pendingSyncQueue = this.pendingSyncQueue.filter(item =>
      !successfulSyncs.includes(item.id) && !failedSyncs.includes(item.id)
    );

    this.savePendingSyncQueue();
    this.syncInProgress = false;

    console.log(`📊 Sincronización completada: ${successfulSyncs.length} exitosos, ${failedSyncs.length} fallidos`);

    // Si aún hay elementos en cola, intentar de nuevo en 30 segundos
    if (this.pendingSyncQueue.length > 0) {
      setTimeout(() => this.processPendingSyncQueue(), 30000);
    }
  }

  private async syncItem(item: PendingSyncItem) {
    const { HybridDatabase } = await import('./firebase');

    switch (item.collection) {
      case 'pedidos':
        if (item.operation === 'CREATE' || item.operation === 'UPDATE') {
          await HybridDatabase.savePedido(item.data);
        }
        break;

      case 'sabores':
        if (item.operation === 'CREATE') {
          await HybridDatabase.syncSaboresToFirebase([item.data]);
        }
        break;

      case 'rellenos':
        if (item.operation === 'CREATE') {
          await HybridDatabase.syncRellenosToFirebase([item.data]);
        }
        break;

      case 'settings':
        if (item.operation === 'UPDATE') {
          await HybridDatabase.saveSettings(item.data);
        }
        break;
    }
  }

  private savePendingSyncQueue() {
    try {
      localStorage.setItem('pasteleria_pending_sync', JSON.stringify(this.pendingSyncQueue));
    } catch (error) {
      console.error('Error guardando cola de sincronización:', error);
    }
  }

  private loadPendingSyncQueue() {
    try {
      const stored = localStorage.getItem('pasteleria_pending_sync');
      if (stored) {
        this.pendingSyncQueue = JSON.parse(stored);
        console.log(`📋 Cargados ${this.pendingSyncQueue.length} elementos pendientes de sincronización`);
      }
    } catch (error) {
      console.error('Error cargando cola de sincronización:', error);
    }
  }

  // Métodos públicos
  getCurrentStatus(): NetworkStatus {
    return {
      isConnected: this.isOnline,
      type: this.isOnline ? 'wifi' : 'none',
      isInternetReachable: this.isOnline
    };
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  getPendingSyncCount(): number {
    return this.pendingSyncQueue.length;
  }

  forceSyncNow(): void {
    if (this.isOnline && this.pendingSyncQueue.length > 0) {
      this.processPendingSyncQueue();
    }
  }

  clearSyncQueue(): void {
    this.pendingSyncQueue = [];
    this.savePendingSyncQueue();
    console.log('🗑️ Cola de sincronización limpiada');
  }
}

// Hook personalizado para usar en componentes React
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true
  });

  useEffect(() => {
    const networkManager = NetworkManager.getInstance();

    // Suscribirse a cambios de red
    const unsubscribe = networkManager.addNetworkListener(setNetworkStatus);

    // Obtener estado inicial
    setNetworkStatus(networkManager.getCurrentStatus());

    return unsubscribe;
  }, []);

  return networkStatus;
}

// Hook personalizado para sincronización pendiente
export function usePendingSync() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const networkManager = NetworkManager.getInstance();

    const updateCount = () => {
      setPendingCount(networkManager.getPendingSyncCount());
    };

    // Actualizar contador inicial
    updateCount();

    // Actualizar cada 5 segundos
    const interval = setInterval(updateCount, 5000);

    return () => clearInterval(interval);
  }, []);

  return pendingCount;
}

export default NetworkManager;
