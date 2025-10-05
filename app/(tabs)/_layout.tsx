import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Importar estilos CSS para web
if (Platform.OS === 'web') {
  require('../../styles/tabBar.css');
  const { applyWebTabBarFix, observeTabBarChanges } = require('../../utils/web-tabbar-fix.js');
}

import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { useAuth } from '../../contexts/AuthContext';
import { DataProvider } from '../../contexts/DataContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, hasPermission } = useAuth();
  const insets = useSafeAreaInsets();

  // Aplicar fixes para web después de que el componente se monte
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const timer = setTimeout(() => {
        try {
          const { applyWebTabBarFix, observeTabBarChanges } = require('../../utils/web-tabbar-fix.js');
          applyWebTabBarFix();
          observeTabBarChanges();
        } catch (error) {
          console.log('Web tab bar fix no disponible:', error);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <DataProvider>
      <Tabs
        screenOptions={{
          headerShown: false, // Ocultar header blanco en todas las pantallas
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarStyle: Platform.OS === 'android' ? {
            height: 60 + insets.bottom, // Altura base + safe area bottom
            paddingBottom: Math.max(8, insets.bottom), // Padding mínimo o safe area
            paddingTop: 8,
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            elevation: 8, // Sombra para Android
          } : {
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },
          tabBarLabelStyle: {
            fontSize: 9, // Reducido para mejor ajuste
            fontWeight: '500',
            textAlign: 'center',
            marginTop: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 4, // Ajustado para la nueva altura
            paddingHorizontal: 2,
            minWidth: 50,
            justifyContent: 'center',
            alignItems: 'center',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color }) => <FontAwesome size={20} name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="calendario"
          options={{
            title: 'Calendario',
            tabBarIcon: ({ color }) => <FontAwesome size={20} name="calendar" color={color} />,
          }}
        />
        <Tabs.Screen
          name="proximos-pedidos"
          options={{
            title: 'Pedidos',
            tabBarIcon: ({ color }) => <FontAwesome size={20} name="clock-o" color={color} />,
          }}
        />
        <Tabs.Screen
          name="productos-trabajar"
          options={{
            title: 'Productos',
            tabBarIcon: ({ color }) => <FontAwesome size={20} name="list" color={color} />,
          }}
        />
        <Tabs.Screen
          name="cotizaciones"
          options={{
            title: 'Cotiz.',
            tabBarIcon: ({ color }) => <FontAwesome size={20} name="dollar" color={color} />,
          }}
        />
        {hasPermission('view_estadisticas') && (
          <Tabs.Screen
            name="two"
            options={{
              title: 'Estad.',
              tabBarIcon: ({ color }) => <FontAwesome size={20} name="bar-chart" color={color} />,
            }}
          />
        )}
        <Tabs.Screen
          name="nuevo-pedido"
          options={{
            href: null, // Ocultar de la navbar
          }}
        />
        <Tabs.Screen
          name="rellenos-masas"
          options={{
            href: null, // Ocultar de la navbar
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null, // Ocultar de la navbar
          }}
        />
      </Tabs>
    </DataProvider>
  );
}