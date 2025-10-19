import React, { useCallback } from 'react';
import { TouchableOpacity, Platform, TouchableOpacityProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useAndroidTouchFeedback } from '../utils/animations';

interface TouchFeedbackProps extends TouchableOpacityProps {
  children: React.ReactNode;
  feedbackType?: 'scale' | 'opacity' | 'both';
  scale?: number;
  duration?: number;
  hapticFeedback?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  feedbackType = 'scale',
  scale = 0.95,
  duration = 150,
  hapticFeedback = true,
  disabled = false,
  onPress,
  style,
  ...props
}) => {
  // Use the optimized Android touch feedback hook
  const { animatedStyle: touchStyle, pressIn, pressOut } = useAndroidTouchFeedback();

  // Additional animation values for custom feedback
  const customScale = useSharedValue(1);
  const customOpacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (disabled) return;

    if (feedbackType === 'scale' || feedbackType === 'both') {
      customScale.value = withSpring(scale, { damping: 15, stiffness: 300 });
    }
    if (feedbackType === 'opacity' || feedbackType === 'both') {
      customOpacity.value = withTiming(0.7, { duration });
    }

    pressIn();
  }, [disabled, feedbackType, scale, duration, pressIn]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;

    if (feedbackType === 'scale' || feedbackType === 'both') {
      customScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
    if (feedbackType === 'opacity' || feedbackType === 'both') {
      customOpacity.value = withTiming(1, { duration });
    }

    pressOut();
  }, [disabled, feedbackType, duration, pressOut]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    onPress?.();
  }, [disabled, onPress]);

  // Custom animated style
  const customStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: customScale.value },
    ],
    opacity: customOpacity.value,
  }));

  // Combine styles
  const combinedStyle = [touchStyle as any, customStyle];

  return (
    <Animated.View style={combinedStyle as any}>
      <TouchableOpacity
        style={style}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={1} // We handle opacity with animations
        delayPressIn={Platform.OS === 'android' ? 0 : 50}
        delayPressOut={Platform.OS === 'android' ? 0 : 50}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Specialized components for common use cases
export const ScaleButton: React.FC<Omit<TouchFeedbackProps, 'feedbackType'>> = (props) => (
  <TouchFeedback {...props} feedbackType="scale" />
);

export const OpacityButton: React.FC<Omit<TouchFeedbackProps, 'feedbackType'>> = (props) => (
  <TouchFeedback {...props} feedbackType="opacity" />
);

export const CombinedButton: React.FC<Omit<TouchFeedbackProps, 'feedbackType'>> = (props) => (
  <TouchFeedback {...props} feedbackType="both" />
);

// Hook for programmatic touch feedback
export function useTouchFeedback() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const triggerFeedback = useCallback((
    type: 'scale' | 'opacity' | 'both' = 'scale',
    config?: { scale?: number; opacity?: number; duration?: number }
  ) => {
    const {
      scale: targetScale = 0.95,
      opacity: targetOpacity = 0.7,
      duration = 150
    } = config || {};

    if (type === 'scale' || type === 'both') {
      scale.value = withSpring(targetScale, { damping: 15, stiffness: 300 });
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }, duration);
    }

    if (type === 'opacity' || type === 'both') {
      opacity.value = withTiming(targetOpacity, { duration });
      setTimeout(() => {
        opacity.value = withTiming(1, { duration });
      }, duration);
    }
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { triggerFeedback, animatedStyle };
}

export default TouchFeedback;
