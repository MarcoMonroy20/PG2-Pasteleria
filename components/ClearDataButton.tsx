import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import Colors from '../constants/Colors';

interface ClearDataButtonProps {
  onDataCleared?: () => void;
}

export default function ClearDataButton({ onDataCleared }: ClearDataButtonProps) {
  const clearAllLocalData = () => {
    Alert.alert(
      '🧹 Limpiar Datos Locales',
      'Esto eliminará todos los datos locales (sabores, rellenos, pedidos, etc.) y la aplicación iniciará desde cero. ¿Estás seguro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpiar Todo',
          style: 'destructive',
          onPress: () => {
            try {
              // Limpiar localStorage en web
              if (typeof window !== 'undefined' && window.localStorage) {
                const keysToRemove = [
                  'sabores',
                  'rellenos', 
                  'pedidos',
                  'settings',
                  'users',
                  'notifications',
                  'pending_sync_queue',
                  'last_sync_timestamp',
                  'user_session',
                  'app_settings',
                  'pasteleria_next_id'
                ];
                
                keysToRemove.forEach(key => {
                  window.localStorage.removeItem(key);
                });
                
                // Limpiar claves que empiecen con patrones específicos
                const allKeys = Object.keys(window.localStorage);
                allKeys.forEach(key => {
                  if (key.startsWith('pasteleria_') || key.startsWith('app_')) {
                    window.localStorage.removeItem(key);
                  }
                });
                
                console.log('🧹 Datos locales limpiados completamente');
                
                Alert.alert(
                  '✅ Datos Limpiados',
                  'Todos los datos locales han sido eliminados. La aplicación reiniciará desde cero.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        if (onDataCleared) {
                          onDataCleared();
                        }
                        // Recargar la página para aplicar cambios
                        if (typeof window !== 'undefined') {
                          window.location.reload();
                        }
                      }
                    }
                  ]
                );
              }
            } catch (error) {
              console.error('Error limpiando datos:', error);
              Alert.alert('Error', 'No se pudieron limpiar los datos locales');
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.button} onPress={clearAllLocalData}>
      <Text style={styles.buttonText}>🧹 Limpiar Datos Locales</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
