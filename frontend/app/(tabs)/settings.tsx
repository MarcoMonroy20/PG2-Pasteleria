import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform, TextInput, Alert, ScrollView } from 'react-native';
import * as Notifications from 'expo-notifications';
import Colors from '../../constants/Colors';
import hybridDB from '../../services/hybrid-db';
import SyncButton from '../../components/SyncButton';
import FirebaseStatus from '../../components/FirebaseStatus';
import { enhancedNotifications } from '../../services/notifications';

type AppSettings = {
  notifications_enabled: boolean;
  days_before: number;
  contact_name?: string;
  company_name?: string;
  phone?: string;
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({ notifications_enabled: false, days_before: 0, contact_name: 'Raquel Alejandra Rousselin Pellecer', company_name: 'Sweet Cakes', phone: '53597287' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await hybridDB.initialize();
        const s = await hybridDB.obtenerSettings();
        if (s) {
          setSettings(s);
        }

        // Check push notifications status
        if (Platform.OS === 'web') {
          const token = await enhancedNotifications.getPushToken();
          const enabled = enhancedNotifications.isPushEnabled();
          setPushToken(token);
          setPushEnabled(enabled);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'web') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  };

  const toggleNotifications = async (value: boolean) => {
    const granted = value ? await requestPermissions() : true;
    const next = { ...settings, notifications_enabled: granted && value };
    setSettings(next);
    await hybridDB.guardarSettings(next);
  };

  const setDaysBefore = async (days: number) => {
    const next = { ...settings, days_before: Math.max(0, Math.min(7, days)) };
    setSettings(next);
    await hybridDB.guardarSettings(next);
  };

  const updateField = async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
  };

  const testPushNotification = async () => {
    if (Platform.OS === 'web' && pushEnabled && pushToken) {
      Alert.alert(
        'Probar Notificación Push',
        '¿Quieres enviar una notificación push de prueba?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Enviar',
            onPress: async () => {
              try {
                // For demo purposes, we'll show a local notification
                // In a real implementation, this would send to a server
                await Notifications.presentNotificationAsync({
                  title: '¡Prueba de Notificación!',
                  body: 'Esta es una notificación push de prueba',
                  data: { test: true },
                });
                Alert.alert('✅ Éxito', 'Notificación push enviada correctamente');
              } catch (error) {
                Alert.alert('❌ Error', 'No se pudo enviar la notificación push');
              }
            }
          }
        ]
      );
    } else if (Platform.OS !== 'web') {
      // Test local notification for native platforms
      try {
        await Notifications.presentNotificationAsync({
          title: '¡Prueba de Notificación!',
          body: 'Esta es una notificación local de prueba',
          data: { test: true },
        });
        Alert.alert('✅ Éxito', 'Notificación local enviada correctamente');
      } catch (error) {
        Alert.alert('❌ Error', 'No se pudo enviar la notificación');
      }
    } else {
      Alert.alert('❌ No disponible', 'Las notificaciones push no están configuradas para esta plataforma');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (settings.notifications_enabled) {
        const granted = await requestPermissions();
        if (!granted) {
          Platform.OS === 'web' ? alert('Activa permisos de notificaciones para recibir recordatorios.') : Alert.alert('Permisos', 'Activa permisos de notificaciones para recibir recordatorios.');
        }
      }
      await hybridDB.guardarSettings(settings);
      Platform.OS === 'web' ? alert('Configuración guardada') : Alert.alert('Éxito', 'Configuración guardada');
    } catch (e) {
      Platform.OS === 'web' ? alert('No se pudo guardar la configuración') : Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}><Text style={styles.subtitle}>Cargando…</Text></View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Configuración</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Activar notificaciones</Text>
          <Switch
            value={settings.notifications_enabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#E0E0E0', true: Colors.light.buttonPrimary }}
            thumbColor={settings.notifications_enabled ? Colors.light.buttonText : '#FFFFFF'}
          />
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>Días de anticipación</Text>
        <View style={styles.daysGrid}>
          {[0,1,2,3,4,5,6,7].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayChip, settings.days_before === d && styles.dayChipActive]}
              onPress={() => setDaysBefore(d)}
              disabled={!settings.notifications_enabled}
            >
              <Text style={[styles.dayChipText, settings.days_before === d && styles.dayChipTextActive]}>
                {d === 0 ? 'Mismo día' : `${d}d`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.helper}>Recibirás un recordatorio {settings.days_before === 0 ? 'el mismo día' : `${settings.days_before} día(s) antes`} de la entrega.</Text>

        {/* Push Notifications Status */}
        {Platform.OS === 'web' && (
          <View style={[styles.rowBetween, { marginTop: 16 }]}>
            <View>
              <Text style={styles.label}>Estado Push Notifications</Text>
              <Text style={[styles.helper, { fontSize: 12, marginTop: 4 }]}>
                {pushEnabled ? '✅ Habilitadas' : '❌ No disponibles'}
              </Text>
              {pushToken && (
                <Text style={[styles.helper, { fontSize: 10, marginTop: 2 }]}>
                  Token: {pushToken.substring(0, 20)}...
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.button, !pushEnabled && styles.buttonDisabled]}
              onPress={testPushNotification}
              disabled={!pushEnabled}
            >
              <Text style={[styles.buttonText, !pushEnabled && styles.buttonTextDisabled]}>
                Probar Push
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Test Notifications Button for all platforms */}
        {Platform.OS !== 'web' && (
          <TouchableOpacity
            style={[styles.button, { marginTop: 16 }]}
            onPress={testPushNotification}
          >
            <Text style={styles.buttonText}>Probar Notificación Local</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>Contacto para Cotizaciones</Text>
        <Text style={styles.label}>Nombre de contacto</Text>
        <TextInput
          style={styles.input}
          value={settings.contact_name || ''}
          onChangeText={(t) => updateField({ contact_name: t })}
          placeholder="Nombre completo"
          placeholderTextColor={Colors.light.inputText}
        />
        <Text style={[styles.label, { marginTop: 12 }]}>Empresa</Text>
        <TextInput
          style={styles.input}
          value={settings.company_name || ''}
          onChangeText={(t) => updateField({ company_name: t })}
          placeholder="Sweet Cakes"
          placeholderTextColor={Colors.light.inputText}
        />
        <Text style={[styles.label, { marginTop: 12 }]}>Teléfono</Text>
        <TextInput
          style={styles.input}
          value={settings.phone || ''}
          onChangeText={(t) => updateField({ phone: t.replace(/[^0-9+\s-]/g, '') })}
          keyboardType="phone-pad"
          placeholder="53597287"
          placeholderTextColor={Colors.light.inputText}
        />
      </View>

      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>Sincronización con la Nube</Text>

        <View style={styles.rowBetween}>
          <Text style={styles.label}>Estado de conexión</Text>
          <FirebaseStatus showText={true} />
        </View>

        <Text style={[styles.helper, { marginTop: 8 }]}>
          Las imágenes se guardan localmente para optimizar el rendimiento.
          Otros datos se sincronizan automáticamente con Firebase.
        </Text>

        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <SyncButton showText={true} />
        </View>
      </View>

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 50,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.light.titleColor,
  },
  subtitle: { fontSize: 16, color: Colors.light.inputText },
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.buttonSecondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.light.inputBackground,
    color: Colors.light.inputText,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.titleColor, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 16, color: Colors.light.titleColor },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    backgroundColor: Colors.light.background,
  },
  dayChipActive: { backgroundColor: Colors.light.buttonPrimary, borderColor: Colors.light.buttonPrimary },
  dayChipText: { color: Colors.light.inputText, fontWeight: '500' },
  dayChipTextActive: { color: Colors.light.buttonText, fontWeight: 'bold' },
  saveBtn: { marginTop: 16, backgroundColor: Colors.light.buttonPrimary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: Colors.light.buttonText, fontWeight: 'bold', fontSize: 16 },
  helper: { fontSize: 12, color: Colors.light.inputText, marginTop: 8, fontStyle: 'italic' },
  button: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.light.inputBorder,
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.light.buttonText,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: Colors.light.inputText,
  },
}); 