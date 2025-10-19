// Navigation animations optimized for Android
import { Platform } from 'react-native';

// Cargar CardStyleInterpolators de forma segura (evita error si falta el paquete de tipos)
let CardStyleInterpolators: any = {
  forFadeFromBottomAndroid: () => ({}),
  forHorizontalIOS: () => ({}),
  forBottomSheetAndroid: () => ({}),
};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@react-navigation/stack');
  if (mod?.CardStyleInterpolators) {
    CardStyleInterpolators = mod.CardStyleInterpolators;
  }
} catch {}

// Android-optimized screen transition configurations
export const AndroidScreenOptions = {
  // Fade transition
  fade: {
    cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: Platform.OS === 'android' ? 200 : 300,
          easing: 'easeInOut',
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: Platform.OS === 'android' ? 150 : 250,
          easing: 'easeInOut',
        },
      },
    },
  },

  // Slide transition
  slide: {
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: Platform.OS === 'android' ? 250 : 350,
          easing: 'easeOut',
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: Platform.OS === 'android' ? 200 : 300,
          easing: 'easeIn',
        },
      },
    },
  },

  // Scale transition
  scale: {
    cardStyleInterpolator: ({ current, next, layouts }: any) => ({
      cardStyle: {
        transform: [
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
    }),
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: Platform.OS === 'android' ? 300 : 400,
          easing: 'easeOut',
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: Platform.OS === 'android' ? 200 : 300,
          easing: 'easeIn',
        },
      },
    },
  },

  // Modal transition optimized for Android
  modal: {
    presentation: 'modal' as const,
    cardStyleInterpolator: CardStyleInterpolators.forBottomSheetAndroid,
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: Platform.OS === 'android' ? 300 : 400,
          easing: 'easeOut',
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: Platform.OS === 'android' ? 250 : 350,
          easing: 'easeIn',
        },
      },
    },
  },
};

// Tab bar animations optimized for Android
export const AndroidTabBarOptions = {
  // Smooth tab switching
  tabBarStyle: {
    borderTopWidth: 0,
    elevation: Platform.OS === 'android' ? 4 : 0,
    shadowOpacity: Platform.OS === 'android' ? 0.1 : 0,
  },

  // Tab press animations
  tabPressAnimation: {
    scale: Platform.OS === 'android' ? 0.95 : 0.98,
    duration: Platform.OS === 'android' ? 100 : 150,
  },
};

// Header animations optimized for Android
export const AndroidHeaderOptions = {
  // Smooth header transitions
  headerStyle: {
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowOpacity: Platform.OS === 'android' ? 0.1 : 0,
  },

  // Header title animations
  headerTitleStyle: {
    fontSize: Platform.OS === 'android' ? 18 : 17,
    fontWeight: Platform.OS === 'android' ? '600' : '600',
  },

  // Back button animations
  headerLeftContainerStyle: {
    paddingLeft: Platform.OS === 'android' ? 8 : 16,
  },
};

// Custom interpolators optimized for Android performance
export const AndroidCustomInterpolators = {
  // Fast horizontal slide
  fastHorizontal: ({ current, next, layouts }: any) => ({
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
      ],
    },
  }),

  // Vertical slide from bottom
  verticalSlide: ({ current, next, layouts }: any) => ({
    cardStyle: {
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.height, 0],
          }),
        },
      ],
    },
  }),

  // Zoom in/out transition
  zoomTransition: ({ current, next, layouts }: any) => ({
    cardStyle: {
      transform: [
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        },
      ],
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 1],
      }),
    },
  }),
};

// Navigation performance optimizations
export const NavigationPerformance = {
  // Enable/disable animations based on device performance
  shouldUseAnimations: () => {
    // On Android, use simpler animations for better performance
    if (Platform.OS === 'android') {
      // Check device specs or user preferences
      return true; // Can be made dynamic based on device capabilities
    }
    return true;
  },

  // Reduce animation complexity on low-end Android devices
  getOptimizedTransition: (baseTransition: any) => {
    if (Platform.OS !== 'android') return baseTransition;

    // Simplify animations for Android
    return {
      ...baseTransition,
      transitionSpec: {
        ...baseTransition.transitionSpec,
        open: {
          ...baseTransition.transitionSpec.open,
          config: {
            ...baseTransition.transitionSpec.open.config,
            duration: Math.min(baseTransition.transitionSpec.open.config.duration, 250),
          },
        },
        close: {
          ...baseTransition.transitionSpec.close,
          config: {
            ...baseTransition.transitionSpec.close.config,
            duration: Math.min(baseTransition.transitionSpec.close.config.duration, 200),
          },
        },
      },
    };
  },

  // Preload screens for better performance
  preloadScreens: (screenNames: string[]) => {
    // Implementation would depend on navigation library
    console.log('Preloading screens:', screenNames);
  },
};

// Gesture navigation optimizations for Android
export const AndroidGestureConfig = {
  // Edge swipe gestures
  edgeSwipeEnabled: Platform.OS === 'android' && ((typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version) >= 10),

  // Gesture velocity thresholds
  swipeVelocityThreshold: Platform.OS === 'android' ? 500 : 700,
  swipeDistanceThreshold: Platform.OS === 'android' ? 50 : 80,

  // Back gesture area
  backGestureEdgeWidth: Platform.OS === 'android' ? 20 : 30,
};

export default {
  AndroidScreenOptions,
  AndroidTabBarOptions,
  AndroidHeaderOptions,
  AndroidCustomInterpolators,
  NavigationPerformance,
  AndroidGestureConfig,
};
