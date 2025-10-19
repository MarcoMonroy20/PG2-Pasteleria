import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus, usePendingSync } from '../services/network-manager';

interface OfflineIndicatorProps {
  style?: any;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ style }) => {
  const networkStatus = useNetworkStatus();
  const pendingCount = usePendingSync();

  // No mostrar nada si estamos online y no hay elementos pendientes
  if (networkStatus.isConnected && pendingCount === 0) {
    return null;
  }

  const getMessage = () => {
    if (!networkStatus.isConnected) {
      if (pendingCount > 0) {
        return `Sin conexión • ${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}`;
      }
      return 'Sin conexión a internet';
    }

    if (pendingCount > 0) {
      return `Sincronizando ${pendingCount} elemento${pendingCount !== 1 ? 's' : ''}`;
    }

    return '';
  };

  const getIcon = () => {
    // Usar nombres válidos de Ionicons (o castear a any)
    if (!networkStatus.isConnected) return 'wifi' as any; // fallback válido
    return 'cloud-upload' as any;
  };

  const getBackgroundColor = () => {
    if (!networkStatus.isConnected) return '#FF6B6B'; // Rojo para offline
    return '#4ECDC4'; // Verde azulado para sincronizando
  };

  const message = getMessage();

  if (!message) return null;

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }, style]}>
      <Ionicons name={getIcon()} size={16} color="white" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default OfflineIndicator;
