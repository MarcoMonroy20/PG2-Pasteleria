import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Dimensions, AppState } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

// Hook for optimized performance monitoring
export function usePerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const measurePerformance = () => {
      frameCount.current++;
      const now = Date.now();
      const elapsed = now - lastTime.current;

      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / elapsed);
        setFps(currentFps);
        frameCount.current = 0;
        lastTime.current = now;
      }

      requestAnimationFrame(measurePerformance);
    };

    const animationId = requestAnimationFrame(measurePerformance);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return { fps, memoryUsage };
}

// Hook for optimized app state management
export function useAppStateOptimization() {
  const [appState, setAppState] = useState(AppState.currentState);
  const [isOptimized, setIsOptimized] = useState(true);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);

      // Optimize when app goes to background
      if (nextAppState === 'background') {
        setIsOptimized(true);
      }

      // Restore when app comes to foreground
      if (nextAppState === 'active') {
        setIsOptimized(false);
      }
    });

    return () => subscription?.remove();
  }, []);

  return { appState, isOptimized };
}

// Hook for optimized network status
export function useOptimizedNetworkStatus() {
  const netInfo = useNetInfo();
  const [connectionQuality, setConnectionQuality] = useState<'poor' | 'good' | 'excellent'>('good');

  useEffect(() => {
    // Determine connection quality based on type and strength
    if (!netInfo.isConnected) {
      setConnectionQuality('poor');
    } else if (netInfo.type === 'wifi') {
      setConnectionQuality('excellent');
    } else if (netInfo.type === 'cellular') {
      setConnectionQuality('good');
    } else {
      setConnectionQuality('poor');
    }
  }, [netInfo]);

  return {
    ...netInfo,
    connectionQuality,
    isHighQuality: connectionQuality === 'excellent',
    isLowQuality: connectionQuality === 'poor',
  };
}

// Hook for optimized image loading
export function useOptimizedImage() {
  const [imageQuality, setImageQuality] = useState<'low' | 'medium' | 'high'>('high');
  const { width: screenWidth } = Dimensions.get('window');

  useEffect(() => {
    // Adjust image quality based on device and screen size
    if (Platform.OS === 'android') {
      if (screenWidth < 360) {
        setImageQuality('low');
      } else if (screenWidth < 480) {
        setImageQuality('medium');
      } else {
        setImageQuality('high');
      }
    } else {
      setImageQuality('high');
    }
  }, [screenWidth]);

  const getImageConfig = useCallback((originalWidth?: number, originalHeight?: number) => {
    const config = {
      quality: imageQuality === 'low' ? 0.6 : imageQuality === 'medium' ? 0.8 : 1,
      maxWidth: imageQuality === 'low' ? 400 : imageQuality === 'medium' ? 600 : 800,
      maxHeight: imageQuality === 'low' ? 300 : imageQuality === 'medium' ? 450 : 600,
    };

    if (originalWidth && originalHeight) {
      // Calculate aspect ratio preserving dimensions
      const aspectRatio = originalWidth / originalHeight;
      if (aspectRatio > 1) {
        config.maxHeight = Math.round(config.maxWidth / aspectRatio);
      } else {
        config.maxWidth = Math.round(config.maxHeight * aspectRatio);
      }
    }

    return config;
  }, [imageQuality]);

  return { imageQuality, getImageConfig };
}

// Hook for optimized list rendering
export function useOptimizedListRendering<T>(data: T[]) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Android-optimized batch size
  const batchSize = useMemo(() => {
    return Platform.OS === 'android' ? 10 : 20;
  }, []);

  useEffect(() => {
    // Load initial batch
    setVisibleItems(data.slice(0, batchSize));
  }, [data, batchSize]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || visibleItems.length >= data.length) return;

    setIsLoadingMore(true);

    // Simulate loading delay for better UX
    setTimeout(() => {
      const nextBatch = data.slice(visibleItems.length, visibleItems.length + batchSize);
      setVisibleItems(prev => [...prev, ...nextBatch]);
      setIsLoadingMore(false);
    }, Platform.OS === 'android' ? 50 : 100);
  }, [data, visibleItems.length, batchSize, isLoadingMore]);

  const refresh = useCallback(() => {
    setVisibleItems(data.slice(0, batchSize));
  }, [data, batchSize]);

  return {
    visibleItems,
    isLoadingMore,
    loadMore,
    refresh,
    hasMore: visibleItems.length < data.length,
  };
}

// Hook for optimized text input
export function useOptimizedTextInput(initialValue: string = '') {
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search for Android performance
  const debouncedValue = useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    return (newValue: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setValue(newValue);
      }, Platform.OS === 'android' ? 150 : 200);
    };
  }, []);

  const handleChangeText = useCallback((text: string) => {
    debouncedValue(text);
  }, [debouncedValue]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return {
    value,
    isFocused,
    handleChangeText,
    handleFocus,
    handleBlur,
    setValue: (newValue: string) => {
      setValue(newValue);
      debouncedValue(newValue);
    },
  };
}

// Hook for optimized modal animations
export function useOptimizedModal() {
  const [isVisible, setIsVisible] = useState(false);

  const showModal = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    showModal,
    hideModal,
  };
}

// Performance monitoring utility
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string) {
    this.startTimes.set(label, Date.now());
  }

  endTimer(label: string) {
    const startTime = this.startTimes.get(label);
    if (startTime) {
      const duration = Date.now() - startTime;
      const metrics = this.metrics.get(label) || [];
      metrics.push(duration);

      // Keep only last 100 measurements
      if (metrics.length > 100) {
        metrics.shift();
      }

      this.metrics.set(label, metrics);
      this.startTimes.delete(label);

      return duration;
    }
    return 0;
  }

  getAverageTime(label: string): number {
    const metrics = this.metrics.get(label) || [];
    if (metrics.length === 0) return 0;

    return metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
  }

  getMetrics(): Record<string, { average: number; count: number; last: number }> {
    const result: Record<string, { average: number; count: number; last: number }> = {};

    this.metrics.forEach((times, label) => {
      result[label] = {
        average: this.getAverageTime(label),
        count: times.length,
        last: times[times.length - 1] || 0,
      };
    });

    return result;
  }

  clearMetrics() {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

export default {
  usePerformanceMonitor,
  useAppStateOptimization,
  useOptimizedNetworkStatus,
  useOptimizedImage,
  useOptimizedListRendering,
  useOptimizedTextInput,
  useOptimizedModal,
  PerformanceMonitor,
};
