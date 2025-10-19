import React, { forwardRef } from 'react';
import { View, TextInput, Text, ViewStyle, TextStyle } from 'react-native';
import { AndroidAccessibility } from '../utils/android-optimizations';

interface AccessibleInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'off' | 'email' | 'password' | 'username';
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  disabled?: boolean;
  maxLength?: number;
}

const AccessibleInput = forwardRef<TextInput, AccessibleInputProps>(({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  required = false,
  accessibilityLabel,
  accessibilityHint,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete = 'off',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  disabled = false,
  maxLength,
  ...props
}, ref) => {
  // Etiquetas de accesibilidad mejoradas
  const defaultLabel = accessibilityLabel || label || placeholder || 'Campo de entrada';
  const requiredText = required ? ' (requerido)' : '';
  const errorText = error ? ` Error: ${error}` : '';
  const fullAccessibilityLabel = `${defaultLabel}${requiredText}${errorText}`;

  const defaultHint = accessibilityHint ||
    (error ? `Campo requerido con error: ${error}` :
     required ? 'Campo obligatorio' :
     `Ingresa ${label?.toLowerCase() || 'información'}`);

  // Estilos accesibles
  const inputHeight = multiline ?
    Math.max(48, numberOfLines * 20) :
    AndroidAccessibility.minTouchTarget;

  const baseInputStyle: TextStyle = {
    borderWidth: 2,
    borderColor: error ? '#DC3545' : '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: AndroidAccessibility.getAccessibleFontSize(16),
    color: disabled ? '#999999' : '#2C2C2C',
    backgroundColor: disabled ? '#F5F5F5' : '#FFFFFF',
    minHeight: inputHeight,
    textAlignVertical: multiline ? 'top' : 'center',
  };

  const baseLabelStyle: TextStyle = {
    fontSize: AndroidAccessibility.getAccessibleFontSize(16),
    fontWeight: '600',
    color: '#5E336F', // Morado oscuro
    marginBottom: 8,
  };

  const baseErrorStyle: TextStyle = {
    fontSize: AndroidAccessibility.getAccessibleFontSize(14),
    color: '#DC3545',
    marginTop: 4,
    fontWeight: '500',
  };

  return (
    <View style={style}>
      {label && (
        <Text
          style={[baseLabelStyle, labelStyle]}
          importantForAccessibility="no"
        >
          {label}
          {required && <Text style={{ color: '#DC3545' }}> *</Text>}
        </Text>
      )}

      <TextInput
        ref={ref}
        style={[baseInputStyle, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        editable={!disabled}
        maxLength={maxLength}
        accessibilityLabel={fullAccessibilityLabel}
        accessibilityHint={defaultHint}
        accessibilityState={{
          disabled,
        }}
        importantForAccessibility="yes"
        accessibilityLiveRegion={error ? "assertive" : "polite"}
        {...props}
      />

      {error && (
        <Text
          style={[baseErrorStyle, errorStyle]}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          importantForAccessibility="yes"
        >
          {error}
        </Text>
      )}

      {maxLength && (
        <Text
          style={{
            fontSize: 12,
            color: '#999999',
            textAlign: 'right',
            marginTop: 4,
          }}
          accessibilityLabel={`Caracteres restantes: ${maxLength - value.length}`}
          importantForAccessibility="no"
        >
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
});

AccessibleInput.displayName = 'AccessibleInput';

export default AccessibleInput;
