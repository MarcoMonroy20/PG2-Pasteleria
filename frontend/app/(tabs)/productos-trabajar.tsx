import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from 'expo-router';
import { initDB, obtenerPedidos, Pedido, Producto } from '../../services/db';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { useAuth } from '../../contexts/AuthContext';

interface ProductoTrabajar {
  id: string;
  fecha: string;
  pedidoNombre: string;
  producto: Producto;
  index: number;
}

export default function ProductosTrabajarScreen() {
  const navigation = useNavigation();
  const { width } = { width: 400 }; // Simulando width para responsive
  const colorScheme = useColorScheme();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estado para la semana seleccionada
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [showWeekSelector, setShowWeekSelector] = useState(false);

  // Ref para el ScrollView del selector de semana
  const weekScrollRef = useRef<ScrollView>(null);

  const isNarrow = width < 400;

  useEffect(() => {
    cargarPedidos();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      cargarPedidos();
    }, [])
  );

  const cargarPedidos = async () => {
    try {
      await initDB();
      const pedidosData = await obtenerPedidos();
      setPedidos(pedidosData);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarPedidos();
    setRefreshing(false);
  };

  // Función para obtener el inicio de la semana (lunes)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Resetear horas
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que el lunes sea el inicio
    d.setDate(diff);
    return d;
  };

  // Función para obtener el fin de la semana (domingo)
  const getWeekEnd = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999); // Fin del día
    const day = d.getDay();
    const diff = d.getDate() + (7 - day);
    d.setDate(diff);
    return d;
  };

  // Función para formatear fecha local (YYYY-MM-DD)
  const formatLocalDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Función para parsear fecha local (sin zona horaria)
  const parseLocalDate = (s: string): Date => {
    // Crear fecha en zona horaria local sin problemas de conversión
    const [year, month, day] = s.split('-').map(n => parseInt(n, 10));
    const date = new Date();
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0); // Resetear horas para comparación precisa
    return date;
  };

  // Filtrar productos por semana seleccionada
  const productosSemana = useMemo(() => {
    const weekStart = getWeekStart(selectedWeek);
    const weekEnd = getWeekEnd(selectedWeek);

    const productosFiltrados: ProductoTrabajar[] = [];

    pedidos.forEach((pedido) => {
      const fechaPedido = parseLocalDate(pedido.fecha_entrega);

      // Verificar si la fecha del pedido está dentro de la semana seleccionada
      if (fechaPedido >= weekStart && fechaPedido <= weekEnd) {
        pedido.productos.forEach((producto, index) => {
          productosFiltrados.push({
            id: `${pedido.id}-${index}`,
            fecha: pedido.fecha_entrega,
            pedidoNombre: pedido.nombre,
            producto,
            index: productosFiltrados.length + 1,
          });
        });
      }
    });

    // Ordenar por fecha
    productosFiltrados.sort((a, b) => a.fecha.localeCompare(b.fecha));

    return productosFiltrados;
  }, [pedidos, selectedWeek]);

  // Generar opciones de semanas disponibles
  const weekOptions = useMemo(() => {
    const options = [];
    const today = new Date();

    // Generar 24 semanas hacia atrás y 52 semanas hacia adelante (aprox. 1.5 años)
    for (let i = -24; i <= 52; i++) {
      const weekDate = new Date(today);
      weekDate.setDate(today.getDate() + (i * 7));

      const weekStart = getWeekStart(weekDate);
      const weekEnd = getWeekEnd(weekDate);

      const isCurrentWeek = i === 0;

      options.push({
        id: i,
        date: weekDate,
        label: isCurrentWeek
          ? 'Esta semana'
          : `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`,
        fullLabel: isCurrentWeek
          ? 'Esta semana'
          : `${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        isCurrent: isCurrentWeek,
      });
    }

    console.log(`Generadas ${options.length} opciones de semana`);
    const currentOption = options.find(opt => opt.isCurrent);
    if (currentOption) {
      console.log(`Semana actual encontrada: ${currentOption.fullLabel}`);
    }

    return options;
  }, []);

  // Seleccionar semana desde el combobox
  const selectWeek = (weekOption: typeof weekOptions[0]) => {
    setSelectedWeek(weekOption.date);
    setShowWeekSelector(false);
  };

  // Función para hacer scroll a la semana actual
  const scrollToCurrentWeek = useCallback(() => {
    if (!weekScrollRef.current || weekOptions.length === 0) return;

    // Encontrar el índice de la semana actual
    const currentWeekIndex = weekOptions.findIndex(option => option.isCurrent);

    if (currentWeekIndex !== -1) {
      // Enfoque basado en porcentaje: hacer scroll proporcional a la posición de la semana actual

      const totalOptions = weekOptions.length; // 77 opciones
      const currentPercentage = currentWeekIndex / totalOptions; // 24/77 ≈ 0.31 (31%)

      // Ajustar el porcentaje de scroll para que esté cerca de la semana actual
      // Si la semana actual está en el 31%, hacer scroll al ~28% para centrarla
      const scrollPercentage = Math.max(0.1, Math.min(0.9, currentPercentage - 0.03)); // Entre 10% y 90%

      const estimatedTotalHeight = totalOptions * 60; // Estimación conservadora
      const scrollPosition = Math.floor(estimatedTotalHeight * scrollPercentage);

      console.log(`Scroll automático: índice ${currentWeekIndex}/${totalOptions}, semana en ${(currentPercentage * 100).toFixed(1)}%, scroll al ${(scrollPercentage * 100).toFixed(1)}%, posición ${scrollPosition}`);

      // Scroll directo a posición calculada
      setTimeout(() => {
        weekScrollRef.current?.scrollTo({
          y: scrollPosition,
          animated: true,
        });
      }, 600); // Delay suficiente para renderizado
    } else {
      console.log('No se encontró la semana actual en las opciones');
    }
  }, [weekOptions]);

  // Hacer scroll automático cuando se abre el modal
  useEffect(() => {
    if (showWeekSelector) {
      // Pequeño delay adicional para asegurar que todo esté renderizado
      const timer = setTimeout(() => {
        scrollToCurrentWeek();
      }, 200);

      return () => clearTimeout(timer);
    }
    return () => {}; // Cleanup function para casos donde no se cumple la condición
  }, [showWeekSelector, scrollToCurrentWeek]);

  // Obtener rango de fechas de la semana
  const getWeekRange = () => {
    const start = getWeekStart(selectedWeek);
    const end = getWeekEnd(selectedWeek);
    return {
      start: start.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }),
      end: end.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
  };

  // Formatear producto para mostrar
  const formatProducto = (producto: Producto): string => {
    const partes = [];

    // Tipo del producto
    partes.push(producto.tipo.charAt(0).toUpperCase() + producto.tipo.slice(1));

    // Sabor (si no es "otros")
    if (producto.tipo !== 'otros' && producto.sabor) {
      partes.push(producto.sabor);
    }

    // Tamaño (si aplica)
    if (producto.tipo !== 'otros' && producto.tamaño) {
      partes.push(producto.tamaño);
    }

    // Relleno (si aplica)
    if (producto.tipo !== 'otros' && producto.relleno) {
      partes.push(producto.relleno);
    }

    // Cantidad (si es cupcakes o tiene cantidad específica)
    if ((producto.tipo === 'cupcakes' || (producto.cantidad && producto.cantidad > 1)) && producto.cantidad) {
      partes.push(`cantidad: ${producto.cantidad}`);
    }

    // Minicupcakes
    if (producto.esMinicupcake) {
      partes.push('minicupcakes');
    }

    // Descripción adicional
    if (producto.descripcion) {
      partes.push(producto.descripcion);
    }

    return partes.join(', ');
  };

  const formatearFecha = (fecha: string) => {
    const date = parseLocalDate(fecha);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderProducto = ({ item }: { item: ProductoTrabajar }) => (
    <View style={styles.productoCard}>
      <View style={styles.productoHeader}>
        <Text style={styles.productoNumero}>{item.index}.</Text>
        <View style={styles.productoInfo}>
          <Text style={styles.productoTexto}>{formatProducto(item.producto)}</Text>
          <Text style={styles.productoPedido}>Pedido: {item.pedidoNombre}</Text>
          <Text style={styles.productoFecha}>{formatearFecha(item.fecha)}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  const weekRange = getWeekRange();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Productos Esta Semana</Text>
      </View>

      {/* Selector de Semana */}
      <View style={styles.weekSelector}>
        <TouchableOpacity
          style={styles.weekSelectorButton}
          onPress={() => setShowWeekSelector(true)}
        >
          <Text style={styles.weekSelectorText}>
            📅 {weekRange.start} - {weekRange.end}
          </Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.todayButton}
          onPress={() => setSelectedWeek(new Date())}
        >
          <Text style={styles.todayButtonText}>Esta Semana</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Productos */}
      {productosSemana.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No hay productos para trabajar en esta semana
          </Text>
          <Text style={styles.emptySubtext}>
            Los productos aparecerán aquí cuando tengas pedidos programados para esta semana
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              {productosSemana.length} producto{productosSemana.length !== 1 ? 's' : ''} para trabajar
            </Text>
          </View>

          <FlatList
            data={productosSemana}
            renderItem={renderProducto}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </>
      )}

      {/* Modal del Selector de Semana */}
      <Modal
        visible={showWeekSelector}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWeekSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.weekSelectorModal}>
            <Text style={styles.modalTitle}>Seleccionar Semana</Text>

            <ScrollView
              ref={weekScrollRef}
              style={styles.weekOptionsList}
            >
              {weekOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.weekOption,
                    option.isCurrent && styles.currentWeekOption,
                  ]}
                  onPress={() => selectWeek(option)}
                >
                  <Text style={[
                    styles.weekOptionText,
                    option.isCurrent && styles.currentWeekOptionText,
                  ]}>
                    {option.fullLabel}
                  </Text>
                  {option.isCurrent && (
                    <Text style={styles.currentWeekBadge}>ACTUAL</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowWeekSelector(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: Colors.light.cardBackground,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 18,
    color: Colors.light.buttonPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.inputBorder,
  },
  weekSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.buttonSecondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
  },
  weekSelectorText: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
  },
  dropdownIcon: {
    color: Colors.light.buttonText,
    fontSize: 12,
    fontWeight: 'bold',
  },
  weekInfo: {
    alignItems: 'center',
    flex: 1,
  },
  weekRange: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    textAlign: 'center',
    marginBottom: 4,
  },
  todayButton: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  todayButtonText: {
    color: Colors.light.buttonText,
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.inputBorder,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: Colors.light.inputText,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.light.inputText,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.inputText,
    textAlign: 'center',
    opacity: 0.7,
  },
  listContainer: {
    padding: 16,
  },
  productoCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.light.buttonSecondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productoNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.buttonPrimary,
    marginRight: 12,
    minWidth: 30,
  },
  productoInfo: {
    flex: 1,
  },
  productoTexto: {
    fontSize: 16,
    color: Colors.light.titleColor,
    marginBottom: 4,
    lineHeight: 22,
  },
  productoPedido: {
    fontSize: 14,
    color: Colors.light.buttonSecondary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  productoFecha: {
    fontSize: 12,
    color: Colors.light.inputText,
    textTransform: 'capitalize',
  },
  weekSelectorModal: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    maxWidth: 400,
  },
  weekOptionsList: {
    maxHeight: 300,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  weekOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
  },
  currentWeekOption: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  weekOptionText: {
    fontSize: 16,
    color: Colors.light.titleColor,
    flex: 1,
  },
  currentWeekOptionText: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
  },
  currentWeekBadge: {
    backgroundColor: Colors.light.buttonText,
    color: Colors.light.buttonPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  closeButton: {
    backgroundColor: Colors.light.buttonSecondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
    marginTop: 10,
  },
  closeButtonText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(94, 51, 111, 0.7)', // Morado oscuro con opacidad
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 20,
    textAlign: 'center',
  },
});
