import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import OfflineIndicator from '../../components/OfflineIndicator';
import AndroidDebugger from '../../components/AndroidDebugger';
import hybridDB from '../../services/hybrid-db';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, hasPermission, logout } = useAuth();
  const [localDataStatus, setLocalDataStatus] = useState({ sabores: 0, rellenos: 0, pedidos: 0 });

  // Cargar estado de datos locales
  useEffect(() => {
    const checkLocalData = async () => {
      try {
        await hybridDB.initialize();
        const [sabores, rellenos, pedidos] = await Promise.all([
          hybridDB.obtenerSabores(),
          hybridDB.obtenerRellenos(),
          hybridDB.obtenerPedidos(),
        ]);
        setLocalDataStatus({
          sabores: sabores.length,
          rellenos: rellenos.length,
          pedidos: pedidos.length,
        });
      } catch (error) {
        console.error('Error checking local data:', error);
      }
    };
    checkLocalData();
  }, []);

  // Debug logs
  console.log('🏠 HomeScreen - Usuario actual:', user);
  console.log('🏠 HomeScreen - Rol del usuario:', user?.role);
  console.log('🏠 HomeScreen - Tiene permiso manage_settings:', hasPermission('manage_settings'));

  const getWelcomeMessage = (user: any) => {
    // Para usuarios por defecto, usar el mensaje específico
    if (user?.role === 'admin') return 'Bienvenido, Administrador';
    if (user?.role === 'dueño') return 'Bienvenida, Raquel';
    if (user?.role === 'repostero') return 'Bienvenido, Repostero';
    // Para usuarios personalizados, usar su nombre
    return `Bienvenido, ${user?.nombre || 'Usuario'}`;
  };

  const renderButtonsByRole = () => {
    // Fallback: Si no hay usuario o rol, mostrar botones básicos
    if (!user || !user.role) {
      console.log('⚠️ Usuario sin rol, mostrando botones por defecto');
      return (
        <>
          <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('nuevo-pedido' as never)}>
            <Text style={styles.mainButtonText}>Nuevo Pedido</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('proximos-pedidos' as never)}>
            <Text style={styles.buttonText}>Ver Próximos Pedidos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('calendario' as never)}>
            <Text style={styles.buttonText}>Ver Calendario</Text>
          </TouchableOpacity>
        </>
      );
    }

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
        // Fallback adicional
        return (
          <>
            <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('nuevo-pedido' as never)}>
              <Text style={styles.mainButtonText}>Nuevo Pedido</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('proximos-pedidos' as never)}>
              <Text style={styles.buttonText}>Ver Próximos Pedidos</Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header con título, saludo y botones */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Gestión de Pedidos</Text>
          <Text style={styles.welcomeText}>
            {getWelcomeMessage(user)}
          </Text>
        </View>
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

      {/* Indicador de estado offline */}
      <OfflineIndicator />

      {/* Indicador de datos locales */}
      <View style={{backgroundColor: '#f0f8ff', padding: 8, margin: 10, borderRadius: 8, borderWidth: 1, borderColor: '#007AFF'}}>
        <Text style={{color: '#007AFF', fontSize: 12, textAlign: 'center', fontWeight: 'bold'}}>
          📊 Datos Locales (Offline)
        </Text>
        <Text style={{color: '#007AFF', fontSize: 10, textAlign: 'center', marginTop: 2}}>
          Sabores: {localDataStatus.sabores} | Rellenos: {localDataStatus.rellenos} | Pedidos: {localDataStatus.pedidos}
        </Text>
        {(localDataStatus.sabores === 0 || localDataStatus.rellenos === 0) && (
          <Text style={{color: 'red', fontSize: 10, textAlign: 'center', marginTop: 4, fontWeight: 'bold'}}>
            ⚠️ PROBLEMA: Datos no guardados localmente
          </Text>
        )}
      </View>

      {/* Contenedor de botones centrados */}
      <View style={styles.buttonsContainer}>
        {renderButtonsByRole()}
      </View>

      {/* Debugger flotante para Android */}
      <AndroidDebugger />
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
    paddingTop: Platform.OS === 'android' ? 40 : 50, // Menos padding en Android
    paddingBottom: 20,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.inputBorder,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 4,
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
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.titleColor,
    opacity: 0.8,
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
