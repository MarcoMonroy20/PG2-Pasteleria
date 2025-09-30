import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import hybridDB from '../services/hybrid-db';
import { useNetworkStatus, usePendingSync } from '../services/network-manager';

interface FirebaseStatusProps {
  style?: any;
  showText?: boolean;
  showPendingCount?: boolean;
}

const FirebaseStatus: React.FC<FirebaseStatusProps> = ({
  style,
  showText = true,
  showPendingCount = true
}) => {
  const [firebaseEnabled, setFirebaseEnabled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const networkStatus = useNetworkStatus();
  const pendingCount = usePendingSync();

  useEffect(() => {
    const checkFirebase = async () => {
      const enabled = hybridDB.isFirebaseEnabled();
      setFirebaseEnabled(enabled);

      if (enabled) {
        const uid = await hybridDB.getFirebaseUserId();
        setUserId(uid);
      }
    };

    checkFirebase();
  }, []);

  const getStatusColor = () => {
    if (firebaseEnabled && networkStatus.isConnected) return '#4CAF50'; // Verde - Online
    if (firebaseEnabled && !networkStatus.isConnected) return '#FF9800'; // Naranja - Offline pero Firebase habilitado
    return '#9E9E9E'; // Gris - Sin Firebase
  };

  const getStatusText = () => {
    if (!firebaseEnabled) return 'Solo local';

    if (networkStatus.isConnected) {
      return pendingCount > 0 ? `En línea (${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''})` : 'En línea';
    } else {
      return pendingCount > 0 ? `Fuera de línea (${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''})` : 'Fuera de línea';
    }
  };

  const getStatusIcon = () => {
    if (!firebaseEnabled) return 'phone-portrait';

    if (networkStatus.isConnected) {
      return pendingCount > 0 ? 'cloud-upload' : 'cloud-done';
    } else {
      return pendingCount > 0 ? 'cloud-offline' : 'cloud-offline';
    }
  };

  return (
    <View style={[{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 4,
    }, style]}>
      <Ionicons
        name={getStatusIcon()}
        size={16}
        color={getStatusColor()}
      />
      {showText && (
        <Text style={{
          marginLeft: 4,
          fontSize: 12,
          color: getStatusColor(),
          fontWeight: '500'
        }}>
          {getStatusText()}
        </Text>
      )}
    </View>
  );
};

export default FirebaseStatus;
