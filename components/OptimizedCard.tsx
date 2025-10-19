import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { ANIMATION_CONFIG, useAndroidTouchFeedback } from '../utils/animations';

interface OptimizedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'elevated' | 'outlined' | 'filled' | 'ghost';
  padding?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'xl';
  shadow?: boolean;
  animated?: boolean;
  hapticFeedback?: boolean;
}

const OptimizedCard: React.FC<OptimizedCardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  variant = 'elevated',
  padding = 'medium',
  borderRadius = 'medium',
  shadow = true,
  animated = true,
  hapticFeedback = true,
}) => {
  const { animatedStyle: touchStyle, pressIn, pressOut } = useAndroidTouchFeedback();

  // Hover effect for web
  const hoverOpacity = useSharedValue(1);

  // Size configurations
  const paddingConfig = {
    none: 0,
    small: Platform.OS === 'android' ? 8 : 12,
    medium: Platform.OS === 'android' ? 12 : 16,
    large: Platform.OS === 'android' ? 16 : 20,
  };

  const borderRadiusConfig = {
    none: 0,
    small: Platform.OS === 'android' ? 4 : 6,
    medium: Platform.OS === 'android' ? 8 : 12,
    large: Platform.OS === 'android' ? 12 : 16,
    xl: Platform.OS === 'android' ? 16 : 20,
  };

  // Base styles
  const cardStyle: ViewStyle = {
    backgroundColor: getCardBackground(variant),
    borderRadius: borderRadiusConfig[borderRadius],
    padding: paddingConfig[padding],
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: variant === 'outlined' ? '#E0E0E0' : 'transparent',
    // Android optimizations
    ...(Platform.OS === 'android' && {
      elevation: shadow && variant === 'elevated' ? 2 : 0,
      // Remove shadow on Android for better performance
      shadowOpacity: 0,
    }),
    // iOS shadow
    ...(Platform.OS === 'ios' && shadow && variant === 'elevated' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
    ...style,
  };

  // Animated style for touch feedback
  const animatedCardStyle = useAnimatedStyle(() => ({
    ...cardStyle,
    ...(animated ? (touchStyle as any) : {}),
  }));

  const handlePressIn = () => {
    if (animated && !disabled) {
      pressIn();
    }
  };

  const handlePressOut = () => {
    if (animated && !disabled) {
      pressOut();
    }
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  const CardComponent = animated ? Animated.View : View;

  if (onPress) {
    return (
      <CardComponent style={animated ? animatedCardStyle : cardStyle}>
        <TouchableOpacity
          style={styles.touchable}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}
          delayPressIn={Platform.OS === 'android' ? 0 : 50}
          delayPressOut={Platform.OS === 'android' ? 0 : 50}
        >
          {children}
        </TouchableOpacity>
      </CardComponent>
    );
  }

  return (
    <CardComponent style={animated ? animatedCardStyle : cardStyle}>
      {children}
    </CardComponent>
  );
};

// Helper functions
function getCardBackground(variant: OptimizedCardProps['variant']) {
  switch (variant) {
    case 'filled':
      return '#007AFF';
    case 'outlined':
    case 'ghost':
      return 'transparent';
    case 'elevated':
    default:
      return '#FFFFFF';
  }
}

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default OptimizedCard;
