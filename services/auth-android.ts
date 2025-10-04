// Simplified authentication service for Android
// Uses localStorage for better compatibility

const USERS_KEY = 'pasteleria_users';
const AUTH_KEY = 'pasteleria_auth';

export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'dueño' | 'repostero';
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Default users with password 2110
const DEFAULT_USERS: User[] = [
  { id: 1, username: 'admin', password: '2110', role: 'admin' },
  { id: 2, username: 'dueño', password: '2110', role: 'dueño' },
  { id: 3, username: 'repostero', password: '2110', role: 'repostero' }
];

export const initAuthDB = async (): Promise<void> => {
  try {
    console.log('🔐 Inicializando base de datos de autenticación Android...');
    
    // Check if users already exist
    const existingUsers = localStorage.getItem(USERS_KEY);
    if (!existingUsers) {
      console.log('👥 Creando usuarios por defecto...');
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      console.log('✅ Usuarios creados:', DEFAULT_USERS.map(u => u.username).join(', '));
    } else {
      console.log('✅ Usuarios ya existen en localStorage');
    }
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
    
    const usersData = localStorage.getItem(USERS_KEY);
    if (!usersData) {
      console.error('❌ No se encontraron usuarios en localStorage');
      return { success: false, error: 'Base de datos no inicializada' };
    }

    const users: User[] = JSON.parse(usersData);
    console.log('👥 Usuarios disponibles:', users.map(u => u.username).join(', '));

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      console.log('✅ Usuario autenticado:', user.username, 'rol:', user.role);
      
      // Store auth session
      localStorage.setItem(AUTH_KEY, JSON.stringify({
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
    const authData = localStorage.getItem(AUTH_KEY);
    if (authData) {
      const auth = JSON.parse(authData);
      const usersData = localStorage.getItem(USERS_KEY);
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

export const logout = async (): Promise<void> => {
  try {
    localStorage.removeItem(AUTH_KEY);
    console.log('✅ Usuario deslogueado');
  } catch (error) {
    console.error('❌ Error en logout:', error);
  }
};

export const resetAuthDB = async (): Promise<void> => {
  try {
    console.log('🔄 Reiniciando base de datos de autenticación Android...');
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(AUTH_KEY);
    await initAuthDB();
    console.log('✅ Base de datos de autenticación reiniciada');
  } catch (error) {
    console.error('❌ Error reiniciando auth DB Android:', error);
    // Don't throw, just log the error to prevent app crashes
  }
};
