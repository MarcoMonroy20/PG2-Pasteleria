import { Platform } from 'react-native';
import React from 'react';
import * as FileSystem from 'expo-file-system';

// Interface para configuración de prefetching
interface PrefetchConfig {
  maxConcurrent: number;
  timeout: number;
  retryAttempts: number;
  priority: 'low' | 'normal' | 'high';
}

// Cache de imágenes prefetched
class ImagePrefetcher {
  private static instance: ImagePrefetcher;
  private prefetchedUrls = new Set<string>();
  private prefetchQueue: Array<{ url: string; config: PrefetchConfig }> = [];
  private activePrefetches = 0;
  private prefetchPromises = new Map<string, Promise<boolean>>();

  static getInstance(): ImagePrefetcher {
    if (!ImagePrefetcher.instance) {
      ImagePrefetcher.instance = new ImagePrefetcher();
    }
    return ImagePrefetcher.instance;
  }

  // Prefetch inteligente con prioridades
  async prefetchImage(
    url: string,
    config: Partial<PrefetchConfig> = {}
  ): Promise<boolean> {
    const defaultConfig: PrefetchConfig = {
      maxConcurrent: Platform.OS === 'android' ? 3 : 5,
      timeout: 10000,
      retryAttempts: 2,
      priority: 'normal',
      ...config,
    };

    // Si ya está prefetched o en proceso, devolver promesa existente
    if (this.prefetchedUrls.has(url)) {
      return true;
    }

    if (this.prefetchPromises.has(url)) {
      return this.prefetchPromises.get(url)!;
    }

    // Crear promesa de prefetch
    const prefetchPromise = this.performPrefetch(url, defaultConfig);
    this.prefetchPromises.set(url, prefetchPromise);

    try {
      const success = await prefetchPromise;
      if (success) {
        this.prefetchedUrls.add(url);
      }
      return success;
    } finally {
      this.prefetchPromises.delete(url);
    }
  }

  // Prefetch múltiple con control de concurrencia
  async prefetchImages(
    urls: string[],
    config: Partial<PrefetchConfig> = {}
  ): Promise<boolean[]> {
    const results: boolean[] = [];
    const batches = this.chunkArray(urls, config.maxConcurrent || 3);

    for (const batch of batches) {
      const batchPromises = batch.map(url => this.prefetchImage(url, config));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  // Prefetch basado en proximidad (para listas)
  async prefetchNearbyImages(
    allUrls: string[],
    currentIndex: number,
    radius: number = 3,
    config: Partial<PrefetchConfig> = {}
  ): Promise<void> {
    const startIndex = Math.max(0, currentIndex - radius);
    const endIndex = Math.min(allUrls.length, currentIndex + radius + 1);
    const nearbyUrls = allUrls.slice(startIndex, endIndex);

    // Priorizar imágenes más cercanas
    const prioritizedUrls = nearbyUrls
      .map((url, index) => ({
        url,
        distance: Math.abs(index - (currentIndex - startIndex)),
      }))
      .sort((a, b) => a.distance - b.distance)
      .map(item => item.url);

    await this.prefetchImages(prioritizedUrls, { ...config, priority: 'high' });
  }

  // Verificar si una imagen está prefetched
  isPrefetched(url: string): boolean {
    return this.prefetchedUrls.has(url);
  }

  // Limpiar cache
  clearCache(): void {
    this.prefetchedUrls.clear();
    this.prefetchPromises.clear();
    this.prefetchQueue = [];
    this.activePrefetches = 0;
  }

  // Obtener estadísticas
  getStats() {
    return {
      prefetchedCount: this.prefetchedUrls.size,
      activePrefetches: this.activePrefetches,
      queueLength: this.prefetchQueue.length,
    };
  }

  // Método privado para realizar el prefetch real
  private async performPrefetch(
    url: string,
    config: PrefetchConfig
  ): Promise<boolean> {
    // Esperar si hay demasiadas peticiones concurrentes
    while (this.activePrefetches >= config.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.activePrefetches++;

    try {
      if (Platform.OS === 'web') {
        // Web: usar Image API
        return new Promise((resolve) => {
          const img = new (globalThis as any).Image();
          const timeoutId = setTimeout(() => {
            img.src = ''; // Cancelar carga
            resolve(false);
          }, config.timeout);

          img.onload = () => {
            clearTimeout(timeoutId);
            resolve(true);
          };

          img.onerror = () => {
            clearTimeout(timeoutId);
            resolve(false);
          };

          img.src = url;
        });
      } else {
        // Mobile: usar FileSystem para descargar y cachear
        const cacheDir = (FileSystem as any).cacheDirectory as string | undefined;
        if (!cacheDir) return false;

        const filename = url.split('/').pop() || 'image';
        const fileUri = `${cacheDir}prefetch_${filename}`;

        try {
          const downloadResult = await FileSystem.downloadAsync(url, fileUri);
          return downloadResult.status === 200;
        } catch {
          return false;
        }
      }
    } finally {
      this.activePrefetches--;
    }
  }

  // Utility para dividir arrays en chunks
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Instancia singleton
export const imagePrefetcher = ImagePrefetcher.getInstance();

// Hook para prefetching automático en listas
export function useImagePrefetching(
  imageUrls: string[],
  options: {
    enableAutoPrefetch?: boolean;
    prefetchRadius?: number;
    currentIndex?: number;
  } = {}
) {
  const {
    enableAutoPrefetch = true,
    prefetchRadius = 3,
    currentIndex = 0,
  } = options;

  React.useEffect(() => {
    if (!enableAutoPrefetch || imageUrls.length === 0) return;

    // Prefetch imágenes cercanas cuando cambia el índice
    imagePrefetcher.prefetchNearbyImages(
      imageUrls,
      currentIndex,
      prefetchRadius,
      { priority: 'high' }
    );
  }, [imageUrls, currentIndex, prefetchRadius, enableAutoPrefetch]);

  return {
    prefetchImage: imagePrefetcher.prefetchImage.bind(imagePrefetcher),
    prefetchImages: imagePrefetcher.prefetchImages.bind(imagePrefetcher),
    isPrefetched: imagePrefetcher.isPrefetched.bind(imagePrefetcher),
    getStats: imagePrefetcher.getStats.bind(imagePrefetcher),
  };
}

export default {
  ImagePrefetcher,
  imagePrefetcher,
  useImagePrefetching,
};
