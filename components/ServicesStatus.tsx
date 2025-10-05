// Services Status Component
// Muestra el estado de Firebase y Cloudinary con botones de prueba

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '../constants/Colors';
import hybridDB from '../services/hybrid-db';
import { cloudinaryConfig, CLOUDINARY_ENABLED, CLOUDINARY_UPLOAD_URL } from '../cloudinary.config';
import HybridImageService from '../services/image-service';

interface ServiceStatus {
  name: string;
  enabled: boolean;
  connected: boolean;
  status: 'success' | 'warning' | 'error' | 'unknown';
  message: string;
  details?: string;
}

export default function ServicesStatus() {
  const colorScheme = useColorScheme();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  useEffect(() => {
    loadServicesStatus();
    
    // Update status every 30 seconds
    const interval = setInterval(loadServicesStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadServicesStatus = async () => {
    try {
      const newServices: ServiceStatus[] = [];

      // Firebase Status
      const firebaseEnabled = hybridDB.isFirebaseEnabled();
      const isOnline = hybridDB.isOnline();
      const pendingSync = hybridDB.getPendingSyncCount();
      
      let firebaseStatus: ServiceStatus['status'] = 'unknown';
      let firebaseMessage = '';
      let firebaseDetails = '';

      if (!firebaseEnabled) {
        firebaseStatus = 'warning';
        firebaseMessage = 'Firebase deshabilitado';
        firebaseDetails = 'Configurado para funcionar solo localmente';
      } else if (!isOnline) {
        firebaseStatus = 'warning';
        firebaseMessage = 'Sin conexión';
        firebaseDetails = `${pendingSync} elementos pendientes de sincronización`;
      } else if (pendingSync > 0) {
        firebaseStatus = 'warning';
        firebaseMessage = 'Sincronización pendiente';
        firebaseDetails = `${pendingSync} elementos en cola`;
      } else {
        firebaseStatus = 'success';
        firebaseMessage = 'Conectado y sincronizado';
        firebaseDetails = 'Todos los datos están actualizados';
      }

      newServices.push({
        name: 'Firebase',
        enabled: firebaseEnabled,
        connected: isOnline && firebaseEnabled,
        status: firebaseStatus,
        message: firebaseMessage,
        details: firebaseDetails
      });

      // Cloudinary Status
      let cloudinaryStatus: ServiceStatus['status'] = 'unknown';
      let cloudinaryMessage = '';
      let cloudinaryDetails = '';

      if (!CLOUDINARY_ENABLED) {
        cloudinaryStatus = 'warning';
        cloudinaryMessage = 'Cloudinary deshabilitado';
        cloudinaryDetails = 'Las imágenes se guardan solo localmente';
      } else if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
        cloudinaryStatus = 'error';
        cloudinaryMessage = 'Configuración incompleta';
        cloudinaryDetails = 'Faltan credenciales de Cloudinary';
      } else {
        // Check if upload URL is valid
        const isValidUrl = CLOUDINARY_UPLOAD_URL.includes('api.cloudinary.com') && 
                          CLOUDINARY_UPLOAD_URL.includes(cloudinaryConfig.cloudName);
        
        if (!isValidUrl) {
          cloudinaryStatus = 'error';
          cloudinaryMessage = 'URL de subida inválida';
          cloudinaryDetails = 'Verificar configuración de Cloud Name';
        } else {
          cloudinaryStatus = 'success';
          cloudinaryMessage = 'Configurado correctamente';
          cloudinaryDetails = `Cloud: ${cloudinaryConfig.cloudName}`;
        }
      }

      newServices.push({
        name: 'Cloudinary',
        enabled: CLOUDINARY_ENABLED,
        connected: CLOUDINARY_ENABLED && cloudinaryStatus === 'success',
        status: cloudinaryStatus,
        message: cloudinaryMessage,
        details: cloudinaryDetails
      });

      setServices(newServices);
    } catch (error) {
      console.error('Error loading services status:', error);
    }
  };

  const testFirebaseConnection = async () => {
    if (isTesting) return;
    
    setIsTesting('firebase');
    try {
      console.log('🧪 Testing Firebase connection...');
      
      if (!hybridDB.isFirebaseEnabled()) {
        Alert.alert('Firebase', 'Firebase está deshabilitado en la configuración');
        return;
      }

      if (!hybridDB.isOnline()) {
        Alert.alert('Firebase', 'Sin conexión a internet. Firebase requiere conexión para funcionar.');
        return;
      }

      // Test Firebase sync
      await hybridDB.syncAllData();
      await loadServicesStatus();
      
      Alert.alert('Firebase', '✅ Conexión exitosa - Datos sincronizados');
    } catch (error) {
      console.error('Firebase test error:', error);
      Alert.alert('Firebase', '❌ Error de conexión: ' + (error as Error).message);
    } finally {
      setIsTesting(null);
    }
  };

  const testCloudinaryConnection = async () => {
    if (isTesting) return;
    
    setIsTesting('cloudinary');
    try {
      console.log('🧪 Testing Cloudinary connection...');
      
      if (!CLOUDINARY_ENABLED) {
        Alert.alert('Cloudinary', 'Cloudinary está deshabilitado en la configuración');
        return;
      }

      if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
        Alert.alert('Cloudinary', '❌ Configuración incompleta. Verificar variables de entorno.');
        return;
      }

      // Test upload URL format
      const isValidUrl = CLOUDINARY_UPLOAD_URL.includes('api.cloudinary.com') && 
                        CLOUDINARY_UPLOAD_URL.includes(cloudinaryConfig.cloudName);
      
      if (!isValidUrl) {
        Alert.alert('Cloudinary', '❌ URL de subida inválida. Verificar Cloud Name.');
        return;
      }

      // Test image sync status
      const imageSyncStatus = await HybridImageService.getSyncStatus();
      
      Alert.alert(
        'Cloudinary', 
        `✅ Configuración válida\n\n` +
        `📊 Estado de imágenes:\n` +
        `• Total: ${imageSyncStatus.totalImages}\n` +
        `• En la nube: ${imageSyncStatus.uploadedImages}\n` +
        `• Pendientes: ${imageSyncStatus.pendingUploads}\n` +
        `• Solo locales: ${imageSyncStatus.localOnlyImages}`
      );
      
      await loadServicesStatus();
    } catch (error) {
      console.error('Cloudinary test error:', error);
      Alert.alert('Cloudinary', '❌ Error de conexión: ' + (error as Error).message);
    } finally {
      setIsTesting(null);
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FFA726';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
        🔧 Estado de Servicios
      </Text>
      
      <ScrollView style={styles.servicesContainer}>
        {services.map((service, index) => (
          <View key={index} style={[styles.serviceCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.serviceHeader}>
              <View style={styles.serviceInfo}>
                <View style={styles.serviceTitleRow}>
                  <Text style={[styles.serviceName, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {service.name}
                  </Text>
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(service.status) }]} />
                </View>
                <Text style={[styles.serviceMessage, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {getStatusIcon(service.status)} {service.message}
                </Text>
                <Text style={[styles.serviceDetails, { color: Colors[colorScheme ?? 'light'].inputText }]}>
                  {service.details}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.testButton, 
                  { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                  isTesting === service.name.toLowerCase() && styles.testButtonDisabled
                ]}
                onPress={service.name === 'Firebase' ? testFirebaseConnection : testCloudinaryConnection}
                disabled={isTesting !== null}
              >
                <Text style={styles.testButtonText}>
                  {isTesting === service.name.toLowerCase() ? 'Probando...' : 'Probar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: Colors[colorScheme ?? 'light'].inputText }]}>
          💡 Los servicios se actualizan automáticamente cada 30 segundos
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    margin: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  servicesContainer: {
    maxHeight: 400,
  },
  serviceCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  serviceMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  serviceDetails: {
    fontSize: 12,
    lineHeight: 16,
  },
  testButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
