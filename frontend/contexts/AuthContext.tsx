import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

// Importar módulo correcto basado en la plataforma
let authModule;
if (Platform.OS === 'web') {
  authModule = require('../services/auth.web');
} else {
  authModule = require('../services/auth');
}

const { User, authenticateUser, resetAuthDB } = authModule;

interface AuthContextType {
  user: typeof User | null;
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
  const [user, setUser] = useState<typeof User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('Inicializando autenticación...');
      // Resetear la BD de autenticación para asegurar usuarios correctos
      await resetAuthDB();
      console.log('Autenticación inicializada correctamente');
      setIsLoading(false);
    } catch (error) {
      console.error('Error inicializando autenticación:', error);
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const authenticatedUser = await authenticateUser(username, password) as typeof User | null;
      if (authenticatedUser) {
        setUser(authenticatedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Definir permisos por rol
    const permissions: Record<string, string[]> = {
      admin: [
        'view_dashboard',
        'create_pedido',
        'edit_pedido',
        'delete_pedido',
        'view_proximos',
        'view_calendario',
        'view_cotizaciones',
        'view_estadisticas',
        'manage_sabores',
        'manage_rellenos',
        'manage_settings',
        'manage_users',
        'export_data'
      ],
      dueño: [
        'view_dashboard',
        'create_pedido',
        'edit_pedido',
        'delete_pedido',
        'view_proximos',
        'view_calendario',
        'view_cotizaciones',
        'view_estadisticas',
        'manage_sabores',
        'manage_rellenos',
        'manage_settings',
        'export_data'
      ],
      repostero: [
        'view_dashboard',
        'view_proximos',
        'view_calendario'
      ]
    };

    const userPermissions = permissions[user.role as string] || [];
    return userPermissions.includes(permission);
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
