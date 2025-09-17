import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { useClientOnlyValue } from '../../components/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        safeAreaInsets: { left: 0, right: 0, bottom: 0, top: 0 },
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          paddingHorizontal: 0,
          paddingTop: 6,
          paddingBottom: 6,
          height: 64,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        // Repartir 4 tabs a lo ancho en web y móvil
        tabBarItemStyle: { flex: 1, flexBasis: 0 },
        tabBarLabelStyle: { marginBottom: 2 },
        sceneContainerStyle: { paddingBottom: 64 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      {/* Próximos visible en barra */}
      <Tabs.Screen
        name="proximos-pedidos"
        options={{
          title: 'Próximos',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />
      {/* Cotizaciones visible en barra */}
      <Tabs.Screen
        name="cotizaciones"
        options={{
          title: 'Cotizaciones',
          tabBarIcon: ({ color }) => <TabBarIcon name="file-text" color={color} />,
        }}
      />
      {/* Estadísticas visible en barra */}
      <Tabs.Screen
        name="two"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
        }}
      />
      {/* Nuevo Pedido oculto en barra */}
      <Tabs.Screen
        name="nuevo-pedido"
        options={{
          title: 'Nuevo Pedido',
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="rellenos-masas"
        options={{
          title: 'Rellenos y Masas',
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configuración',
          tabBarButton: () => null,
        }}
      />
      {/* Eliminar tab de ejemplo */}
    </Tabs>
  );
}
