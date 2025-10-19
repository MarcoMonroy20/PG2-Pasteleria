import React, { useEffect, useMemo } from 'react';
import { FlatList, View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { PerformanceUtils } from '../utils/animations';

interface OptimizedListProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  keyExtractor?: (item: T, index: number) => string;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement;
  showsVerticalScrollIndicator?: boolean;
  contentContainerStyle?: any;
  style?: any;
  numColumns?: number;
  horizontal?: boolean;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  enableStaggeredAnimation?: boolean;
  animationDelay?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function OptimizedList<T>({
  data,
  renderItem,
  keyExtractor,
  onEndReached,
  onRefresh,
  refreshing = false,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  showsVerticalScrollIndicator = false,
  contentContainerStyle,
  style,
  numColumns = 1,
  horizontal = false,
  initialNumToRender,
  maxToRenderPerBatch,
  windowSize,
  enableStaggeredAnimation = true,
  animationDelay = 50,
}: OptimizedListProps<T>) {
  // Staggered animation values
  const animationValues = useMemo(() =>
    data.map(() => useSharedValue(enableStaggeredAnimation ? 0 : 1)),
    [data.length, enableStaggeredAnimation]
  );

  // Trigger staggered animation when data changes
  useEffect(() => {
    if (!enableStaggeredAnimation || data.length === 0) return;

    animationValues.forEach((anim, index) => {
      setTimeout(() => {
        anim.value = withTiming(1, {
          duration: Platform.OS === 'android' ? 300 : 400,
        });
      }, index * animationDelay);
    });
  }, [data.length, enableStaggeredAnimation, animationDelay]);

  // Android-optimized list configuration
  const listConfig = useMemo(() => ({
    initialNumToRender: initialNumToRender ?? (Platform.OS === 'android' ? 6 : 8),
    maxToRenderPerBatch: maxToRenderPerBatch ?? (Platform.OS === 'android' ? 3 : 5),
    updateCellsBatchingPeriod: Platform.OS === 'android' ? 30 : 50,
    windowSize: windowSize ?? (Platform.OS === 'android' ? 8 : 12),
    removeClippedSubviews: Platform.OS === 'android',
    legacyImplementation: false,
    // Android-specific optimizations
    ...(Platform.OS === 'android' && {
      getItemLayout: (data: any, index: number) => ({
        length: 80, // Estimated item height
        offset: 80 * index,
        index,
      }),
    }),
  }), [initialNumToRender, maxToRenderPerBatch, windowSize]);

  // Enhanced renderItem with staggered animation
  const enhancedRenderItem = ({ item, index }: { item: T; index: number }) => {
    if (!enableStaggeredAnimation) {
      return renderItem({ item, index });
    }

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: animationValues[index]?.value ?? 1,
      transform: [{
        translateY: interpolate(
          animationValues[index]?.value ?? 1,
          [0, 1],
          [20, 0]
        )
      }],
    }));

    return (
      <Animated.View style={animatedStyle}>
        {renderItem({ item, index })}
      </Animated.View>
    );
  };

  // Default empty component
  const DefaultEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No hay elementos para mostrar</Text>
    </View>
  );

  // Optimized FlatList configuration
  const flatListProps = {
    data,
    renderItem: enhancedRenderItem,
    keyExtractor: keyExtractor || ((item: T, index: number) => `${index}`),
    onEndReached: onEndReached,
    onEndReachedThreshold: 0.1,
    onRefresh: onRefresh,
    refreshing: refreshing,
    ListEmptyComponent: ListEmptyComponent || <DefaultEmptyComponent />,
    ListHeaderComponent: ListHeaderComponent,
    ListFooterComponent: ListFooterComponent,
    showsVerticalScrollIndicator,
    showsHorizontalScrollIndicator: false,
    contentContainerStyle: [
      !horizontal && styles.verticalContent,
      contentContainerStyle
    ],
    style: [
      styles.list,
      style
    ],
    numColumns,
    horizontal,
    // Performance optimizations
    ...listConfig,
    // Android-specific scroll optimizations
    ...(Platform.OS === 'android' && {
      scrollEventThrottle: 16,
      decelerationRate: 'normal' as const,
      overScrollMode: 'never' as const,
      disableIntervalMomentum: true,
    }),
  };

  return <FlatList {...flatListProps} />;
}

// Styles optimized for Android
const styles = StyleSheet.create({
  list: {
    flex: 1,
    // Android-specific optimizations
    ...(Platform.OS === 'android' && {
      elevation: 0, // Remove elevation for better performance
    }),
  },
  verticalContent: {
    paddingBottom: Platform.OS === 'android' ? 20 : 30,
    ...(Platform.OS === 'android' && {
      paddingHorizontal: 4, // Reduce padding for better performance
    }),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: screenHeight * 0.2,
  },
  emptyText: {
    fontSize: Platform.OS === 'android' ? 14 : 16,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});

export default OptimizedList;
