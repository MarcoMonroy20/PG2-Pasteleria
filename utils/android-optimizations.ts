// Android-specific optimizations and compatibility fixes
import { Platform, Dimensions, PixelRatio, StatusBar } from 'react-native';
import { useEffect, useState } from 'react';

// Android device detection and capabilities
export class AndroidDeviceInfo {
  static getDeviceInfo() {
    const { width, height } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    const fontScale = PixelRatio.getFontScale();

    return {
      isAndroid: Platform.OS === 'android',
      version: Platform.Version,
      isEmulator: __DEV__ && height > 2000, // Rough emulator detection
      screenDensity: pixelRatio,
      fontScale,
      screenWidth: width,
      screenHeight: height,
      isTablet: width >= 600,
      isSmallScreen: width < 360,
      hasNotch: this.detectNotch(),
      statusBarHeight: StatusBar.currentHeight || 0,
    };
  }

  static detectNotch(): boolean {
    if (Platform.OS !== 'android') return false;

    const { height, width } = Dimensions.get('window');
    const aspectRatio = height / width;

    // Common notch detection patterns
    return (
      // Android devices with notches
      Platform.Version >= 28 && ( // Android 9+
        aspectRatio > 2.1 || // Very tall screens (foldables, etc.)
        height > 800 // Tall screens that likely have notches
      )
    );
  }

  static getOptimalFontSize(baseSize: number): number {
    if (Platform.OS !== 'android') return baseSize;

    const deviceInfo = this.getDeviceInfo();
    let adjustedSize = baseSize;

    // Adjust for screen density
    if (deviceInfo.screenDensity >= 3) {
      adjustedSize *= 0.9; // High density screens
    } else if (deviceInfo.screenDensity <= 1.5) {
      adjustedSize *= 1.1; // Low density screens
    }

    // Adjust for small screens
    if (deviceInfo.isSmallScreen) {
      adjustedSize *= 0.85;
    }

    // Adjust for font scale
    adjustedSize *= deviceInfo.fontScale;

    return Math.round(adjustedSize);
  }

  static getOptimalSpacing(baseSpacing: number): number {
    if (Platform.OS !== 'android') return baseSpacing;

    const deviceInfo = this.getDeviceInfo();
    let adjustedSpacing = baseSpacing;

    // Reduce spacing on small screens
    if (deviceInfo.isSmallScreen) {
      adjustedSpacing *= 0.8;
    }

    // Increase spacing on tablets
    if (deviceInfo.isTablet) {
      adjustedSpacing *= 1.2;
    }

    return Math.round(adjustedSpacing);
  }
}

// Android-specific gesture and touch optimizations
export const AndroidGestureConfig = {
  // Touch feedback
  hapticFeedbackEnabled: Platform.OS === 'android',
  longPressDelay: Platform.OS === 'android' ? 500 : 700,
  doubleTapDelay: Platform.OS === 'android' ? 200 : 300,

  // Scroll optimizations
  scrollThrottle: Platform.OS === 'android' ? 16 : 32,
  scrollEventThrottle: Platform.OS === 'android' ? 16 : 32,

  // Gesture recognition
  panGestureMinDistance: Platform.OS === 'android' ? 5 : 10,
  pinchGestureMinDistance: Platform.OS === 'android' ? 20 : 30,
};

// Android-specific keyboard optimizations
export function useAndroidKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const keyboardDidShowListener = (e: any) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
    };

    const keyboardDidHideListener = () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    };

    // Android keyboard listeners
    const showSubscription = { remove: () => {} }; // Placeholder
    const hideSubscription = { remove: () => {} }; // Placeholder

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible };
}

// Android-specific memory optimizations
export class AndroidMemoryManager {
  private static memoryWarnings = 0;

  static initialize() {
    if (Platform.OS !== 'android') return;

    // Listen for memory warnings
    const handleMemoryWarning = () => {
      this.memoryWarnings++;
      console.warn(`Android Memory Warning #${this.memoryWarnings}`);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Clear any cached data if memory warnings are frequent
      if (this.memoryWarnings > 2) {
        this.performMemoryCleanup();
      }
    };

    // Android memory warning listener (if available)
    // This is a placeholder for actual implementation
  }

  static performMemoryCleanup() {
    // Clear image caches
    // Clear unused data
    // Force component unmounts if necessary
    console.log('Performing Android memory cleanup...');
  }

  static getMemoryStats() {
    return {
      warnings: this.memoryWarnings,
      platform: Platform.OS,
      version: Platform.Version,
    };
  }
}

// Android-specific animation optimizations
export const AndroidAnimationConfig = {
  // Reduce animation complexity on low-end devices
  useSimplifiedAnimations: () => {
    const deviceInfo = AndroidDeviceInfo.getDeviceInfo();
    return deviceInfo.isAndroid && (
      deviceInfo.screenWidth < 360 || // Very small screens
      ((typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version) < 8) // Old Android versions
    );
  },

  // Stagger animation delays optimized for Android
  getStaggerDelay: (index: number, baseDelay: number = 100) => {
    if (Platform.OS !== 'android') return index * baseDelay;

    const deviceInfo = AndroidDeviceInfo.getDeviceInfo();
    const optimizedDelay = deviceInfo.isSmallScreen ? baseDelay * 0.7 : baseDelay;
    return index * optimizedDelay;
  },

  // Performance-based animation settings
  getAnimationSettings: () => {
    const deviceInfo = AndroidDeviceInfo.getDeviceInfo();

    if (deviceInfo.isAndroid && deviceInfo.screenWidth < 360) {
      // Low-end Android devices
      return {
        duration: 200,
        easing: 'linear',
        useNativeDriver: true,
        disableAnimations: false,
      };
    }

    return {
      duration: 300,
      easing: 'ease',
      useNativeDriver: true,
      disableAnimations: false,
    };
  },
};

// Android-specific accessibility improvements
export const AndroidAccessibility = {
  // Minimum touch target sizes for Android
  minTouchTarget: Platform.OS === 'android' ? 44 : 44,

  // Font scaling for accessibility
  getAccessibleFontSize: (baseSize: number) => {
    const fontScale = PixelRatio.getFontScale();
    return Math.max(baseSize * fontScale, baseSize * 0.8); // Minimum 80% of base size
  },

  // Color contrast optimizations
  highContrastColors: {
    primary: '#0066CC',
    secondary: '#5856D6',
    success: '#28A745',
    error: '#DC3545',
    warning: '#FFC107',
  },

  // Screen reader optimizations
  accessibilityLabels: {
    button: Platform.OS === 'android' ? 'Botón' : 'Button',
    list: Platform.OS === 'android' ? 'Lista' : 'List',
    card: Platform.OS === 'android' ? 'Tarjeta' : 'Card',
  },
};

// Android-specific navigation optimizations
export const AndroidNavigationConfig = {
  // Reduce header height on small Android screens
  getHeaderHeight: () => {
    const deviceInfo = AndroidDeviceInfo.getDeviceInfo();
    if (Platform.OS !== 'android') return 56;

    return deviceInfo.isSmallScreen ? 48 : 56;
  },

  // Tab bar optimizations
  getTabBarHeight: () => {
    const deviceInfo = AndroidDeviceInfo.getDeviceInfo();
    if (Platform.OS !== 'android') return 60;

    return deviceInfo.isSmallScreen ? 50 : 60;
  },

  // Back gesture optimizations
  enableBackGesture: Platform.OS === 'android' && ((typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version) >= 10),
};

// Android-specific storage optimizations
export const AndroidStorageConfig = {
  // Use different storage strategies based on Android version
  getStorageStrategy: () => {
    if (Platform.OS !== 'android') return 'standard';

    const version = (typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version);

    if (version >= 11) return 'scoped-storage'; // Android 11+
    if (version >= 10) return 'legacy-scoped'; // Android 10
    return 'legacy'; // Android 9 and below
  },

  // Image compression settings
  getImageCompressionSettings: () => {
    const deviceInfo = AndroidDeviceInfo.getDeviceInfo();

    return {
      quality: deviceInfo.screenDensity > 2.5 ? 0.7 : 0.8,
      maxWidth: deviceInfo.screenWidth * 0.8,
      maxHeight: deviceInfo.screenHeight * 0.6,
      format: 'jpeg' as const,
    };
  },
};

// Export everything
export default {
  AndroidDeviceInfo,
  AndroidGestureConfig,
  useAndroidKeyboard,
  AndroidMemoryManager,
  AndroidAnimationConfig,
  AndroidAccessibility,
  AndroidNavigationConfig,
  AndroidStorageConfig,
};
