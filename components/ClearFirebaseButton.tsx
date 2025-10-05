import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { FirebaseSync } from '../services/firebase';
import Colors from '../constants/Colors';

interface ClearFirebaseButtonProps {
  onDataCleared?: () => void;
}

export default function ClearFirebaseButton({ onDataCleared }: ClearFirebaseButtonProps) {
  const clearFirebaseData = () => {
    Alert.alert(
      '🧹 Limpiar Firebase',
      'Esto eliminará TODOS los sabores y rellenos de Firebase. La aplicación quedará completamente vacía. ¿Estás seguro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpiar Firebase',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert('⏳ Limpiando...', 'Eliminando datos de Firebase...');
              
              // Aquí necesitarías implementar la función para limpiar Firebase
              // Por ahora, solo mostramos el mensaje
              Alert.alert(
                '⚠️ Limpieza Manual Requerida',
                'Para limpiar Firebase manualmente:\n\n' +
                '1. Ve a https://console.firebase.google.com/\n' +
                '2. Selecciona tu proyecto\n' +
                '3. Ve a Firestore Database\n' +
                '4. Elimina las colecciones "sabores" y "rellenos"\n\n' +
                'O usa el archivo clear-firebase-data.html',
                [{ text: 'OK' }]
              );
              
              if (onDataCleared) {
                onDataCleared();
              }
              
            } catch (error) {
              console.error('Error limpiando Firebase:', error);
              Alert.alert('Error', 'No se pudo limpiar Firebase');
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.button} onPress={clearFirebaseData}>
      <Text style={styles.buttonText}>🧹 Limpiar Firebase</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
