import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { View, Text, Pressable, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Importar estilos CSS para web
if (Platform.OS === 'web') {
  require('../../styles/tabBar.css');
  const { applyWebTabBarFix, observeTabBarChanges } = require('../../utils/web-tabbar-fix.js');
}

import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { useClientOnlyValue } from '../../components/useClientOnlyValue';
import { useAuth } from '../../contexts/AuthContext';

// Función para calcular tamaños responsive basados en el ancho de pantalla
const useResponsiveTabBar = () => {
  const { width, height } = useWindowDimensions();

  // Detectar plataforma específica
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  // Determinar si es móvil pequeño, tablet, etc.
  // En web, usar umbrales más conservadores ya que las pantallas son más grandes
  const isExtraSmall = isWeb ? width < 300 : width < 350; // Web: muy pequeño solo < 300px
  const isSmallMobile = isWeb ? width < 400 : width < 375; // Web: pequeño < 400px
  const isMediumMobile = isWeb ? width < 600 : width < 414; // Web: mediano < 600px
  const isTablet = width >= 768;
  const isLandscape = width > height;

  // Calcular número de tabs basado en permisos (aproximado)
  const estimatedTabs = 6; // máximo posible
  const availableWidth = width; // Usar TODO el ancho disponible
  const tabWidth = availableWidth / estimatedTabs;
  
  // Calcular tabs visibles dinámicamente
  const getVisibleTabsCount = (userRole: string) => {
    let count = 4; // Tabs base siempre visibles
    if (userRole === 'admin' || userRole === 'dueño') {
      count += 2; // + Cotizaciones y Estadísticas
    }
    return count;
  };

  // Calcular tamaños dinámicos basados en plataforma y ancho disponible
  let tabBarHeight, iconSize, fontSize, paddingVertical, paddingBottom;

  // Ajustes específicos por plataforma
  const androidAdjustment = isAndroid ? 0.9 : 1.0; // Android necesita tamaños ligeramente menores
  const webAdjustment = isWeb ? 1.2 : 1.0; // Web puede usar tamaños ligeramente mayores

  if (isExtraSmall) {
    // Pantallas muy pequeñas
    tabBarHeight = Math.round((isWeb ? 65 : 58) * androidAdjustment * webAdjustment);
    iconSize = Math.round((isWeb ? 12 : 10) * androidAdjustment * webAdjustment);
    fontSize = isWeb ? 8 : 6; // Aumentado para mejor legibilidad
    paddingVertical = isWeb ? 1 : 0;
    paddingBottom = isWeb ? 1 : 0;
  } else if (isSmallMobile) {
    // Pantallas pequeñas
    tabBarHeight = Math.round((isWeb ? 70 : 60) * androidAdjustment * webAdjustment);
    iconSize = Math.round((isWeb ? 16 : 12) * androidAdjustment * webAdjustment);
    fontSize = isWeb ? 9 : 7; // Aumentado para mejor legibilidad
    paddingVertical = isWeb ? 2 : 1;
    paddingBottom = isWeb ? 2 : 1;
  } else if (isMediumMobile) {
    // Pantallas medianas
    tabBarHeight = Math.round((isWeb ? 75 : 65) * androidAdjustment * webAdjustment);
    iconSize = Math.round((isWeb ? 20 : 14) * androidAdjustment * webAdjustment);
    fontSize = isWeb ? 10 : 8; // Aumentado para mejor legibilidad
    paddingVertical = isWeb ? 4 : 2;
    paddingBottom = isWeb ? 4 : 2;
  } else if (isTablet) {
    // Tablets
    tabBarHeight = Math.round(80 * androidAdjustment * webAdjustment);
    iconSize = Math.round(28 * androidAdjustment * webAdjustment);
    fontSize = Math.round(12 * androidAdjustment * webAdjustment);
    paddingVertical = Math.round(10 * androidAdjustment * webAdjustment);
    paddingBottom = Math.round(6 * androidAdjustment * webAdjustment);
  } else {
    // Pantallas grandes (web)
    tabBarHeight = Math.round(76 * androidAdjustment * webAdjustment);
    iconSize = Math.round(24 * androidAdjustment * webAdjustment);
    fontSize = Math.round(11 * androidAdjustment * webAdjustment);
    paddingVertical = Math.round(8 * androidAdjustment * webAdjustment);
    paddingBottom = Math.round(5 * androidAdjustment * webAdjustment);
  }

  const iconSizeInactive = iconSize - 2;

  return {
    tabBarHeight,
    iconSize,
    iconSizeInactive,
    fontSize,
    paddingVertical,
    paddingBottom,
    isExtraSmall,
    isSmallMobile,
    isMediumMobile,
    isTablet,
    isLandscape,
    tabWidth,
    availableWidth,
    isAndroid,
    isIOS,
    isWeb,
    getVisibleTabsCount,
  };
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const responsive = useResponsiveTabBar();
  const { user, hasPermission } = useAuth();
  const [userRole, setUserRole] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Calcular ancho dinámico de tabs basado en rol
  const visibleTabsCount = responsive.getVisibleTabsCount(userRole);
  const dynamicTabWidth = responsive.availableWidth / visibleTabsCount;

  // TODOS los hooks deben estar aquí, antes de cualquier return condicional
  const headerShown = useClientOnlyValue(false, false);

  // Forzar re-render cuando cambie el usuario
  useEffect(() => {
    const newUserRole = user?.role || '';
    setUserRole(newUserRole);
    // Solo marcar como ready cuando tengamos un userRole válido
    if (newUserRole && !isReady) {
      setIsReady(true);
    }
  }, [user?.role, isReady]);

  // Aplicar fix para web cuando el componente se monte
  useEffect(() => {
    if (Platform.OS === 'web' && isReady) {
      const { applyWebTabBarFix, observeTabBarChanges } = require('../../utils/web-tabbar-fix.js');
      
      // Aplicar el fix
      applyWebTabBarFix();
      
      // Observar cambios en el DOM
      const observer = observeTabBarChanges();
      
      // Cleanup
      return () => {
        if (observer) {
          observer.disconnect();
        }
      };
    }
  }, [isReady, userRole]);

  // Mostrar loading mientras no tengamos userRole válido
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[colorScheme ?? 'light'].background }}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <Tabs
      key={`tabs-${userRole}`}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].buttonPrimary,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].textSecondary,
        headerShown,

        // Estilos responsive del tab bar optimizados para evitar sobreposición
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].surface,
          height: responsive.tabBarHeight + insets.bottom,
          paddingBottom: responsive.paddingBottom + insets.bottom,
          paddingTop: responsive.paddingVertical,
          paddingHorizontal: 0, // Sin padding horizontal para aprovechar todo el espacio
          paddingLeft: 0,
          paddingRight: 0,
          marginHorizontal: 0,
          borderTopWidth: 0,
          elevation: Platform.OS === 'android' ? 4 : 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          width: '100%', // Asegurar que use todo el ancho
          flex: 1,
          // Ajustes para landscape en móviles
          ...(responsive.isLandscape ? {
            height: (responsive.tabBarHeight * 0.8) + insets.bottom,
            paddingTop: responsive.paddingVertical * 0.6,
            paddingBottom: (responsive.paddingBottom * 0.6) + insets.bottom,
          } : {}),
        },

        // Distribución perfecta de tabs sin sobreposición
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: dynamicTabWidth,
          maxWidth: dynamicTabWidth,
          width: dynamicTabWidth,
          paddingHorizontal: 0,
          marginHorizontal: 0,
          // Asegurar distribución uniforme
          ...(Platform.OS === 'android' ? {
            flex: 1,
            minWidth: dynamicTabWidth,
            maxWidth: dynamicTabWidth,
            width: dynamicTabWidth,
          } : {}),
          // Estilos específicos para web
          ...(responsive.isWeb ? {
            flex: 1,
            flexBasis: `${100/visibleTabsCount}%`,
            flexGrow: 1,
            flexShrink: 1,
            minWidth: `${100/visibleTabsCount}%`,
            maxWidth: `${100/visibleTabsCount}%`,
            width: `${100/visibleTabsCount}%`,
            display: 'flex',
            boxSizing: 'border-box',
            className: `tab-bar-item tab-bar-item-${visibleTabsCount}`,
          } : {}),
        },


        // Estilos del texto apropiados para cada plataforma
        tabBarLabelStyle: {
          fontSize: Math.max(responsive.fontSize, 8), // Tamaño mínimo de 8
          fontWeight: '600', // Menos negrita para mejor legibilidad
          marginTop: 0,
          textAlign: 'center',
          lineHeight: Math.max(responsive.fontSize * 1.1, 10), // Mejor espaciado
          maxWidth: '100%', // Evita desbordamiento
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          // Ajustes específicos para web
          ...(responsive.isWeb ? {
            fontWeight: '500', // Web: menos negrita
            lineHeight: Math.max(responsive.fontSize * 1.2, 12),
          } : {}),
          // Ajustes específicos para evitar sobreposición en móvil
          ...(responsive.isSmallMobile && !responsive.isWeb ? {
            fontSize: Math.max(responsive.fontSize - 1, 4), // Mínimo 4px
            lineHeight: responsive.fontSize * 0.7,
          } : {}),
          // En landscape con pantallas pequeñas, mostrar solo iconos
          ...(responsive.isLandscape && responsive.isSmallMobile ? {
            display: 'none',
          } : {}),
          // Configuración extrema para pantallas muy pequeñas de móvil
          ...(responsive.isExtraSmall && !responsive.isWeb ? {
            fontSize: 4,
            fontWeight: '900',
            lineHeight: 4 * 0.7,
          } : {}),
        },
      }}
    >
      {/* Renderizar tabs condicionalmente */}
      {(() => {
        const tabs = [];

        // Tabs siempre visibles
        tabs.push(
          <Tabs.Screen
            key="index"
            name="index"
            options={{
              title: responsive.isExtraSmall ? 'Inicio' :
                     responsive.isLandscape && responsive.isSmallMobile ? '' : 'Inicio',
              tabBarIcon: ({ color, focused }) => (
                <FontAwesome
                  name="home"
                  size={focused ? responsive.iconSize : responsive.iconSizeInactive}
                  color={color}
                  style={{
                    marginBottom: responsive.isExtraSmall ? 0 :
                                 responsive.isSmallMobile ? 1 : 2
                  }}
                />
              ),
            }}
          />
        );

        tabs.push(
          <Tabs.Screen
            key="calendario"
            name="calendario"
            options={{
              title: (responsive.isWeb && responsive.isSmallMobile) ? 'Calendario' :
                     (responsive.isSmallMobile && !responsive.isWeb) ? 'Cal.' :
                     responsive.isExtraSmall ? '' :
                     responsive.isLandscape && responsive.isSmallMobile ? '' : 'Calendario',
              tabBarIcon: ({ color, focused }) => (
                <FontAwesome
                  name="calendar"
                  size={focused ? responsive.iconSize : responsive.iconSizeInactive}
                  color={color}
                  style={{
                    marginBottom: responsive.isExtraSmall ? 0 :
                                 responsive.isSmallMobile ? 1 : 2
                  }}
                />
              ),
            }}
          />
        );

        tabs.push(
          <Tabs.Screen
            key="proximos-pedidos"
            name="proximos-pedidos"
            options={{
              title: (responsive.isWeb && responsive.isSmallMobile) ? 'Próximos' :
                     (responsive.isSmallMobile && !responsive.isWeb) ? '2' :
                     responsive.isExtraSmall ? '' :
                     responsive.isLandscape && responsive.isSmallMobile ? '' : 'Próximos',
              tabBarIcon: ({ color, focused }) => (
                <FontAwesome
                  name="list"
                  size={focused ? responsive.iconSize : responsive.iconSizeInactive}
                  color={color}
                  style={{
                    marginBottom: responsive.isExtraSmall ? 0 :
                                 responsive.isSmallMobile ? 1 : 2
                  }}
                />
              ),
            }}
          />
        );

        tabs.push(
          <Tabs.Screen
            key="productos-trabajar"
            name="productos-trabajar"
            options={{
              title: (responsive.isWeb && responsive.isSmallMobile) ? 'Esta Semana' :
                     (responsive.isSmallMobile && !responsive.isWeb) ? '3' :
                     responsive.isExtraSmall ? '' :
                     responsive.isLandscape && responsive.isSmallMobile ? '' : 'Esta Semana',
              tabBarIcon: ({ color, focused }) => (
                <FontAwesome
                  name="calendar-check-o"
                  size={focused ? responsive.iconSize : responsive.iconSizeInactive}
                  color={color}
                  style={{
                    marginBottom: responsive.isExtraSmall ? 0 :
                                 responsive.isSmallMobile ? 1 : 2
                  }}
                />
              ),
            }}
          />
        );

        // Tabs condicionales - visibles según permisos
        tabs.push(
          <Tabs.Screen
            key="cotizaciones"
            name="cotizaciones"
            options={{
              title: (responsive.isWeb && responsive.isSmallMobile) ? 'Cotizaciones' :
                     (responsive.isSmallMobile && !responsive.isWeb) ? '4' :
                     responsive.isExtraSmall ? '' :
                     responsive.isLandscape && responsive.isSmallMobile ? '' : 'Cotizaciones',
              tabBarButton: userRole === 'admin' || userRole === 'dueño' ? undefined : () => null,
              tabBarIcon: ({ color, focused }) => (
                <FontAwesome
                  name="file-text"
                  size={focused ? responsive.iconSize : responsive.iconSizeInactive}
                  color={color}
                  style={{
                    marginBottom: responsive.isExtraSmall ? 0 :
                                 responsive.isSmallMobile ? 1 : 2
                  }}
                />
              ),
            }}
          />
        );

        tabs.push(
          <Tabs.Screen
            key="two"
            name="two"
            options={{
              title: (responsive.isWeb && responsive.isSmallMobile) ? 'Estadísticas' :
                     (responsive.isSmallMobile && !responsive.isWeb) ? '5' :
                     responsive.isExtraSmall ? '' :
                     responsive.isLandscape && responsive.isSmallMobile ? '' : 'Estadísticas',
              tabBarButton: userRole === 'admin' || userRole === 'dueño' ? undefined : () => null,
              tabBarIcon: ({ color, focused }) => (
                <FontAwesome
                  name="bar-chart"
                  size={focused ? responsive.iconSize : responsive.iconSizeInactive}
                  color={color}
                  style={{
                    marginBottom: responsive.isExtraSmall ? 0 :
                                 responsive.isSmallMobile ? 1 : 2
                  }}
                />
              ),
            }}
          />
        );

        return tabs;
      })()}

      {/* Tabs ocultos (accesibles por navegación programática) */}
      <Tabs.Screen
        name="nuevo-pedido"
        options={{
          tabBarButton: () => null, // Oculto de la barra
          title: 'Nuevo Pedido',
        }}
      />

      <Tabs.Screen
        name="rellenos-masas"
        options={{
          tabBarButton: () => null, // Oculto de la barra
          title: 'Rellenos y Masas',
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          tabBarButton: () => null, // Oculto de la barra
          title: 'Configuración',
        }}
      />
    </Tabs>
  );
}
