import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import hybridDB from '../services/hybrid-db';
import { usePendingSync } from '../services/network-manager';

interface SyncButtonProps {
  style?: any;
  size?: number;
  showText?: boolean;
  showPendingCount?: boolean;
}

const SyncButton: React.FC<SyncButtonProps> = ({
  style,
  size = 24,
  showText = true,
  showPendingCount = true
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [firebaseEnabled, setFirebaseEnabled] = useState(false);
  const pendingCount = usePendingSync();

  useEffect(() => {
    setFirebaseEnabled(hybridDB.isFirebaseEnabled());
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;

    if (!firebaseEnabled) {
      Alert.alert(
        'Sincronización no disponible',
        'Firebase no está configurado correctamente. Las imágenes permanecerán locales y otros datos se sincronizarán cuando Firebase esté disponible.'
      );
      return;
    }

    setIsSyncing(true);

    try {
      // Si hay elementos pendientes y estamos offline, mostrar opción de forzar
      if (pendingCount > 0 && !hybridDB.isOnline()) {
        Alert.alert(
          'Sincronización pendiente',
          `Tienes ${pendingCount} elemento${pendingCount !== 1 ? 's' : ''} esperando sincronización. Se sincronizarán automáticamente cuando recuperes la conexión a internet.`,
          [
            {
              text: 'Entendido',
              style: 'default',
              onPress: () => setIsSyncing(false)
            },
            {
              text: 'Limpiar cola',
              style: 'destructive',
              onPress: () => {
                hybridDB.clearPendingSync();
                Alert.alert('Éxito', 'Cola de sincronización limpiada.');
                setIsSyncing(false);
              }
            }
          ]
        );
        return;
      }

      Alert.alert(
        'Sincronización',
        pendingCount > 0
          ? `Hay ${pendingCount} elemento${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''} de sincronización. ¿Qué deseas hacer?`
          : '¿Qué tipo de sincronización deseas realizar?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setIsSyncing(false)
          },
          {
            text: 'Forzar subida',
            onPress: async () => {
              try {
                hybridDB.forceSyncNow();
                Alert.alert('Éxito', 'Sincronización forzada iniciada.');
              } catch (error) {
                Alert.alert('Error', 'No se pudo iniciar la sincronización.');
              } finally {
                setIsSyncing(false);
              }
            }
          },
          {
            text: 'Subir datos',
            onPress: async () => {
              try {
                console.log('🔄 Iniciando sincronización a la nube...');
                
                // Crear timeout de 30 segundos
                const syncPromise = hybridDB.syncToCloud();
                const timeoutPromise = new Promise((_, reject) => {
                  setTimeout(() => reject(new Error('Timeout: La sincronización tardó más de 30 segundos')), 30000);
                });
                
                await Promise.race([syncPromise, timeoutPromise]);
                
                console.log('✅ Sincronización completada exitosamente');
                Alert.alert('✅ Éxito', 'Datos sincronizados a la nube correctamente.');
              } catch (error) {
                console.error('❌ Error de sincronización:', error);
                
                // Mostrar error específico
                let errorMessage = 'No se pudieron sincronizar los datos a la nube.';
                if (error && typeof error === 'object') {
                  if ('message' in error && typeof error.message === 'string') {
                    errorMessage = `Error: ${error.message}`;
                  } else if ('code' in error) {
                    errorMessage = `Error de Firebase: ${error.code}`;
                  }
                } else if (typeof error === 'string') {
                  errorMessage = error;
                }
                
                // Verificar si es problema de autenticación
                if (errorMessage.includes('userId') || errorMessage.includes('null')) {
                  errorMessage += '\n\n💡 Solución: Usar "Reinicializar Firebase" en Configuración';
                }
                
                Alert.alert('❌ Error', errorMessage);
              } finally {
                setIsSyncing(false);
              }
            }
          },
          {
            text: 'Descargar datos',
            onPress: async () => {
              try {
                await hybridDB.syncFromCloud();
                Alert.alert('Éxito', 'Datos descargados de la nube correctamente.');
              } catch (error) {
                Alert.alert('Error', 'No se pudieron descargar los datos de la nube.');
              } finally {
                setIsSyncing(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error de sincronización:', error);
      Alert.alert('Error', 'Ocurrió un error durante la sincronización.');
      setIsSyncing(false);
    }
  };

  const getButtonText = () => {
    if (isSyncing) return 'Sincronizando...';
    if (pendingCount > 0) return `Sincronizar (${pendingCount})`;
    return 'Sincronizar';
  };

  const getButtonIcon = () => {
    if (isSyncing) return 'refresh-circle';
    if (pendingCount > 0) return 'cloud-upload';
    return 'cloud-done';
  };

  const getButtonColor = () => {
    if (!firebaseEnabled) return '#9E9E9E'; // Gris
    if (pendingCount > 0) return '#FF9800'; // Naranja
    return '#007AFF'; // Azul
  };

  return (
    <TouchableOpacity
      onPress={handleSync}
      disabled={isSyncing}
      style={[{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        backgroundColor: isSyncing ? '#f0f0f0' : getButtonColor(),
      }, style]}
    >
      {isSyncing ? (
        <ActivityIndicator size="small" color={getButtonColor()} />
      ) : (
        <Ionicons
          name={getButtonIcon()}
          size={size}
          color={isSyncing ? getButtonColor() : 'white'}
        />
      )}
      {showText && (
        <Text style={{
          marginLeft: 8,
          color: isSyncing ? getButtonColor() : 'white',
          fontSize: 14,
          fontWeight: '600'
        }}>
          {getButtonText()}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default SyncButton;
