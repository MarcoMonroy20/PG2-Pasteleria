import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../../constants/Colors';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('settings' as never)}
      >
        <FontAwesome name="cog" size={28} color={Colors.light.buttonSecondary} />
      </TouchableOpacity>
      <Text style={styles.title}>Gestión de Pedidos</Text>
      <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('nuevo-pedido' as never)}>
        <Text style={styles.mainButtonText}>Nuevo Pedido</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('proximos-pedidos' as never)}>
        <Text style={styles.buttonText}>Ver Próximos Pedidos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('rellenos-masas' as never)}>
        <Text style={styles.buttonText}>Modificar Rellenos y Masas</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    color: Colors.light.titleColor,
  },
  mainButton: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingVertical: 24,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginBottom: 24,
    width: '90%',
    alignItems: 'center',
    shadowColor: Colors.light.buttonSecondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mainButtonText: {
    color: Colors.light.buttonText,
    fontSize: 22,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: Colors.light.buttonSecondary,
    borderColor: Colors.light.buttonSecondary,
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    width: '90%',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.light.buttonSecondaryText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsButton: {
    position: 'absolute',
    top: 40,
    right: 24,
    zIndex: 10,
  },
});
