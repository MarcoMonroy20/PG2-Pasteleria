// Simplified authentication service for Android
// Uses AsyncStorage for React Native compatibility

import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = 'pasteleria_users';
const AUTH_KEY = 'pasteleria_auth';

export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'dueño' | 'repostero';
  nombre: string;
  activo: boolean;
  created_at: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Default users with correct passwords for Android
const DEFAULT_USERS: User[] = [
  { 
    id: 1, 
    username: 'admin', 
    password: '2110', 
    role: 'admin',
    nombre: 'Administrador',
    activo: true,
    created_at: new Date().toISOString()
  },
  { 
    id: 2, 
    username: 'dueno', 
    password: 'dueno2024', 
    role: 'dueño',
           nombre: 'Administrador',
    activo: true,
    created_at: new Date().toISOString()
  },
  { 
    id: 3, 
    username: 'repostero', 
    password: 'repostero2024', 
    role: 'repostero',
    nombre: 'Repostero',
    activo: true,
    created_at: new Date().toISOString()
  }
];

export const initAuthDB = async (): Promise<void> => {
  try {
    console.log('🔐 Inicializando base de datos de autenticación Android...');
    
    // Always recreate users to ensure they have all required fields
    console.log('👥 Creando/actualizando usuarios por defecto...');
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    console.log('✅ Usuarios creados/actualizados:', DEFAULT_USERS.map(u => `${u.username}(${u.password})`).join(', '));
    
    // Clear any existing auth session to force re-login
    await AsyncStorage.removeItem(AUTH_KEY);
    console.log('🔄 Sesión anterior limpiada');
  } catch (error) {
    console.error('❌ Error inicializando auth DB Android:', error);
    throw error;
  }
};

export const authenticateUser = async (username: string, password: string): Promise<AuthResult> => {
  try {
    console.log('🔐 Autenticando usuario Android:', username);
    console.log('🔑 Longitud de contraseña:', password.length);
    
    // Ensure users exist
    await initAuthDB();
    
    const usersData = await AsyncStorage.getItem(USERS_KEY);
    if (!usersData) {
      console.error('❌ No se encontraron usuarios en AsyncStorage');
      return { success: false, error: 'Base de datos no inicializada' };
    }

    const users: User[] = JSON.parse(usersData);
    console.log('👥 Usuarios disponibles:', users.map(u => u.username).join(', '));

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      console.log('✅ Usuario autenticado:', user.username, 'rol:', user.role);
      
      // Store auth session
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({
        userId: user.id,
        username: user.username,
        role: user.role,
        loginTime: Date.now()
      }));
      
      return { success: true, user };
    } else {
      console.log('❌ Credenciales incorrectas para:', username);
      return { success: false, error: 'Usuario o contraseña incorrectos' };
    }
  } catch (error) {
    console.error('❌ Error en autenticación Android:', error);
    return { success: false, error: 'Error de conexión' };
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const authData = await AsyncStorage.getItem(AUTH_KEY);
    if (authData) {
      const auth = JSON.parse(authData);
      const usersData = await AsyncStorage.getItem(USERS_KEY);
      if (usersData) {
        const users: User[] = JSON.parse(usersData);
        return users.find(u => u.id === auth.userId) || null;
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo usuario actual:', error);
    return null;
  }
};

export const resetAuthDB = async (): Promise<void> => {
  try {
    console.log('🔄 Reseteando base de datos de autenticación Android...');
    await AsyncStorage.removeItem(USERS_KEY);
    await AsyncStorage.removeItem(AUTH_KEY);
    await initAuthDB();
    console.log('✅ Base de datos de autenticación reseteada');
  } catch (error) {
    console.error('❌ Error reseteando auth DB Android:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AUTH_KEY);
    console.log('✅ Usuario deslogueado');
  } catch (error) {
    console.error('❌ Error en logout:', error);
  }
};
