import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, Platform } from 'react-native';
import { useAndroidTouchFeedback } from '../utils/animations';
import { AndroidAccessibility } from '../utils/android-optimizations';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'tab' | 'switch';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  hapticFeedback?: boolean;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  style,
  textStyle,
  icon,
  hapticFeedback = true,
  ...props
}) => {
  const { animatedStyle, pressIn, pressOut } = useAndroidTouchFeedback();

  // Tamaños accesibles mínimos según WCAG y Android guidelines
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          minHeight: AndroidAccessibility.minTouchTarget,
          minWidth: AndroidAccessibility.minTouchTarget,
          paddingVertical: 8,
          paddingHorizontal: 12,
        };
      case 'large':
        return {
          minHeight: Math.max(AndroidAccessibility.minTouchTarget, 56),
          minWidth: Math.max(AndroidAccessibility.minTouchTarget, 56),
          paddingVertical: 16,
          paddingHorizontal: 24,
        };
      default: // medium
        return {
          minHeight: AndroidAccessibility.minTouchTarget,
          minWidth: AndroidAccessibility.minTouchTarget,
          paddingVertical: 12,
          paddingHorizontal: 16,
        };
    }
  };

  const getVariantStyles = () => {
    const baseStyle = {
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      gap: 8,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: '#E75480', // Rosa fuerte
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: '#F28DB2', // Rosa medio
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: '#E75480',
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyles = () => {
    const baseTextStyle = {
      fontWeight: '600' as const,
      textAlign: 'center' as const,
    };

    const sizeStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    const variantStyles = {
      primary: { color: '#FFFFFF' },
      secondary: { color: '#FFFFFF' },
      outline: { color: '#E75480' },
      ghost: { color: '#5E336F' }, // Morado oscuro
    };

    return {
      ...baseTextStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const textStyles = getTextStyles();

  // Estado deshabilitado
  const disabledStyles = disabled ? {
    opacity: 0.5,
  } : {};

  // Etiquetas de accesibilidad
  const defaultAccessibilityLabel = accessibilityLabel || title;
  const defaultAccessibilityHint = accessibilityHint ||
    (disabled ? 'Botón deshabilitado' : loading ? 'Cargando...' : `Presiona para ${title.toLowerCase()}`);

  return (
    <TouchableOpacity
      style={[
        sizeStyles,
        variantStyles,
        animatedStyle,
        disabledStyles,
        style,
      ]}
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      accessibilityLabel={defaultAccessibilityLabel}
      accessibilityHint={defaultAccessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      importantForAccessibility="yes"
      {...props}
    >
      {icon && !loading && icon}
      <Text
        style={[
          textStyles,
          disabled && { color: '#CCCCCC' },
          textStyle,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit={size === 'small'}
        minimumFontScale={0.8}
      >
        {loading ? 'Cargando...' : title}
      </Text>
    </TouchableOpacity>
  );
};

export default AccessibleButton;
