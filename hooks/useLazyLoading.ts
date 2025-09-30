import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform } from 'react-native';

// Hook para lazy loading inteligente
export function useLazyLoading<T>(
  dataSource: T[],
  options: {
    chunkSize?: number;
    delay?: number;
    enableInfiniteScroll?: boolean;
    threshold?: number;
  } = {}
) {
  const {
    chunkSize = Platform.OS === 'android' ? 10 : 20,
    delay = Platform.OS === 'android' ? 50 : 100,
    enableInfiniteScroll = true,
    threshold = 0.8,
  } = options;

  const [visibleData, setVisibleData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Inicializar con el primer chunk
  useEffect(() => {
    if (dataSource.length > 0) {
      setVisibleData(dataSource.slice(0, chunkSize));
      setCurrentIndex(chunkSize);
      setHasMore(dataSource.length > chunkSize);
    } else {
      setVisibleData([]);
      setCurrentIndex(0);
      setHasMore(false);
    }
  }, [dataSource, chunkSize]);

  // Función para cargar más datos
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // Simular delay para mejor UX
    setTimeout(() => {
      const nextIndex = currentIndex + chunkSize;
      const newData = dataSource.slice(currentIndex, nextIndex);

      setVisibleData(prev => [...prev, ...newData]);
      setCurrentIndex(nextIndex);
      setHasMore(nextIndex < dataSource.length);
      setIsLoading(false);
    }, delay);
  }, [dataSource, currentIndex, chunkSize, delay, isLoading, hasMore]);

  // Función para refrescar/resetear
  const refresh = useCallback(() => {
    setVisibleData(dataSource.slice(0, chunkSize));
    setCurrentIndex(chunkSize);
    setHasMore(dataSource.length > chunkSize);
    setIsLoading(false);
  }, [dataSource, chunkSize]);

  // Función para verificar si debe cargar más (para infinite scroll)
  const shouldLoadMore = useCallback((visibleIndex: number) => {
    if (!enableInfiniteScroll) return false;

    const thresholdIndex = Math.floor(visibleData.length * threshold);
    return visibleIndex >= thresholdIndex && hasMore && !isLoading;
  }, [visibleData.length, threshold, hasMore, isLoading, enableInfiniteScroll]);

  return {
    visibleData,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    shouldLoadMore,
    totalLoaded: visibleData.length,
    totalAvailable: dataSource.length,
  };
}

// Hook para lazy loading con búsqueda inteligente
export function useSmartLazyLoading<T extends { [key: string]: any }>(
  dataSource: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  options: {
    chunkSize?: number;
    delay?: number;
    enableInfiniteScroll?: boolean;
    threshold?: number;
  } = {}
) {
  const [filteredData, setFilteredData] = useState<T[]>(dataSource);

  // Filtrar datos basado en búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(dataSource);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = dataSource.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(term);
      })
    );

    setFilteredData(filtered);
  }, [dataSource, searchTerm, searchFields]);

  // Usar lazy loading en los datos filtrados
  const lazyLoading = useLazyLoading(filteredData, options);

  return {
    ...lazyLoading,
    filteredData,
    totalFiltered: filteredData.length,
  };
}

// Hook para prefetching inteligente
export function usePrefetching<T>(
  dataSource: T[],
  prefetchSize: number = 5
) {
  const prefetchedRef = useRef<Set<number>>(new Set());

  const prefetch = useCallback((startIndex: number) => {
    const endIndex = Math.min(startIndex + prefetchSize, dataSource.length);

    for (let i = startIndex; i < endIndex; i++) {
      if (!prefetchedRef.current.has(i)) {
        // Aquí iría la lógica de prefetching real (imágenes, datos, etc.)
        // Por ahora solo marcamos como prefetched
        prefetchedRef.current.add(i);
      }
    }
  }, [dataSource.length, prefetchSize]);

  const isPrefetched = useCallback((index: number) => {
    return prefetchedRef.current.has(index);
  }, []);

  // Limpiar prefetch cuando cambian los datos
  useEffect(() => {
    prefetchedRef.current.clear();
  }, [dataSource]);

  return {
    prefetch,
    isPrefetched,
  };
}

// Hook para virtualización inteligente de listas
export function useVirtualList<T>(
  data: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + overscan, data.length);

    return {
      start: Math.max(0, start - overscan),
      end,
      visibleStart: start,
      visibleEnd: start + visibleCount,
    };
  }, [scrollTop, itemHeight, containerHeight, data.length, overscan]);

  const visibleData = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange]);

  const getItemStyle = useCallback((index: number) => {
    return {
      position: 'absolute' as const,
      top: (visibleRange.start + index) * itemHeight,
      height: itemHeight,
      width: '100%',
    };
  }, [visibleRange.start, itemHeight]);

  const totalHeight = data.length * itemHeight;

  return {
    visibleData,
    visibleRange,
    getItemStyle,
    totalHeight,
    scrollTop,
    setScrollTop,
  };
}

export default {
  useLazyLoading,
  useSmartLazyLoading,
  usePrefetching,
  useVirtualList,
};
