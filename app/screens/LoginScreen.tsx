import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Platform } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { useAuth } from '../../contexts/AuthContext';

type UserRole = 'admin' | 'dueño' | 'repostero';

const LoginScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mapear contraseñas a roles y usernames
  const getCredentialsFromPassword = (password: string): { username: string; role: UserRole } | null => {
    switch (password) {
      case '2110':
        return { username: 'admin', role: 'admin' };
      case 'dueno2025':
        return { username: 'dueno', role: 'dueño' };
      case 'repostero2025':
        return { username: 'repostero', role: 'repostero' };
      default:
        return null;
    }
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Ingresa tu contraseña');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const credentials = getCredentialsFromPassword(password);

      if (!credentials) {
        setError('Contraseña incorrecta');
        setPassword('');

        if (Platform.OS === 'web') {
          alert('Contraseña incorrecta. Intenta nuevamente.');
        } else {
          Alert.alert('Error de acceso', 'Contraseña incorrecta. Intenta nuevamente.');
        }
        return;
      }

      const success = await login(credentials.username, password);

      if (!success) {
        setError('Error de autenticación');
        setPassword('');
        Alert.alert('Error', 'Error de autenticación. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error de conexión');
      Alert.alert('Error', 'Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Acceso al sistema</Text>
      <Text style={styles.subtitle}>Ingresa tu contraseña</Text>

      {/* Campo de contraseña */}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (error) setError(''); // Limpiar error al escribir
        }}
        placeholderTextColor={Colors.light.buttonPrimary}
        editable={!isLoading}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Botón de login */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'VERIFICANDO...' : 'INGRESAR'}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 16,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.inputText,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '80%',
    height: 48,
    borderColor: Colors.light.inputBorder,
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 18,
    backgroundColor: Colors.light.inputBackground,
    color: Colors.light.inputText,
  },
  buttonContainer: {
    width: '80%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  loginButton: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.light.buttonSecondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: Colors.light.buttonText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  inputError: {
    borderColor: Colors.light.error,
    borderWidth: 2,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },

});

export default LoginScreen; 