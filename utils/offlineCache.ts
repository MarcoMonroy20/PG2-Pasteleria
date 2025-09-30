import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Interfaces para el sistema de cache
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
  size: number;
}

interface CacheConfig {
  maxAge: number; // en milisegundos
  maxSize: number; // en bytes
  compressionEnabled: boolean;
  version: string;
}

// Sistema de cache offline avanzado
class OfflineCache {
  private static instance: OfflineCache;
  private cachePrefix = '@pasteleria_cache_';
  private memoryCache = new Map<string, CacheEntry>();
  private config: CacheConfig;

  static getInstance(): OfflineCache {
    if (!OfflineCache.instance) {
      OfflineCache.instance = new OfflineCache();
    }
    return OfflineCache.instance;
  }

  constructor() {
    this.config = {
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      maxSize: 50 * 1024 * 1024, // 50MB
      compressionEnabled: Platform.OS === 'android',
      version: '1.0.0',
    };
  }

  // Configurar el cache
  configure(config: Partial<CacheConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Almacenar datos en cache
  async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number; // time to live en ms
      compress?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const { ttl = this.config.maxAge, compress = this.config.compressionEnabled } = options;
      const timestamp = Date.now();
      const expiresAt = timestamp + ttl;

      let serializedData = JSON.stringify(data);
      const size = new Blob([serializedData]).size;

      // Verificar límite de tamaño
      if (size > this.config.maxSize) {
        console.warn(`Cache entry too large: ${size} bytes`);
        return;
      }

      const entry: CacheEntry<T> = {
        data,
        timestamp,
        expiresAt,
        version: this.config.version,
        size,
      };

      // Almacenar en memoria
      this.memoryCache.set(key, entry);

      // Almacenar en persistencia
      const cacheKey = this.getCacheKey(key);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));

      // Limpiar cache si es necesario
      await this.cleanupIfNeeded();

    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  // Obtener datos del cache
  async get<T>(key: string): Promise<T | null> {
    try {
      // Primero buscar en memoria
      let entry = this.memoryCache.get(key);

      if (!entry) {
        // Buscar en persistencia
        const cacheKey = this.getCacheKey(key);
        const stored = await AsyncStorage.getItem(cacheKey);

        if (stored) {
          entry = JSON.parse(stored);
          // Validar versión
          if (entry.version !== this.config.version) {
            await this.delete(key);
            return null;
          }
          // Restaurar en memoria
          this.memoryCache.set(key, entry);
        }
      }

      if (!entry) return null;

      // Verificar expiración
      if (Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  // Verificar si existe en cache y no está expirado
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  // Eliminar entrada del cache
  async delete(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      const cacheKey = this.getCacheKey(key);
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error deleting cache:', error);
    }
  }

  // Limpiar todo el cache
  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Limpiar entradas expiradas
  async cleanup(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));

      const entries = await AsyncStorage.multiGet(cacheKeys);
      const expiredKeys: string[] = [];

      for (const [key, value] of entries) {
        if (value) {
          try {
            const entry: CacheEntry = JSON.parse(value);
            if (Date.now() > entry.expiresAt || entry.version !== this.config.version) {
              expiredKeys.push(key);
            }
          } catch {
            expiredKeys.push(key);
          }
        }
      }

      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
        // Limpiar también de memoria
        expiredKeys.forEach(key => {
          const originalKey = key.replace(this.cachePrefix, '');
          this.memoryCache.delete(originalKey);
        });
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  // Obtener estadísticas del cache
  async getStats() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));

      let totalSize = 0;
      let validEntries = 0;
      let expiredEntries = 0;

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const entry: CacheEntry = JSON.parse(value);
            totalSize += entry.size;

            if (Date.now() > entry.expiresAt) {
              expiredEntries++;
            } else {
              validEntries++;
            }
          } catch {
            // Invalid entry
          }
        }
      }

      return {
        totalEntries: cacheKeys.length,
        validEntries,
        expiredEntries,
        totalSize,
        memoryCacheSize: this.memoryCache.size,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        totalSize: 0,
        memoryCacheSize: 0,
      };
    }
  }

  // Cache inteligente con invalidación automática
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      ttl?: number;
      force?: boolean;
    } = {}
  ): Promise<T> {
    const { ttl, force = false } = options;

    if (!force) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    try {
      const data = await fetcher();
      await this.set(key, data, { ttl });
      return data;
    } catch (error) {
      // Si falla el fetch, intentar devolver datos expirados si existen
      const cached = await this.get<T>(key);
      if (cached !== null) {
        console.warn('Using expired cache data due to fetch failure');
        return cached;
      }
      throw error;
    }
  }

  // Cache de archivos (imágenes, PDFs, etc.)
  async cacheFile(
    url: string,
    localFilename: string,
    options: { ttl?: number } = {}
  ): Promise<string | null> {
    try {
      const cacheKey = `file_${localFilename}`;
      const cachedPath = await this.get<string>(cacheKey);

      if (cachedPath && await this.fileExists(cachedPath)) {
        return cachedPath;
      }

      // Descargar archivo
      const downloadResult = await FileSystem.downloadAsync(url, localFilename);

      if (downloadResult.status === 200) {
        await this.set(cacheKey, downloadResult.uri, options);
        return downloadResult.uri;
      }

      return null;
    } catch (error) {
      console.error('Error caching file:', error);
      return null;
    }
  }

  // Métodos privados
  private getCacheKey(key: string): string {
    return `${this.cachePrefix}${key}`;
  }

  private async cleanupIfNeeded(): Promise<void> {
    const stats = await this.getStats();

    // Limpiar si el tamaño excede el límite
    if (stats.totalSize > this.config.maxSize) {
      await this.cleanup();
    }

    // Limpiar entradas expiradas periódicamente
    const now = Date.now();
    if (now % 3600000 < 60000) { // Una vez por hora aproximadamente
      await this.cleanup();
    }
  }

  private async fileExists(uri: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info.exists;
    } catch {
      return false;
    }
  }
}

// Instancia singleton
export const offlineCache = OfflineCache.getInstance();

// Hook para usar el cache offline
export function useOfflineCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
  } = {}
) {
  const { ttl = 24 * 60 * 60 * 1000, enabled = true } = options;
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    offlineCache.getOrSet(key, fetcher, { ttl })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [key, fetcher, ttl, enabled]);

  return {
    data,
    loading,
    error,
    refetch: () => offlineCache.getOrSet(key, fetcher, { ttl, force: true }),
    invalidate: () => offlineCache.delete(key),
  };
}

export default {
  OfflineCache,
  offlineCache,
  useOfflineCache,
};
