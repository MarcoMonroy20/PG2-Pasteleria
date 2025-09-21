import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, hasPermission, logout } = useAuth();

  const getWelcomeMessage = (user: any) => {
    // Para usuarios por defecto, usar el mensaje específico
    if (user?.role === 'admin') return 'Bienvenido, Administrador';
    if (user?.role === 'dueño') return 'Bienvenida, Raquel';
    if (user?.role === 'repostero') return 'Bienvenido, Repostero';
    // Para usuarios personalizados, usar su nombre
    return `Bienvenido, ${user?.nombre || 'Usuario'}`;
  };

  const renderButtonsByRole = () => {
    if (!user) return null;

    switch (user.role) {
      case 'admin':
        return (
          <>
            <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('nuevo-pedido' as never)}>
              <Text style={styles.mainButtonText}>Nuevo Pedido</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('proximos-pedidos' as never)}>
              <Text style={styles.buttonText}>Ver Próximos Pedidos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('rellenos-masas' as never)}>
              <Text style={styles.buttonText}>Modificar Rellenos y Masas</Text>
            </TouchableOpacity>
          </>
        );

      case 'dueño':
        return (
          <>
            <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('nuevo-pedido' as never)}>
              <Text style={styles.mainButtonText}>Nuevo Pedido</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('proximos-pedidos' as never)}>
              <Text style={styles.buttonText}>Ver Próximos Pedidos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('rellenos-masas' as never)}>
              <Text style={styles.buttonText}>Modificar Rellenos y Masas</Text>
            </TouchableOpacity>
          </>
        );

      case 'repostero':
        return (
          <>
            <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('proximos-pedidos' as never)}>
              <Text style={styles.mainButtonText}>Ver Próximos Pedidos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('calendario' as never)}>
              <Text style={styles.buttonText}>Ver Calendario</Text>
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header con título y botones */}
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Pedidos</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <FontAwesome name="sign-out" size={20} color={Colors.light.buttonSecondary} />
            <Text style={styles.logoutButtonText}>Salir</Text>
          </TouchableOpacity>
          {hasPermission('manage_settings') && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('settings' as never)}
            >
              <FontAwesome name="cog" size={24} color={Colors.light.buttonSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>


      {/* Información del usuario */}
      <View style={styles.userInfo}>
        <Text style={styles.welcomeText}>
          {getWelcomeMessage(user)}
        </Text>
      </View>

      {/* Contenedor de botones centrados */}
      <View style={styles.buttonsContainer}>
        {renderButtonsByRole()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.inputBorder,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.buttonPrimary,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
  },
  logoutButtonText: {
    color: Colors.light.inputText,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});
