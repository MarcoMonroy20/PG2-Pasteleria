import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NuevoPedidoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo Pedido</Text>
      <Text>Próximamente: formulario para registrar un nuevo pedido.</Text>
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