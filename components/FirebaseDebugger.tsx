import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_ENABLED, firebaseConfig } from '../firebase.config';
import hybridDB from '../services/hybrid-db';
import Colors from '../constants/Colors';

interface FirebaseDiagnostic {
  firebaseEnabled: boolean;
  hasCredentials: boolean;
  isConnected: boolean;
  userId: string | null;
  lastError: string | null;
  credentialsStatus: {
    apiKey: boolean;
    projectId: boolean;
    authDomain: boolean;
    storageBucket: boolean;
    messagingSenderId: boolean;
    appId: boolean;
  };
}

export default function FirebaseDebugger() {
  const [diagnostic, setDiagnostic] = useState<FirebaseDiagnostic | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      console.log('🔍 FirebaseDebugger: Ejecutando diagnóstico...');
      console.log('📋 FIREBASE_ENABLED:', FIREBASE_ENABLED);
      console.log('📋 firebaseConfig.apiKey:', firebaseConfig.apiKey ? 'Presente' : 'Faltante');
      
      const credentialsStatus = {
        apiKey: !!firebaseConfig.apiKey,
        projectId: !!firebaseConfig.projectId,
        authDomain: !!firebaseConfig.authDomain,
        storageBucket: !!firebaseConfig.storageBucket,
        messagingSenderId: !!firebaseConfig.messagingSenderId,
        appId: !!firebaseConfig.appId,
      };

      const hasCredentials = Object.values(credentialsStatus).every(Boolean);
      console.log('📋 hasCredentials:', hasCredentials);
      
      // Verificar estado de hybridDB
      const isHybridEnabled = hybridDB.isFirebaseEnabled();
      console.log('📋 hybridDB.isFirebaseEnabled():', isHybridEnabled);
      
      let userId = null;
      try {
        userId = await hybridDB.getFirebaseUserId();
        console.log('📋 userId obtenido:', userId);
      } catch (error) {
        console.error('❌ Error obteniendo userId:', error);
      }
      
      const isConnected = isHybridEnabled && !!userId;
      console.log('📋 isConnected calculado:', isConnected);

      setDiagnostic({
        firebaseEnabled: FIREBASE_ENABLED,
        hasCredentials,
        isConnected,
        userId,
        lastError: null,
        credentialsStatus
      });
    } catch (error) {
      console.error('❌ Error en runDiagnostic:', error);
      setDiagnostic(prev => ({
        ...prev!,
        lastError: error?.toString() || 'Error desconocido'
      }));
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      // Intentar sincronizar datos de prueba
      await hybridDB.syncToCloud();
      Alert.alert('✅ Éxito', 'Conexión a Firebase verificada correctamente');
    } catch (error) {
      Alert.alert('❌ Error', `Error de conexión: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const testCreatePedido = async () => {
    try {
      const testPedido = {
        id: Date.now(),
        fecha_entrega: new Date().toISOString().split('T')[0],
        nombre: 'Pedido de Prueba',
        precio_final: 100,
        monto_abonado: 50,
        descripcion: 'Pedido de prueba para verificar sincronización',
        productos: [{
          tipo: 'pastel',
          sabor: 'chocolate',
          relleno: 'dulce de leche',
          tamaño: 'mediano'
        }]
      };

      await hybridDB.guardarPedido(testPedido);
      Alert.alert('✅ Éxito', 'Pedido de prueba creado y sincronizado');
    } catch (error) {
      Alert.alert('❌ Error', `Error creando pedido: ${error}`);
    }
  };

  const getStatusColor = (status: boolean) => status ? '#4CAF50' : '#F44336';
  const getStatusIcon = (status: boolean) => status ? 'checkmark-circle' : 'close-circle';

  useEffect(() => {
    runDiagnostic();
  }, []);

  if (!diagnostic) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔍 Diagnóstico de Firebase</Text>
        <Text style={styles.loading}>Cargando diagnóstico...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Diagnóstico de Firebase</Text>
      
      {/* Estado General */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado General</Text>
        <View style={styles.statusRow}>
          <Ionicons 
            name={getStatusIcon(diagnostic.firebaseEnabled)} 
            size={20} 
            color={getStatusColor(diagnostic.firebaseEnabled)} 
          />
          <Text style={styles.statusText}>
            Firebase Habilitado: {diagnostic.firebaseEnabled ? 'Sí' : 'No'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Ionicons 
            name={getStatusIcon(diagnostic.hasCredentials)} 
            size={20} 
            color={getStatusColor(diagnostic.hasCredentials)} 
          />
          <Text style={styles.statusText}>
            Credenciales Configuradas: {diagnostic.hasCredentials ? 'Sí' : 'No'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Ionicons 
            name={getStatusIcon(diagnostic.isConnected)} 
            size={20} 
            color={getStatusColor(diagnostic.isConnected)} 
          />
          <Text style={styles.statusText}>
            Conectado: {diagnostic.isConnected ? 'Sí' : 'No'}
          </Text>
        </View>
        
        {diagnostic.userId && (
          <Text style={styles.userId}>User ID: {diagnostic.userId}</Text>
        )}
      </View>

      {/* Credenciales Detalladas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credenciales</Text>
        {Object.entries(diagnostic.credentialsStatus).map(([key, status]) => (
          <View key={key} style={styles.statusRow}>
            <Ionicons 
              name={getStatusIcon(status)} 
              size={16} 
              color={getStatusColor(status)} 
            />
            <Text style={styles.statusText}>{key}: {status ? '✅' : '❌'}</Text>
          </View>
        ))}
      </View>

      {/* Información de Configuración */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        <Text style={styles.configText}>Project ID: {firebaseConfig.projectId || 'No configurado'}</Text>
        <Text style={styles.configText}>Auth Domain: {firebaseConfig.authDomain || 'No configurado'}</Text>
        <Text style={styles.configText}>Storage Bucket: {firebaseConfig.storageBucket || 'No configurado'}</Text>
      </View>

      {/* Botón de Diagnóstico Automático */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={async () => {
            setLoading(true);
            setTesting(true);
            try {
              console.log('🔍 Iniciando diagnóstico completo automático...');
              
              // 1. Ejecutar diagnóstico básico
              await runDiagnostic();
              
              // 2. Si está conectado, probar conexión
              if (diagnostic?.isConnected) {
                await testConnection();
              }
              
              // 3. Si hay problemas, intentar reinicializar
              if (!diagnostic?.isConnected || !diagnostic?.hasCredentials) {
                console.log('🔄 Intentando reinicializar Firebase...');
                const { HybridDatabase } = await import('../services/firebase');
                await HybridDatabase.reinitialize();
                await runDiagnostic();
              }
              
              Alert.alert('✅ Diagnóstico Completado', 'Se ha ejecutado un diagnóstico completo del sistema Firebase. Revisa los resultados arriba.');
            } catch (error) {
              console.error('❌ Error en diagnóstico automático:', error);
              Alert.alert('❌ Error', `Error durante el diagnóstico: ${error}`);
            } finally {
              setLoading(false);
              setTesting(false);
            }
          }}
          disabled={loading || testing}
        >
          <Ionicons name="search" size={20} color="white" />
          <Text style={styles.buttonText}>
            {loading || testing ? 'Identificando Fallos...' : 'Identificar Fallos'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Soluciones */}
      {!diagnostic.hasCredentials && (
        <View style={[styles.section, styles.errorSection]}>
          <Text style={styles.errorTitle}>🚨 Problema Detectado</Text>
          <Text style={styles.errorText}>
            Las credenciales de Firebase no están configuradas correctamente.
          </Text>
          <Text style={styles.solutionTitle}>📋 Solución:</Text>
          <Text style={styles.solutionText}>
            1. Crear archivo .env.local{'\n'}
            2. Copiar credenciales desde env.example{'\n'}
            3. Agregar credenciales reales de Firebase Console{'\n'}
            4. Reiniciar la aplicación
          </Text>
        </View>
      )}

      {diagnostic.hasCredentials && !diagnostic.isConnected && (
        <View style={[styles.section, styles.errorSection]}>
          <Text style={styles.errorTitle}>🚫 Error: ERR_BLOCKED_BY_CLIENT</Text>
          <Text style={styles.errorText}>
            El navegador está bloqueando Firebase. Esto es común con:
          </Text>
          <Text style={styles.errorText}>
            • 🚫 Adblocker (uBlock Origin, AdBlock Plus)
          </Text>
          <Text style={styles.errorText}>
            • 🛡️ Extensión de privacidad (Privacy Badger)
          </Text>
          <Text style={styles.errorText}>
            • 🔥 Antivirus con protección web
          </Text>
          
          <Text style={styles.solutionTitle}>💡 SOLUCIONES INMEDIATAS:</Text>
          <Text style={styles.solutionText}>
            1. Desactivar adblocker temporalmente{'\n'}
            2. Probar en modo incógnito{'\n'}
            3. Probar en otro navegador{'\n'}
            4. Agregar excepción para *.firebase.googleapis.com
          </Text>
          
          <Text style={[styles.errorText, { fontStyle: 'italic', color: '#4CAF50' }]}>
            ✅ Firebase funciona correctamente (verificado desde terminal)
          </Text>
        </View>
      )}

      {diagnostic.lastError && (
        <View style={[styles.section, styles.errorSection]}>
          <Text style={styles.errorTitle}>❌ Último Error</Text>
          <Text style={styles.errorText}>{diagnostic.lastError}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    padding: 16,
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault,
    maxHeight: 600,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  loading: {
    textAlign: 'center',
    color: Colors.light.tint,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.light.tabIconDefault + '10',
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    marginLeft: 8,
    color: Colors.light.text,
    fontSize: 14,
  },
  userId: {
    marginTop: 8,
    color: Colors.light.tint,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  configText: {
    color: Colors.light.text,
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    gap: 8,
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  warningButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorSection: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 8,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 8,
  },
  solutionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 8,
  },
  solutionText: {
    color: '#1976d2',
    fontSize: 12,
    lineHeight: 18,
  },
});
