// Versión web-compatible del sistema de autenticación usando localStorage
// Esta versión se usa cuando la app se ejecuta en el navegador web

export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'dueño' | 'repostero';
  nombre: string;
  activo: boolean;
  created_at: string;
}

const STORAGE_KEYS = {
  USERS: 'pasteleria_users',
};

let nextId = 1;

// Función para obtener el siguiente ID
const getNextId = (): number => {
  const stored = localStorage.getItem('pasteleria_auth_next_id');
  const id = stored ? parseInt(stored) : 1;
  localStorage.setItem('pasteleria_auth_next_id', (id + 1).toString());
  return id;
};

// Crear usuarios por defecto
const createDefaultUsers = (): void => {
  const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  if (existingUsers) return;

  const defaultUsers: User[] = [
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
      nombre: 'Raquel',
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

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  localStorage.setItem('pasteleria_auth_next_id', '4');
};

export const initAuthDB = (): Promise<void> => {
  return new Promise((resolve) => {
    createDefaultUsers();
    resolve();
  });
};


export const authenticateUser = (username: string, password: string): Promise<User | null> => {
  return new Promise((resolve) => {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.username === username && u.password === password && u.activo);

    if (user) {
      // Crear una copia sin la contraseña por seguridad
      const { password: _, ...userWithoutPassword } = user;
      resolve(userWithoutPassword as User);
    } else {
      resolve(null);
    }
  });
};

export const resetAuthDB = (): Promise<void> => {
  return new Promise((resolve) => {
    // Limpiar datos de autenticación
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem('pasteleria_auth_next_id');

    // Recrear usuarios por defecto
    createDefaultUsers();
    resolve();
  });
};
