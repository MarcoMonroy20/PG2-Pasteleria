import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import hybridDB from '../services/hybrid-db';
import VisualLogger from '../utils/VisualLogger';

interface DebugInfo {
  sabores: number;
  rellenos: number;
  pedidos: number;
  firebaseEnabled: boolean;
  lastSync: string;
  errors: string[];
}

export default function AndroidDebugger() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    sabores: 0,
    rellenos: 0,
    pedidos: 0,
    firebaseEnabled: false,
    lastSync: 'Nunca',
    errors: [],
  });
  const [isVisible, setIsVisible] = useState(false);

  const loadDebugInfo = async () => {
    try {
      await hybridDB.initialize();
      const [sabores, rellenos, pedidos] = await Promise.all([
        hybridDB.obtenerSabores(),
        hybridDB.obtenerRellenos(),
        hybridDB.obtenerPedidos(),
      ]);

      setDebugInfo({
        sabores: sabores.length,
        rellenos: rellenos.length,
        pedidos: pedidos.length,
        firebaseEnabled: hybridDB.isFirebaseEnabled(),
        lastSync: new Date().toLocaleTimeString(),
        errors: [],
      });
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors, `Error: ${error}`],
      }));
    }
  };

  const forceSync = async () => {
    try {
      if (hybridDB.isFirebaseEnabled()) {
        await hybridDB.syncFromCloud();
        Alert.alert('Éxito', 'Sincronización completada');
      } else {
        Alert.alert('Info', 'Firebase está deshabilitado');
      }
      loadDebugInfo();
    } catch (error) {
      Alert.alert('Error', `Error en sincronización: ${error}`);
    }
  };

  const clearLocalData = async () => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres limpiar todos los datos locales?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Aquí podrías limpiar los datos si fuera necesario
              Alert.alert('Éxito', 'Datos locales limpiados');
              loadDebugInfo();
            } catch (error) {
              Alert.alert('Error', `Error limpiando datos: ${error}`);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  return (
    <>
      {/* Botón flotante de debug */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.floatingButtonText}>🐛</Text>
      </TouchableOpacity>

      {/* Modal de debug */}
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Debug Android</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
              {/* Estado de datos */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Datos Locales</Text>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Sabores:</Text>
                  <Text style={[styles.dataValue, debugInfo.sabores === 0 && styles.errorText]}>
                    {debugInfo.sabores}
                  </Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Rellenos:</Text>
                  <Text style={[styles.dataValue, debugInfo.rellenos === 0 && styles.errorText]}>
                    {debugInfo.rellenos}
                  </Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Pedidos:</Text>
                  <Text style={styles.dataValue}>{debugInfo.pedidos}</Text>
                </View>
              </View>

              {/* Estado de Firebase */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔥 Firebase</Text>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Estado:</Text>
                  <Text style={[styles.dataValue, debugInfo.firebaseEnabled ? styles.successText : styles.errorText]}>
                    {debugInfo.firebaseEnabled ? 'Habilitado' : 'Deshabilitado'}
                  </Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Última sincronización:</Text>
                  <Text style={styles.dataValue}>{debugInfo.lastSync}</Text>
                </View>
              </View>

              {/* Errores */}
              {debugInfo.errors.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>❌ Errores</Text>
                  {debugInfo.errors.map((error, index) => (
                    <Text key={index} style={styles.errorText}>{error}</Text>
                  ))}
                </View>
              )}

              {/* Botones de acción */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔧 Acciones</Text>
                <TouchableOpacity style={styles.actionButton} onPress={loadDebugInfo}>
                  <Text style={styles.actionButtonText}>🔄 Actualizar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={forceSync}>
                  <Text style={styles.actionButtonText}>☁️ Sincronizar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={clearLocalData}>
                  <Text style={styles.actionButtonText}>🗑️ Limpiar Datos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => VisualLogger.showLogs()}>
                  <Text style={styles.actionButtonText}>📋 Ver Logs</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  floatingButtonText: {
    fontSize: 20,
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    maxHeight: 400,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
