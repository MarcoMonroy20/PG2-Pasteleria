import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Colors from '../constants/Colors';

interface NotificationStatus {
  permissions: string;
  canSchedule: boolean;
  canPresent: boolean;
  scheduledCount: number;
}

export default function NotificationDebugger() {
  const [status, setStatus] = useState<NotificationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const checkNotificationStatus = async () => {
    setLoading(true);
    try {
      const permissions = await Notifications.getPermissionsAsync();
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      setStatus({
        permissions: (permissions as any).granted ? 'granted' : 'denied',
        canSchedule: (permissions as any).granted,
        canPresent: (permissions as any).granted,
        scheduledCount: scheduled.length
      });
    } catch (error) {
      console.error('Error checking notification status:', error);
      Alert.alert('Error', `Error checking status: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const result = await Notifications.requestPermissionsAsync();
      Alert.alert('Permisos', `Estado: ${(result as any).granted ? 'granted' : 'denied'}`);
      checkNotificationStatus();
    } catch (error) {
      Alert.alert('Error', `Error requesting permissions: ${error}`);
    }
  };

  const testBasicNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Básico',
          body: 'Esta es una prueba básica',
          data: { test: 'basic' }
        },
        trigger: null,
      });
      Alert.alert('Éxito', 'Notificación básica enviada');
    } catch (error) {
      Alert.alert('Error', `Error básico: ${error}`);
    }
  };

  const testScheduledNotification = async () => {
    try {
      const trigger = { type: 'timeInterval', seconds: 5 }; // 5 segundos
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Programado',
          body: 'Esta notificación fue programada para 5 segundos',
          data: { test: 'scheduled' }
        },
        trigger
      });
      Alert.alert('Éxito', `Notificación programada con ID: ${id}`);
      checkNotificationStatus();
    } catch (error) {
      Alert.alert('Error', `Error programando: ${error}`);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('Éxito', 'Todas las notificaciones canceladas');
      checkNotificationStatus();
    } catch (error) {
      Alert.alert('Error', `Error cancelando: ${error}`);
    }
  };

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔔 Debugger de Notificaciones</Text>
        <Text style={styles.warning}>⚠️ Web no soporta notificaciones programadas</Text>
        <TouchableOpacity style={styles.button} onPress={testBasicNotification}>
          <Text style={styles.buttonText}>Probar Notificación Web</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Debugger de Notificaciones</Text>
      
      {status && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>📋 Estado:</Text>
          <Text style={styles.statusItem}>Permisos: {status.permissions}</Text>
          <Text style={styles.statusItem}>Puede programar: {status.canSchedule ? '✅' : '❌'}</Text>
          <Text style={styles.statusItem}>Puede mostrar: {status.canPresent ? '✅' : '❌'}</Text>
          <Text style={styles.statusItem}>Programadas: {status.scheduledCount}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={checkNotificationStatus}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verificando...' : 'Verificar Estado'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Solicitar Permisos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testBasicNotification}>
          <Text style={styles.buttonText}>Test Básico</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testScheduledNotification}>
          <Text style={styles.buttonText}>Test Programado (5s)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearAllNotifications}>
          <Text style={styles.buttonText}>Limpiar Todas</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  warning: {
    color: Colors.light.tint,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  statusContainer: {
    backgroundColor: Colors.light.tabIconDefault + '20',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  statusText: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.light.text,
  },
  statusItem: {
    color: Colors.light.text,
    marginBottom: 4,
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    backgroundColor: Colors.light.tint,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dangerButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
