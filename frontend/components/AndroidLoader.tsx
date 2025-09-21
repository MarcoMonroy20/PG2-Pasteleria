import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ANIMATION_CONFIG } from '../utils/animations';

interface AndroidLoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
  variant?: 'spinner' | 'pulse' | 'dots' | 'bars';
  fullScreen?: boolean;
}

const AndroidLoader: React.FC<AndroidLoaderProps> = ({
  size = 'medium',
  color = '#007AFF',
  message = 'Cargando...',
  variant = 'spinner',
  fullScreen = false,
}) => {
  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Size configurations
  const sizeConfig = {
    small: { icon: 20, font: 12, spacing: 8 },
    medium: { icon: 32, font: 14, spacing: 12 },
    large: { icon: 48, font: 16, spacing: 16 },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    if (variant === 'spinner') {
      // Continuous rotation
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else if (variant === 'pulse') {
      // Pulsing effect
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else if (variant === 'dots') {
      // Dots animation
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 300 }),
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        false
      );
    }
  }, [variant, rotation, scale, opacity]);

  // Animated styles
  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value }
    ],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Animated.View style={spinnerStyle}>
            <Ionicons name="reload-circle" size={config.icon} color={color} />
          </Animated.View>
        );

      case 'pulse':
        return (
          <Animated.View style={spinnerStyle}>
            <Ionicons name="radio-button-on" size={config.icon} color={color} />
          </Animated.View>
        );

      case 'dots':
        return (
          <Animated.View style={[styles.dotsContainer, dotsStyle]}>
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: color,
                    width: config.icon * 0.15,
                    height: config.icon * 0.15,
                    marginHorizontal: config.icon * 0.1,
                  }
                ]}
              />
            ))}
          </Animated.View>
        );

      case 'bars':
        return (
          <View style={styles.barsContainer}>
            {[0, 1, 2, 3].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.bar,
                  {
                    backgroundColor: color,
                    width: config.icon * 0.15,
                    height: config.icon * (0.6 + Math.sin(Date.now() * 0.001 + index) * 0.3),
                  }
                ]}
              />
            ))}
          </View>
        );

      default:
        return (
          <Animated.View style={spinnerStyle}>
            <Ionicons name="reload-circle" size={config.icon} color={color} />
          </Animated.View>
        );
    }
  };

  const containerStyle = fullScreen
    ? [styles.fullScreenContainer]
    : [styles.container];

  return (
    <View style={containerStyle}>
      {renderLoader()}
      {message && (
        <Text style={[
          styles.message,
          {
            fontSize: config.font,
            color: color,
            marginTop: config.spacing,
          }
        ]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  message: {
    textAlign: 'center',
    fontWeight: Platform.OS === 'android' ? '500' : '400',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 50,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 40,
  },
  bar: {
    marginHorizontal: 2,
    borderRadius: 2,
  },
});

export default AndroidLoader;
