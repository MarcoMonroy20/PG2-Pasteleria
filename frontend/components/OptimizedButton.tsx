import React, { useCallback } from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ANIMATION_CONFIG } from '../utils/animations';

interface OptimizedButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
}

const OptimizedButton: React.FC<OptimizedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
  hapticFeedback = true,
}) => {
  // Shared values for animations
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  // Android-specific haptic feedback
  const triggerHapticFeedback = useCallback(() => {
    if (Platform.OS === 'android' && hapticFeedback && !disabled) {
      // Android haptic feedback
      try {
        // For newer Android versions
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      } catch (error) {
        // Fallback: no haptic feedback
      }
    }
  }, [hapticFeedback, disabled]);

  // Press handlers with optimized animations for Android
  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;

    scale.value = withSpring(0.96, ANIMATION_CONFIG.SOFT);
    pressed.value = withTiming(1, ANIMATION_CONFIG.FAST);
    triggerHapticFeedback();
  }, [disabled, loading, scale, pressed, triggerHapticFeedback]);

  const handlePressOut = useCallback(() => {
    if (disabled || loading) return;

    scale.value = withSpring(1, ANIMATION_CONFIG.BOUNCE);
    pressed.value = withTiming(0, ANIMATION_CONFIG.FAST);
  }, [disabled, loading, scale, pressed]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    onPress();
  }, [disabled, loading, onPress]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolate(
      pressed.value,
      [0, 1],
      [
        getButtonColor(variant, disabled).background,
        getButtonColor(variant, disabled).pressed
      ]
    ),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolate(
      pressed.value,
      [0, 1],
      [
        getButtonColor(variant, disabled).text,
        getButtonColor(variant, disabled).textPressed
      ]
    ),
  }));

  // Size configurations
  const sizeConfig = {
    small: {
      paddingVertical: Platform.OS === 'android' ? 8 : 10,
      paddingHorizontal: Platform.OS === 'android' ? 12 : 16,
      fontSize: Platform.OS === 'android' ? 12 : 14,
      iconSize: 16,
    },
    medium: {
      paddingVertical: Platform.OS === 'android' ? 12 : 14,
      paddingHorizontal: Platform.OS === 'android' ? 20 : 24,
      fontSize: Platform.OS === 'android' ? 14 : 16,
      iconSize: 18,
    },
    large: {
      paddingVertical: Platform.OS === 'android' ? 16 : 18,
      paddingHorizontal: Platform.OS === 'android' ? 24 : 28,
      fontSize: Platform.OS === 'android' ? 16 : 18,
      iconSize: 20,
    },
  };

  const config = sizeConfig[size];

  const buttonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Platform.OS === 'android' ? 8 : 12,
    paddingVertical: config.paddingVertical,
    paddingHorizontal: config.paddingHorizontal,
    minHeight: Platform.OS === 'android' ? 44 : 48, // Android accessibility
    ...getButtonStyle(variant),
    ...(fullWidth && { width: '100%' }),
    ...(disabled && { opacity: 0.6 }),
    ...style,
  };

  const buttonTextStyle: TextStyle = {
    fontSize: config.fontSize,
    fontWeight: Platform.OS === 'android' ? '600' : '500',
    textAlign: 'center',
    ...textStyle,
  };

  return (
    <Animated.View style={animatedContainerStyle}>
      <TouchableOpacity
        style={buttonStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={1} // We handle opacity with animations
        delayPressIn={Platform.OS === 'android' ? 0 : 50} // Faster on Android
        delayPressOut={Platform.OS === 'android' ? 0 : 50}
      >
        {loading ? (
          <Animated.View
            style={{
              width: config.iconSize,
              height: config.iconSize,
              borderWidth: 2,
              borderColor: getButtonColor(variant, disabled).text,
              borderTopColor: 'transparent',
              borderRadius: config.iconSize / 2,
              transform: [{ rotate: '0deg' }],
            }}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons
                name={icon}
                size={config.iconSize}
                color={getButtonColor(variant, disabled).text}
                style={{ marginRight: title ? 8 : 0 }}
              />
            )}

            {title && (
              <Animated.Text style={[buttonTextStyle, animatedTextStyle]}>
                {title}
              </Animated.Text>
            )}

            {icon && iconPosition === 'right' && (
              <Ionicons
                name={icon}
                size={config.iconSize}
                color={getButtonColor(variant, disabled).text}
                style={{ marginLeft: title ? 8 : 0 }}
              />
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Helper functions for styling
function getButtonColor(variant: OptimizedButtonProps['variant'], disabled: boolean) {
  if (disabled) {
    return {
      background: '#E0E0E0',
      text: '#9E9E9E',
      pressed: '#E0E0E0',
      textPressed: '#9E9E9E',
    };
  }

  switch (variant) {
    case 'primary':
      return {
        background: '#007AFF',
        text: '#FFFFFF',
        pressed: '#0056CC',
        textPressed: '#FFFFFF',
      };
    case 'secondary':
      return {
        background: '#5856D6',
        text: '#FFFFFF',
        pressed: '#3C3A99',
        textPressed: '#FFFFFF',
      };
    case 'outline':
      return {
        background: 'transparent',
        text: '#007AFF',
        pressed: 'rgba(0, 122, 255, 0.1)',
        textPressed: '#0056CC',
      };
    case 'ghost':
      return {
        background: 'transparent',
        text: '#007AFF',
        pressed: 'rgba(0, 122, 255, 0.05)',
        textPressed: '#0056CC',
      };
    default:
      return {
        background: '#007AFF',
        text: '#FFFFFF',
        pressed: '#0056CC',
        textPressed: '#FFFFFF',
      };
  }
}

function getButtonStyle(variant: OptimizedButtonProps['variant']) {
  switch (variant) {
    case 'outline':
      return {
        borderWidth: 1,
        borderColor: '#007AFF',
      };
    case 'ghost':
      return {};
    default:
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      };
  }
}

export default OptimizedButton;
