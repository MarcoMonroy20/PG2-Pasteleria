// Animations and Performance Utilities for Android Optimization
import { Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

// Android-specific animation configurations
export const ANIMATION_CONFIG = {
  // Timing configurations optimized for Android
  FAST: {
    duration: Platform.OS === 'android' ? 150 : 200,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  NORMAL: {
    duration: Platform.OS === 'android' ? 250 : 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  SLOW: {
    duration: Platform.OS === 'android' ? 400 : 500,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },

  // Spring configurations optimized for Android
  BOUNCE: {
    damping: Platform.OS === 'android' ? 12 : 15,
    stiffness: Platform.OS === 'android' ? 120 : 100,
    mass: Platform.OS === 'android' ? 0.8 : 1,
  },
  SOFT: {
    damping: Platform.OS === 'android' ? 20 : 25,
    stiffness: Platform.OS === 'android' ? 180 : 150,
    mass: Platform.OS === 'android' ? 0.6 : 0.8,
  },
};

// Hook for fade animations
export function useFadeAnimation(initialValue: number = 0) {
  const opacity = useSharedValue(initialValue);
  const translateY = useSharedValue(initialValue === 0 ? 20 : 0);

  const fadeIn = () => {
    opacity.value = withTiming(1, ANIMATION_CONFIG.NORMAL);
    translateY.value = withTiming(0, ANIMATION_CONFIG.NORMAL);
  };

  const fadeOut = () => {
    opacity.value = withTiming(0, ANIMATION_CONFIG.FAST);
    translateY.value = withTiming(20, ANIMATION_CONFIG.FAST);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { animatedStyle, fadeIn, fadeOut, opacity, translateY };
}

// Hook for scale animations (press feedback)
export function useScaleAnimation(initialScale: number = 1) {
  const scale = useSharedValue(initialScale);

  const pressIn = () => {
    scale.value = withSpring(0.95, ANIMATION_CONFIG.SOFT);
  };

  const pressOut = () => {
    scale.value = withSpring(1, ANIMATION_CONFIG.BOUNCE);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, pressIn, pressOut, scale };
}

// Hook for slide animations
export function useSlideAnimation(direction: 'left' | 'right' | 'up' | 'down' = 'up') {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: 50, y: 0 };
      case 'right': return { x: -50, y: 0 };
      case 'up': return { x: 0, y: 50 };
      case 'down': return { x: 0, y: -50 };
      default: return { x: 0, y: 50 };
    }
  };

  const slideIn = () => {
    const { x, y } = getInitialPosition();
    translateX.value = withTiming(0, ANIMATION_CONFIG.NORMAL);
    translateY.value = withTiming(0, ANIMATION_CONFIG.NORMAL);
    opacity.value = withTiming(1, ANIMATION_CONFIG.NORMAL);
  };

  const slideOut = () => {
    const { x, y } = getInitialPosition();
    translateX.value = withTiming(x, ANIMATION_CONFIG.FAST);
    translateY.value = withTiming(y, ANIMATION_CONFIG.FAST);
    opacity.value = withTiming(0, ANIMATION_CONFIG.FAST);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
  }));

  return { animatedStyle, slideIn, slideOut };
}

// Hook for loading spinner animation
export function useLoadingAnimation() {
  const rotation = useSharedValue(0);

  const startLoading = () => {
    rotation.value = withTiming(360, {
      duration: 1000,
      easing: Easing.linear,
    }, () => {
      rotation.value = 0;
      if (rotation.value !== 360) {
        runOnJS(startLoading)();
      }
    });
  };

  const stopLoading = () => {
    rotation.value = 0;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return { animatedStyle, startLoading, stopLoading };
}

// Hook for staggered list animations
export function useStaggeredAnimation(itemCount: number, delay: number = 50) {
  const animations = Array.from({ length: itemCount }, () =>
    useSharedValue(0)
  );

  const animateIn = () => {
    animations.forEach((anim, index) => {
      anim.value = withDelay(
        index * delay,
        withSpring(1, ANIMATION_CONFIG.BOUNCE)
      );
    });
  };

  const animateOut = () => {
    animations.forEach((anim, index) => {
      anim.value = withTiming(0, ANIMATION_CONFIG.FAST);
    });
  };

  const getAnimatedStyle = (index: number) => {
    return useAnimatedStyle(() => ({
      opacity: animations[index]?.value ?? 0,
      transform: [{
        translateY: interpolate(
          animations[index]?.value ?? 0,
          [0, 1],
          [20, 0],
          Extrapolate.CLAMP
        )
      }],
    }));
  };

  return { animateIn, animateOut, getAnimatedStyle };
}

// Hook for tab switching animations
export function useTabAnimation() {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const switchTab = (direction: 'left' | 'right') => {
    const offset = direction === 'left' ? -20 : 20;

    opacity.value = withTiming(0, ANIMATION_CONFIG.FAST);
    translateX.value = withTiming(offset, ANIMATION_CONFIG.FAST, () => {
      translateX.value = withTiming(0, ANIMATION_CONFIG.NORMAL);
      opacity.value = withTiming(1, ANIMATION_CONFIG.NORMAL);
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return { animatedStyle, switchTab };
}

// Optimized touch feedback for Android
export function useAndroidTouchFeedback() {
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue(0);

  const pressIn = () => {
    scale.value = withSpring(0.98, ANIMATION_CONFIG.SOFT);
    backgroundColor.value = withTiming(1, ANIMATION_CONFIG.FAST);
  };

  const pressOut = () => {
    scale.value = withSpring(1, ANIMATION_CONFIG.BOUNCE);
    backgroundColor.value = withTiming(0, ANIMATION_CONFIG.FAST);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolate(
      backgroundColor.value,
      [0, 1],
      ['rgba(0,0,0,0)', 'rgba(0,0,0,0.05)']
    ),
  }));

  return { animatedStyle, pressIn, pressOut };
}

// Performance optimization utilities
export const PerformanceUtils = {
  // Debounce function for search inputs
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  // Throttle function for scroll events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Optimized image loading for Android
  getImageOptimizationConfig: () => ({
    resizeMode: 'cover' as const,
    quality: Platform.OS === 'android' ? 0.8 : 1,
    maxWidth: Platform.OS === 'android' ? 800 : 1200,
    maxHeight: Platform.OS === 'android' ? 600 : 900,
  }),

  // Android-specific list optimization
  getListOptimizationConfig: () => ({
    initialNumToRender: Platform.OS === 'android' ? 8 : 10,
    maxToRenderPerBatch: Platform.OS === 'android' ? 5 : 10,
    updateCellsBatchingPeriod: Platform.OS === 'android' ? 50 : 100,
    windowSize: Platform.OS === 'android' ? 10 : 15,
    removeClippedSubviews: Platform.OS === 'android',
  }),
};

// Android-specific gesture handler configuration
export const GESTURE_CONFIG = {
  // Optimized for Android touch sensitivity
  PRESS_DURATION: Platform.OS === 'android' ? 100 : 130,
  MIN_PRESS_DURATION: Platform.OS === 'android' ? 50 : 80,
  MAX_PRESS_DURATION: Platform.OS === 'android' ? 200 : 250,
  HIT_SLOP: Platform.OS === 'android' ? 8 : 10,
};

export default {
  ANIMATION_CONFIG,
  useFadeAnimation,
  useScaleAnimation,
  useSlideAnimation,
  useLoadingAnimation,
  useStaggeredAnimation,
  useTabAnimation,
  useAndroidTouchFeedback,
  PerformanceUtils,
  GESTURE_CONFIG,
};
