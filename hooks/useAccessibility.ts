import { useState, useEffect, useCallback, useRef } from 'react';
import { AccessibilityInfo, Platform, Keyboard, Dimensions } from 'react-native';
import { AndroidAccessibility } from '../utils/android-optimizations';

interface AccessibilityState {
  screenReaderEnabled: boolean;
  boldTextEnabled: boolean;
  highContrastEnabled: boolean;
  reduceMotionEnabled: boolean;
  fontScale: number;
  screenWidth: number;
  screenHeight: number;
  isLandscape: boolean;
}

export function useAccessibility(): AccessibilityState {
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    screenReaderEnabled: false,
    boldTextEnabled: false,
    highContrastEnabled: false,
    reduceMotionEnabled: false,
    fontScale: 1,
    screenWidth: Dimensions.get('window').width,
    screenHeight: Dimensions.get('window').height,
    isLandscape: Dimensions.get('window').width > Dimensions.get('window').height,
  });

  useEffect(() => {
    const updateAccessibilityState = async () => {
      try {
        const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        const boldTextEnabled = (AccessibilityInfo as any).prefersBoldText?.() ?? false as boolean;
        const highContrastEnabled = (AccessibilityInfo as any).prefersHighContrast?.() ?? false as boolean;
        const reduceMotionEnabled = (AccessibilityInfo as any).prefersReduceMotion?.() ?? false as boolean;

        const { width, height } = Dimensions.get('window');
        const fontScale = Dimensions.get('window').fontScale || 1;

        setAccessibilityState({
          screenReaderEnabled,
          boldTextEnabled,
          highContrastEnabled,
          reduceMotionEnabled,
          fontScale,
          screenWidth: width,
          screenHeight: height,
          isLandscape: width > height,
        });
      } catch (error) {
        console.warn('Error checking accessibility settings:', error);
      }
    };

    updateAccessibilityState();

    // Listeners for changes
    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        setAccessibilityState(prev => ({ ...prev, screenReaderEnabled: enabled }));
      }
    );

    const dimensionSubscription = Dimensions.addEventListener('change', ({ window }) => {
      setAccessibilityState(prev => ({
        ...prev,
        screenWidth: window.width,
        screenHeight: window.height,
        isLandscape: window.width > window.height,
        fontScale: window.fontScale || 1,
      }));
    });

    return () => {
      screenReaderSubscription?.remove();
      dimensionSubscription?.remove();
    };
  }, []);

  return accessibilityState;
}

// Hook for managing focus and keyboard navigation
export function useKeyboardNavigation() {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);
  const itemsRef = useRef<any[]>([]);

  const registerItem = useCallback((index: number, ref: any) => {
    itemsRef.current[index] = ref;
  }, []);

  const unregisterItem = useCallback((index: number) => {
    itemsRef.current[index] = null;
  }, []);

  const focusItem = useCallback((index: number) => {
    if (itemsRef.current[index]) {
      itemsRef.current[index].focus?.();
      setFocusedIndex(index);
    }
  }, []);

  const handleKeyPress = useCallback((event: any, currentIndex: number, totalItems: number) => {
    if (!isKeyboardNavigation) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, totalItems - 1);
        focusItem(nextIndex);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        focusItem(prevIndex);
        break;
      case 'Home':
        event.preventDefault();
        focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        focusItem(totalItems - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        // Trigger the item's action
        itemsRef.current[currentIndex]?.props?.onPress?.();
        break;
    }
  }, [isKeyboardNavigation, focusItem]);

  // Detect keyboard navigation
  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardNavigation(true);
    });

    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardNavigation(false);
    });

    return () => {
      keyboardShowListener?.remove();
      keyboardHideListener?.remove();
    };
  }, []);

  return {
    focusedIndex,
    isKeyboardNavigation,
    registerItem,
    unregisterItem,
    focusItem,
    handleKeyPress,
  };
}

// Hook for announcing screen reader messages
export function useScreenReader() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (Platform.OS === 'web') {
      // Web announcement
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';

      document.body.appendChild(announcement);
      announcement.textContent = message;

      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    } else {
      // Native announcement
      AccessibilityInfo.announceForAccessibility?.(message);
    }
  }, []);

  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(`Éxito: ${message}`, 'polite');
  }, [announce]);

  const announceLoading = useCallback((message: string) => {
    announce(`Cargando: ${message}`, 'polite');
  }, [announce]);

  return {
    announce,
    announceError,
    announceSuccess,
    announceLoading,
  };
}

// Hook for dynamic font scaling
export function useDynamicFontSize(baseSize: number) {
  const { fontScale, boldTextEnabled } = useAccessibility();

  const scaledSize = AndroidAccessibility.getAccessibleFontSize(baseSize * fontScale);

  // Apply bold text preference
  const fontWeight = boldTextEnabled ? 'bold' : 'normal';

  return {
    fontSize: scaledSize,
    fontWeight,
  };
}

// Hook for accessible color schemes
export function useAccessibleColors() {
  const { highContrastEnabled } = useAccessibility();

  const colors = {
    primary: highContrastEnabled ? AndroidAccessibility.highContrastColors.primary : '#E75480',
    secondary: highContrastEnabled ? AndroidAccessibility.highContrastColors.secondary : '#F28DB2',
    success: highContrastEnabled ? AndroidAccessibility.highContrastColors.success : '#28A745',
    error: highContrastEnabled ? AndroidAccessibility.highContrastColors.error : '#DC3545',
    warning: highContrastEnabled ? AndroidAccessibility.highContrastColors.warning : '#FFC107',
    text: highContrastEnabled ? '#000000' : '#2C2C2C',
    background: highContrastEnabled ? '#FFFFFF' : '#FDC8E3',
  };

  return colors;
}

export default {
  useAccessibility,
  useKeyboardNavigation,
  useScreenReader,
  useDynamicFontSize,
  useAccessibleColors,
};
