import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Detectar si es pantalla pequeña (Samsung 2019, etc.)
export const isSmallScreen = screenWidth < 400 || screenHeight < 700;

// Detectar si es pantalla muy pequeña
export const isVerySmallScreen = screenWidth < 360 || screenHeight < 640;

// Detectar si es pantalla extra pequeña (dispositivos muy antiguos)
export const isExtraSmallScreen = screenWidth < 320 || screenHeight < 568;

// Obtener dimensiones adaptativas
export const getResponsiveDimensions = () => {
  const baseWidth = 375; // iPhone base width
  const baseHeight = 812; // iPhone base height
  
  const scaleX = screenWidth / baseWidth;
  const scaleY = screenHeight / baseHeight;
  
  return {
    screenWidth,
    screenHeight,
    scaleX: Math.min(scaleX, 1.2), // Limitar escala máxima
    scaleY: Math.min(scaleY, 1.2),
    isSmallScreen,
    isVerySmallScreen,
    isExtraSmallScreen,
  };
};

// Estilos responsivos para modales
export const getModalStyles = () => {
  const { isSmallScreen, isVerySmallScreen, isExtraSmallScreen } = getResponsiveDimensions();
  
  if (isExtraSmallScreen) {
    return {
      container: {
        width: '98%',
        maxHeight: '95%',
        padding: 8,
      },
      header: {
        paddingHorizontal: 12,
        paddingVertical: 8,
      },
      title: {
        fontSize: 16,
      },
      body: {
        padding: 12,
        maxHeight: 300,
      },
      buttonGrid: {
        columns: 2,
        buttonSize: 'small',
        buttonPadding: 8,
        buttonMargin: 4,
      },
      buttons: {
        padding: 12,
        flexDirection: 'row' as const,
        gap: 8,
      },
    };
  }
  
  if (isVerySmallScreen) {
    return {
      container: {
        width: '96%',
        maxHeight: '90%',
        padding: 12,
      },
      header: {
        paddingHorizontal: 16,
        paddingVertical: 10,
      },
      title: {
        fontSize: 18,
      },
      body: {
        padding: 16,
        maxHeight: 350,
      },
      buttonGrid: {
        columns: 2,
        buttonSize: 'medium',
        buttonPadding: 10,
        buttonMargin: 6,
      },
      buttons: {
        padding: 16,
        flexDirection: 'row' as const,
        gap: 10,
      },
    };
  }
  
  if (isSmallScreen) {
    return {
      container: {
        width: '95%',
        maxHeight: '85%',
        padding: 16,
      },
      header: {
        paddingHorizontal: 20,
        paddingVertical: 12,
      },
      title: {
        fontSize: 20,
      },
      body: {
        padding: 20,
        maxHeight: 400,
      },
      buttonGrid: {
        columns: 3,
        buttonSize: 'medium',
        buttonPadding: 12,
        buttonMargin: 8,
      },
      buttons: {
        padding: 20,
        flexDirection: 'row' as const,
        gap: 12,
      },
    };
  }
  
  // Pantalla normal
  return {
    container: {
      width: '95%',
      maxWidth: 500,
      maxHeight: '85%',
      padding: 20,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    title: {
      fontSize: 22,
    },
    body: {
      padding: 20,
      maxHeight: 450,
    },
    buttonGrid: {
      columns: 3,
      buttonSize: 'large',
      buttonPadding: 16,
      buttonMargin: 10,
    },
    buttons: {
      padding: 20,
      flexDirection: 'row' as const,
      gap: 16,
    },
  };
};

// Estilos responsivos para botones de grid
export const getButtonStyles = (size: 'small' | 'medium' | 'large') => {
  const baseStyles = {
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  
  switch (size) {
    case 'small':
      return {
        ...baseStyles,
        paddingHorizontal: 8,
        paddingVertical: 6,
        minHeight: 32,
        margin: 2,
      };
    case 'medium':
      return {
        ...baseStyles,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 40,
        margin: 4,
      };
    case 'large':
      return {
        ...baseStyles,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 48,
        margin: 6,
      };
    default:
      return baseStyles;
  }
};

// Estilos responsivos para pantallas
export const getScreenStyles = () => {
  const { isSmallScreen, isVerySmallScreen, isExtraSmallScreen } = getResponsiveDimensions();
  
  if (isExtraSmallScreen) {
    return {
      container: {
        paddingHorizontal: 8,
        paddingVertical: 8,
      },
      header: {
        paddingHorizontal: 12,
        paddingVertical: 8,
      },
      title: {
        fontSize: 18,
      },
      input: {
        padding: 10,
        fontSize: 14,
      },
      button: {
        padding: 12,
        minHeight: 40,
      },
      card: {
        padding: 8,
        margin: 4,
      },
    };
  }
  
  if (isVerySmallScreen) {
    return {
      container: {
        paddingHorizontal: 12,
        paddingVertical: 12,
      },
      header: {
        paddingHorizontal: 16,
        paddingVertical: 10,
      },
      title: {
        fontSize: 20,
      },
      input: {
        padding: 12,
        fontSize: 15,
      },
      button: {
        padding: 14,
        minHeight: 44,
      },
      card: {
        padding: 12,
        margin: 6,
      },
    };
  }
  
  if (isSmallScreen) {
    return {
      container: {
        paddingHorizontal: 16,
        paddingVertical: 16,
      },
      header: {
        paddingHorizontal: 20,
        paddingVertical: 12,
      },
      title: {
        fontSize: 22,
      },
      input: {
        padding: 14,
        fontSize: 16,
      },
      button: {
        padding: 16,
        minHeight: 48,
      },
      card: {
        padding: 16,
        margin: 8,
      },
    };
  }
  
  // Pantalla normal
  return {
    container: {
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    header: {
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    title: {
      fontSize: 24,
    },
    input: {
      padding: 16,
      fontSize: 16,
    },
    button: {
      padding: 20,
      minHeight: 52,
    },
    card: {
      padding: 20,
      margin: 10,
    },
  };
};

// Hook para usar en componentes
export const useResponsive = () => {
  return {
    ...getResponsiveDimensions(),
    modalStyles: getModalStyles(),
    screenStyles: getScreenStyles(),
    buttonStyles: getButtonStyles,
  };
};

