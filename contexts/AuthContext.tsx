import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

// Importar módulo correcto basado en la plataforma
let authModule;
try {
  if (Platform.OS === 'web') {
    authModule = require('../services/auth.web');
  } else if (Platform.OS === 'android') {
    authModule = require('../services/auth-android');
  } else {
    authModule = require('../services/auth');
  }
} catch (error) {
  console.error('Error cargando módulo de autenticación:', error);
  // Fallback a módulo nativo
  authModule = require('../services/auth');
}

const { authenticateUser, resetAuthDB } = authModule;

interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'dueño' | 'repostero';
  nombre: string;
  activo: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔐 Inicializando autenticación...');
      console.log('🔍 resetAuthDB disponible:', typeof resetAuthDB);
      
      // Resetear la BD de autenticación para asegurar usuarios correctos
      if (resetAuthDB && typeof resetAuthDB === 'function') {
        console.log('🔄 Ejecutando resetAuthDB...');
        await resetAuthDB();
        console.log('✅ Autenticación inicializada correctamente');
      } else {
        console.log('⚠️ resetAuthDB no está disponible, saltando inicialización');
      }
      
      // Forzar setIsLoading después de un pequeño delay para asegurar que se ejecute
      setTimeout(() => {
        console.log('🔄 Estableciendo isLoading = false');
        setIsLoading(false);
      }, 100);
      
    } catch (error) {
      console.error('❌ Error inicializando autenticación:', error);
      console.error('❌ Error details:', error);
      // Asegurar que setIsLoading se ejecute incluso si hay error
      setTimeout(() => {
        console.log('🔄 Estableciendo isLoading = false después de error');
        setIsLoading(false);
      }, 100);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Intentando login para usuario:', username);
      console.log('🔍 authenticateUser disponible:', typeof authenticateUser);
      
      if (!authenticateUser || typeof authenticateUser !== 'function') {
        console.error('❌ authenticateUser no está disponible');
        return false;
      }
      
      const authenticatedUser = await authenticateUser(username, password) as User | null;
      console.log('👤 Usuario autenticado:', authenticatedUser);
      
      if (authenticatedUser) {
        setUser(authenticatedUser);
        console.log('✅ Login exitoso');
        return true;
      }
      console.log('❌ Login fallido - credenciales incorrectas');
      return false;
    } catch (error) {
      console.error('❌ Error en login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) {
      console.log('❌ hasPermission: No hay usuario');
      return false;
    }

    console.log('🔐 hasPermission:', {
      permission,
      userRole: user.role,
      username: user.username
    });

    // Lógica simplificada: Solo repostero tiene restricciones
    if (user.role === 'repostero') {
      console.log('⚠️ Usuario repostero - permisos limitados');
      return false; // Repostero no tiene permisos especiales
    }

    // Admin y dueño tienen todos los permisos
    if (user.role === 'admin' || user.role === 'dueño') {
      console.log('✅ Usuario admin/dueño - acceso completo');
      return true;
    }

    // Por defecto, dar acceso (fallback)
    console.log('⚠️ Rol desconocido, dando acceso por defecto');
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isLoading,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
