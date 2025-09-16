import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Colors from '../../constants/Colors';
import * as DB from '../../services/db';

type AppSettings = {
  notifications_enabled: boolean;
  days_before: number;
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({ notifications_enabled: false, days_before: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = (await (DB as any)?.obtenerSettings?.()) as AppSettings | undefined;
        if (s) {
          setSettings(s);
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
    if ((DB as any)?.guardarSettings) {
      await (DB as any).guardarSettings(next);
    }
  };

  const setDaysBefore = async (days: number) => {
    const next = { ...settings, days_before: Math.max(0, Math.min(7, days)) };
    setSettings(next);
    if ((DB as any)?.guardarSettings) {
      await (DB as any).guardarSettings(next);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}><Text style={styles.subtitle}>Cargando…</Text></View>
    );
  }

  return (
    <View style={styles.container}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 50,
    backgroundColor: Colors.light.background,
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
}); 