import React, { memo, useMemo, useCallback, forwardRef } from 'react';
import { FlatList, FlatListProps, ViewStyle, StyleSheet } from 'react-native';
import { PerformanceMonitor } from '../hooks/useOptimizedPerformance';
import { useOptimizedListRendering } from '../hooks/useOptimizedPerformance';

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  enablePerformanceMonitoring?: boolean;
  enableVirtualization?: boolean;
  style?: ViewStyle;
}

// Componente FlatList optimizado con memoización automática
const OptimizedFlatList = memo(forwardRef<FlatList, OptimizedFlatListProps<any>>(({
  data,
  renderItem,
  itemHeight = 100,
  enablePerformanceMonitoring = false,
  enableVirtualization = true,
  style,
  ...props
}, ref) => {
  const performanceMonitor = PerformanceMonitor.getInstance();

  // Configuración de virtualización optimizada
  const virtualizationConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    maxToRenderPerBatch: enableVirtualization ? 5 : 10,
    updateCellsBatchingPeriod: enableVirtualization ? 50 : 100,
    initialNumToRender: enableVirtualization ? Math.min(data.length, 8) : Math.min(data.length, 15),
    windowSize: enableVirtualization ? 10 : 15,
    removeClippedSubviews: enableVirtualization,
    getItemLayout: itemHeight > 0 ? (data: any, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }) : undefined,
  }), [data.length, itemHeight, enableVirtualization]);

  // Memoizar el renderItem para evitar re-renders innecesarios
  const memoizedRenderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    if (enablePerformanceMonitoring) {
      performanceMonitor.startTimer(`render_item_${index}`);
    }

    const element = renderItem(item, index);

    if (enablePerformanceMonitoring) {
      performanceMonitor.endTimer(`render_item_${index}`);
    }

    return element;
  }, [renderItem, enablePerformanceMonitoring, performanceMonitor]);

  // Memoizar keyExtractor
  const memoizedKeyExtractor = useCallback((item: any, index: number) => {
    // Intentar usar un ID único del item, o fallback al índice
    return item?.id?.toString() || item?.key?.toString() || `item_${index}`;
  }, []);

  // Configuración optimizada por defecto
  const optimizedProps = useMemo(() => ({
    ...virtualizationConfig,
    keyExtractor: memoizedKeyExtractor,
    renderItem: memoizedRenderItem,
    showsVerticalScrollIndicator: true,
    showsHorizontalScrollIndicator: false,
    scrollEventThrottle: 16,
    disableIntervalMomentum: false,
    decelerationRate: 'normal',
    maxToRenderPerBatch: virtualizationConfig.maxToRenderPerBatch,
    updateCellsBatchingPeriod: virtualizationConfig.updateCellsBatchingPeriod,
    initialNumToRender: virtualizationConfig.initialNumToRender,
    windowSize: virtualizationConfig.windowSize,
    removeClippedSubviews: virtualizationConfig.removeClippedSubviews,
    getItemLayout: virtualizationConfig.getItemLayout,
  }), [virtualizationConfig, memoizedKeyExtractor, memoizedRenderItem]);

  return (
    <FlatList
      ref={ref}
      data={data}
      style={[styles.container, style]}
      {...optimizedProps}
      {...props}
    />
  );
}));

OptimizedFlatList.displayName = 'OptimizedFlatList';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default OptimizedFlatList;
