import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, useWindowDimensions } from 'react-native';

import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { useClientOnlyValue } from '../../components/useClientOnlyValue';

// Función para calcular tamaños responsive basados en el ancho de pantalla
const useResponsiveTabBar = () => {
  const { width, height } = useWindowDimensions();

  // Determinar si es móvil pequeño, tablet, etc.
  const isSmallMobile = width < 375;
  const isTablet = width >= 768;
  const isLandscape = width > height;

  // Calcular tamaños dinámicos
  const tabBarHeight = isSmallMobile ? 68 : isTablet ? 80 : 72;
  const iconSize = isSmallMobile ? 20 : isTablet ? 28 : 24;
  const iconSizeInactive = iconSize - 2;
  const fontSize = isSmallMobile ? 9 : isTablet ? 12 : 10;
  const paddingVertical = isSmallMobile ? 6 : isTablet ? 10 : 8;
  const paddingBottom = isSmallMobile ? 3 : isTablet ? 6 : 4;

  return {
    tabBarHeight,
    iconSize,
    iconSizeInactive,
    fontSize,
    paddingVertical,
    paddingBottom,
    isSmallMobile,
    isTablet,
    isLandscape,
  };
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const responsive = useResponsiveTabBar();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#999',
        safeAreaInsets: { left: 0, right: 0, bottom: 0, top: 0 },
        headerShown: useClientOnlyValue(false, true),

        // Estilos responsive del tab bar
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          height: responsive.tabBarHeight,
          paddingBottom: responsive.paddingBottom,
          paddingTop: responsive.paddingVertical,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          // Ajustes para landscape en móviles
          ...(responsive.isLandscape && {
            height: responsive.tabBarHeight * 0.8,
            paddingTop: responsive.paddingVertical * 0.6,
            paddingBottom: responsive.paddingBottom * 0.6,
          }),
        },

        // Distribución perfecta de tabs
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: 0, // Permite compresión en pantallas pequeñas
        },

        // Estilos del texto responsive
        tabBarLabelStyle: {
          fontSize: responsive.fontSize,
          fontWeight: '500',
          marginTop: 1,
          textAlign: 'center',
          // Ocultar texto en landscape para móviles pequeños si es necesario
          ...(responsive.isLandscape && responsive.isSmallMobile && {
            display: 'none',
          }),
        },

        // Espacio para el contenido (ajustado dinámicamente)
        sceneContainerStyle: { paddingBottom: responsive.tabBarHeight },
      }}
    >
      {/* Tabs visibles en la barra inferior */}
      <Tabs.Screen
        name="index"
        options={{
          title: responsive.isLandscape && responsive.isSmallMobile ? '' : 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              name="home"
              size={focused ? responsive.iconSize : responsive.iconSizeInactive}
              color={color}
              style={{ marginBottom: responsive.isSmallMobile ? 1 : 2 }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="calendario"
        options={{
          title: responsive.isLandscape && responsive.isSmallMobile ? '' : 'Calendario',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              name="calendar"
              size={focused ? responsive.iconSize : responsive.iconSizeInactive}
              color={color}
              style={{ marginBottom: responsive.isSmallMobile ? 1 : 2 }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="proximos-pedidos"
        options={{
          title: responsive.isLandscape && responsive.isSmallMobile ? '' : 'Próximos',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              name="list"
              size={focused ? responsive.iconSize : responsive.iconSizeInactive}
              color={color}
              style={{ marginBottom: responsive.isSmallMobile ? 1 : 2 }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="cotizaciones"
        options={{
          title: responsive.isLandscape && responsive.isSmallMobile ? '' : 'Cotizaciones',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              name="file-text"
              size={focused ? responsive.iconSize : responsive.iconSizeInactive}
              color={color}
              style={{ marginBottom: responsive.isSmallMobile ? 1 : 2 }}
            />
          ),
        }}
      />

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

      {/* Estadísticas (renombrado de 'two') */}
      <Tabs.Screen
        name="two"
        options={{
          title: responsive.isLandscape && responsive.isSmallMobile ? '' : 'Estadísticas',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              name="bar-chart"
              size={focused ? responsive.iconSize : responsive.iconSizeInactive}
              color={color}
              style={{ marginBottom: responsive.isSmallMobile ? 1 : 2 }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
