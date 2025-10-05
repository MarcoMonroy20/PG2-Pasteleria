// Sync Status Component
// Shows sync status for data and images

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '../constants/Colors';
import hybridDB from '../services/hybrid-db';
import HybridImageService from '../services/image-service';

interface SyncStatusProps {
  onSyncComplete?: () => void;
}

export default function SyncStatus({ onSyncComplete }: SyncStatusProps) {
  const colorScheme = useColorScheme();
  const [syncStatus, setSyncStatus] = useState({
    isOnline: false,
    pendingSync: 0,
    imageSync: {
      totalImages: 0,
      uploadedImages: 0,
      pendingUploads: 0,
      localOnlyImages: 0
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadSyncStatus();
    
    // Update status every 30 seconds
    const interval = setInterval(loadSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSyncStatus = async () => {
    try {
      const isOnline = hybridDB.isOnline();
      const pendingSync = hybridDB.getPendingSyncCount();
      const imageSync = await hybridDB.getImageSyncStatus();
      
      setSyncStatus({
        isOnline,
        pendingSync,
        imageSync
      });
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleSyncNow = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      await hybridDB.syncAllData();
      await loadSyncStatus();
      onSyncComplete?.();
      Alert.alert('Sincronización', 'Datos sincronizados exitosamente');
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Error', 'Error al sincronizar datos');
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return '#FF6B6B';
    if (syncStatus.pendingSync > 0 || syncStatus.imageSync.pendingUploads > 0) return '#FFA726';
    return '#4CAF50';
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Sin conexión';
    if (syncStatus.pendingSync > 0 || syncStatus.imageSync.pendingUploads > 0) return 'Pendiente';
    return 'Sincronizado';
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <View style={styles.statusRow}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <Text style={[styles.statusText, { color: Colors[colorScheme ?? 'light'].text }]}>
          {getStatusText()}
        </Text>
        {syncStatus.isOnline && (syncStatus.pendingSync > 0 || syncStatus.imageSync.pendingUploads > 0) && (
          <TouchableOpacity 
            style={[styles.syncButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={handleSyncNow}
            disabled={isSyncing}
          >
            <Text style={styles.syncButtonText}>
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {syncStatus.imageSync.totalImages > 0 && (
        <View style={styles.imageStatus}>
          <Text style={[styles.imageStatusText, { color: Colors[colorScheme ?? 'light'].text }]}>
            📷 Imágenes: {syncStatus.imageSync.uploadedImages}/{syncStatus.imageSync.totalImages} en la nube
          </Text>
          {syncStatus.imageSync.pendingUploads > 0 && (
            <Text style={[styles.pendingText, { color: Colors[colorScheme ?? 'light'].tint }]}>
              {syncStatus.imageSync.pendingUploads} pendientes
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  imageStatus: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  imageStatusText: {
    fontSize: 12,
    color: '#666',
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
