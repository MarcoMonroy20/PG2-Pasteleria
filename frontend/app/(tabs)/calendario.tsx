import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CalendarioScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendario de Pedidos</Text>
      <Text style={styles.subtitle}>Aquí se mostrará el calendario con los pedidos programados.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E6FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#7C3AED',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B21A8',
  },
}); 