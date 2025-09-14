import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Platform } from 'react-native';
import Colors from '../../constants/Colors';

interface LoginScreenProps {
  onLogin: () => void;
}

const PASSWORD = 'pasteleria2024';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (password === PASSWORD) {
      setError(''); // Limpiar error si la contraseña es correcta
      onLogin();
    } else {
      setError('Contraseña incorrecta. Intenta nuevamente.');
      setPassword(''); // Limpiar el campo de contraseña
      
      // Mostrar mensaje de error según la plataforma
      if (Platform.OS === 'web') {
        alert('Clave incorrecta. Por favor, intenta nuevamente.');
      } else {
        Alert.alert('Clave incorrecta', 'Por favor, intenta nuevamente.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Acceso al sistema</Text>
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
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>INGRESAR</Text>
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
    marginBottom: 24,
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
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LoginScreen; 