import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RellenosMasasScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rellenos y Masas</Text>
      <Text>Próximamente: edición de sabores disponibles.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
}); 