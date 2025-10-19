import React, { Suspense, lazy, ComponentType } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import AndroidLoader from './AndroidLoader';

// Componente de carga personalizado
const LoadingScreen = ({ message = 'Cargando...' }: { message?: string }) => (
  <View style={styles.loadingContainer}>
    <AndroidLoader
      size="large"
      variant="spinner"
      message={message}
    />
  </View>
);

// Función para crear componentes lazy con error boundary
export function createLazyScreen<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallbackMessage = 'Cargando pantalla...'
) {
  const LazyComponent = lazy(importFunc);

  return (props: any) => (
    <Suspense fallback={<LoadingScreen message={fallbackMessage} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Pantallas lazy-loaded específicas
export const LazyRellenosMasasScreen = createLazyScreen(
  () => import('../app/(tabs)/rellenos-masas'),
  'Cargando configuración de productos...'
);

export const LazyCotizacionesScreen = createLazyScreen(
  () => import('../app/(tabs)/cotizaciones'),
  'Cargando generador de cotizaciones...'
);

export const LazySettingsScreen = createLazyScreen(
  () => import('../app/(tabs)/settings'),
  'Cargando configuración...'
);

// Hook para precargar rutas críticas
export function useRoutePreloader() {
  const preloadCriticalRoutes = React.useCallback(() => {
    // Precargar rutas críticas en background
    setTimeout(() => {
      import('../app/(tabs)/index'); // Pantalla principal
      import('../app/(tabs)/nuevo-pedido'); // Nuevo pedido (muy usado)
      import('../app/(tabs)/proximos-pedidos'); // Lista de pedidos
      import('../app/(tabs)/calendario'); // Calendario
    }, 1000);
  }, []);

  const preloadSecondaryRoutes = React.useCallback(() => {
    // Precargar rutas secundarias con más delay
    setTimeout(() => {
      import('../app/(tabs)/rellenos-masas');
      import('../app/(tabs)/cotizaciones');
      import('../app/(tabs)/settings');
    }, 3000);
  }, []);

  React.useEffect(() => {
    preloadCriticalRoutes();
    preloadSecondaryRoutes();
  }, [preloadCriticalRoutes, preloadSecondaryRoutes]);
}

// Componente wrapper para lazy loading con prefetching
export function LazyScreenWrapper({
  children,
  preloadTrigger,
}: {
  children: React.ReactNode;
  preloadTrigger?: boolean;
}) {
  const [isPreloaded, setIsPreloaded] = React.useState(false);

  React.useEffect(() => {
    if (preloadTrigger && !isPreloaded) {
      // Aquí iría lógica adicional de preload si es necesario
      setIsPreloaded(true);
    }
  }, [preloadTrigger, isPreloaded]);

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});

export default {
  createLazyScreen,
  LazyRellenosMasasScreen,
  LazyCotizacionesScreen,
  LazySettingsScreen,
  useRoutePreloader,
  LazyScreenWrapper,
};
