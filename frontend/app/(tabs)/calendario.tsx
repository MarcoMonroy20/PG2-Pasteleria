import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect, useRouter } from 'expo-router';
import { initDB, obtenerPedidos, Pedido } from '../../services/db';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';

interface PedidoPorFecha {
  fecha: string;
  pedidos: Pedido[];
}

export default function CalendarioScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  // Optimizado a Android y estable en web: grid con FlatList numColumns=7
  const { width: screenWidth } = useWindowDimensions();
  const [pedidosPorFecha, setPedidosPorFecha] = useState<PedidoPorFecha[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayModal, setDayModal] = useState<{ date: string; pedidos: Pedido[] } | null>(null);
  const [gridHeight, setGridHeight] = useState(0);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    cargarPedidos();
  }, []);

  // Recargar datos cuando la pantalla se enfoque (al volver desde crear/editar)
  useFocusEffect(
    React.useCallback(() => {
      cargarPedidos();
    }, [])
  );

  const cargarPedidos = async () => {
    try {
      await initDB();
      const pedidosData = await obtenerPedidos();
      const pedidosAgrupados = agruparPedidosPorFecha(pedidosData);
      setPedidosPorFecha(pedidosAgrupados);
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

  const agruparPedidosPorFecha = (pedidos: Pedido[]): PedidoPorFecha[] => {
    const agrupados = pedidos.reduce((acc, pedido) => {
      const fecha = pedido.fecha_entrega;
      if (!acc[fecha]) {
        acc[fecha] = [];
      }
      acc[fecha].push(pedido);
      return acc;
    }, {} as Record<string, Pedido[]>);

    return Object.keys(agrupados)
      .sort()
      .map(fecha => ({
        fecha,
        pedidos: agrupados[fecha].sort((a, b) => a.nombre.localeCompare(b.nombre))
      }));
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    const hoy = new Date();
    const mañana = new Date();
    mañana.setDate(hoy.getDate() + 1);
    
    const esHoy = date.toDateString() === hoy.toDateString();
    const esMañana = date.toDateString() === mañana.toDateString();
    
    if (esHoy) {
      return 'HOY';
    } else if (esMañana) {
      return 'MAÑANA';
    } else {
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  };

  const formatearPrecio = (precio: number) => {
    return `Q${precio.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  // Helpers de fecha sin afectar por zona horaria
  const toLocalISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const parseLocalDate = (s: string) => {
    const [y, m, d] = s.split('-').map((n) => parseInt(n, 10));
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const monthMatrix = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const firstDay = new Date(y, m, 1);
    const startDow = firstDay.getDay(); // 0=Dom
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const matrix: Array<Array<{ date: string | null; pedidos?: Pedido[] }>> = [];
    let dayCounter = 1;
    for (let week = 0; week < 6; week++) {
      const row: Array<{ date: string | null; pedidos?: Pedido[] }> = [];
      for (let dow = 0; dow < 7; dow++) {
        if ((week === 0 && dow < startDow) || dayCounter > daysInMonth) {
          row.push({ date: null });
        } else {
          const iso = toLocalISODate(new Date(y, m, dayCounter));
          const pedidos = pedidosPorFecha.find(p => p.fecha === iso)?.pedidos || [];
          row.push({ date: iso, pedidos });
          dayCounter++;
        }
      }
      matrix.push(row);
      if (dayCounter > daysInMonth) break;
    }
    return matrix;
  }, [currentMonth, pedidosPorFecha]);

  const monthLabel = useMemo(() => currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }), [currentMonth]);

  // Generar opciones de meses disponibles (24 meses hacia atrás y 12 hacia adelante)
  const monthOptions = useMemo(() => {
    const options = [];
    const currentDate = new Date();

    for (let i = -24; i <= 12; i++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      const isCurrentMonth = monthDate.getMonth() === currentDate.getMonth() &&
                           monthDate.getFullYear() === currentDate.getFullYear();

      options.push({
        id: i,
        date: monthDate,
        label: monthName,
        isCurrent: isCurrentMonth,
      });
    }

    return options;
  }, []);

  // Función para seleccionar mes desde el picker
  const selectMonth = (monthOption: typeof monthOptions[0]) => {
    setCurrentMonth(monthOption.date);
    setShowMonthPicker(false);
  };

  const getFechaStyle = (fecha: string) => {
    const date = parseLocalDate(fecha);
    const hoy = new Date();
    const mañana = new Date();
    mañana.setDate(hoy.getDate() + 1);
    
    const esHoy = date.toDateString() === hoy.toDateString();
    const esMañana = date.toDateString() === mañana.toDateString();
    const esPasado = date < hoy;
    
    if (esPasado) {
      return styles.fechaPasada;
    } else if (esHoy) {
      return styles.fechaHoy;
    } else if (esMañana) {
      return styles.fechaMañana;
    } else {
      return styles.fechaNormal;
    }
  };

  // Vista por fecha (lista) eliminada al migrar a cuadrícula

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando calendario...</Text>
      </View>
    );
  }


  // Cálculo responsivo del tamaño de celda (7 columnas, padding y separación)
  const columns = 7;
  const cellSpacing = 8;
  const gridPadding = 16;
  const rows = monthMatrix.length;
  const gridPaddingTop = 8;    // styles.grid paddingTop
  const gridPaddingBottom = 16; // styles.grid paddingBottom
  const cellWidth = Math.floor((screenWidth - gridPadding * 2 - cellSpacing * (columns - 1)) / columns);
  const cellHeight = gridHeight > 0
    ? Math.floor((gridHeight - gridPaddingTop - gridPaddingBottom - cellSpacing * (rows - 1)) / rows)
    : cellWidth;
  const baseSize = Math.min(cellWidth, cellHeight);
  const dateFontSize = baseSize < 54 ? 12 : 14;
  const badgeFontSize = baseSize < 54 ? 10 : 12;
  const cellPadding = baseSize < 54 ? 6 : 8;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
        >
          <Text style={styles.navButtonText}>‹ Anterior</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.monthSelector}
          onPress={() => setShowMonthPicker(true)}
        >
          <Text style={styles.title}>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
        >
          <Text style={styles.navButtonText}>Siguiente ›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.weekHeader, { paddingHorizontal: gridPadding }]}>
        {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((d, idx) => (
          <Text key={d} style={[styles.weekDay, { width: cellWidth, marginRight: idx < columns - 1 ? cellSpacing : 0 }]}>{d}</Text>
        ))}
      </View>

      <View style={styles.gridWrapper} onLayout={(e) => setGridHeight(e.nativeEvent.layout.height)}>
        <FlatList
          data={monthMatrix.flat()}
          numColumns={columns}
          keyExtractor={(_, idx) => String(idx)}
          contentContainerStyle={[styles.grid, { paddingHorizontal: gridPadding }]}
          columnWrapperStyle={[styles.gridRow, { marginBottom: cellSpacing }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item, index }) => {
          const cell: { date: string | null; pedidos?: Pedido[] } = item as any;
          const count = cell?.pedidos?.length || 0;
          return (
            <TouchableOpacity
              style={[
                styles.cell,
                !cell?.date && styles.cellEmpty,
                cell?.date && count > 0 && (count < 3 ? styles.cellFew : styles.cellBusy),
                  { width: cellWidth, height: cellHeight, marginRight: ((index + 1) % columns === 0) ? 0 : cellSpacing, padding: cellPadding },
              ]}
              disabled={!cell?.date}
              onPress={() => cell?.date && setDayModal({ date: cell.date, pedidos: cell.pedidos || [] })}
            >
              {cell?.date && (
                <>
                  <Text style={[styles.cellDate, { fontSize: dateFontSize }]}>{parseLocalDate(cell.date).getDate()}</Text>
                  {count > 0 && (
                    <View style={styles.cellBadge}><Text style={[styles.cellBadgeText, { fontSize: badgeFontSize }]}>{count}</Text></View>
                  )}
                </>
              )}
            </TouchableOpacity>
          );
          }}
        />
      </View>

      {dayModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{parseLocalDate(dayModal.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
            {dayModal.pedidos.length === 0 ? (
              <Text style={styles.emptyText}>Sin pedidos</Text>
            ) : (
              <FlatList
                data={dayModal.pedidos}
                keyExtractor={(p) => String(p.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalPedido} onPress={() => { setDayModal(null); navigation.navigate('proximos-pedidos' as never); }}>
                    <Text style={styles.modalPedidoNombre}>{item.nombre}</Text>
                    <Text style={styles.modalPedidoMonto}>{formatearPrecio(item.precio_final)}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDayModal(null)}>
                <Text style={styles.cancelBtnText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                console.log('Enviando fecha al nuevo pedido:', dayModal.date);
                setDayModal(null);
                router.push({
                  pathname: '/(tabs)/nuevo-pedido',
                  params: { fechaSeleccionada: dayModal.date }
                });
              }}>
                <Text style={styles.confirmBtnText}>+ Nuevo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal del Selector de Mes */}
      {showMonthPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.monthPickerModal}>
            <Text style={styles.modalTitle}>Seleccionar Mes</Text>

            <ScrollView style={styles.monthOptionsList}>
              {monthOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.monthOption,
                    option.isCurrent && styles.currentMonthOption,
                  ]}
                  onPress={() => selectMonth(option)}
                >
                  <Text style={[
                    styles.monthOptionText,
                    option.isCurrent && styles.currentMonthOptionText,
                  ]}>
                    {option.label}
                  </Text>
                  {option.isCurrent && (
                    <Text style={styles.currentMonthBadge}>ACTUAL</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMonthPicker(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.inputBorder,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
  },
  nuevoPedidoBtn: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nuevoPedidoBtnText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  crearPedidoBtn: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  crearPedidoBtnText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  fechaContainer: {
    marginBottom: 24,
  },
  fechaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  fechaNormal: {
    backgroundColor: Colors.light.cardBackground,
  },
  fechaHoy: {
    backgroundColor: Colors.light.buttonPrimary,
  },
  fechaMañana: {
    backgroundColor: Colors.light.buttonSecondary,
  },
  fechaPasada: {
    backgroundColor: Colors.light.surface,
  },
  fechaTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  fechaCantidad: {
    fontSize: 14,
    fontWeight: '600',
  },
  pedidosContainer: {
    paddingLeft: 8,
  },
  pedidoCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginLeft: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.buttonPrimary,
    shadowColor: Colors.light.buttonSecondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pedidoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    flex: 1,
  },
  pedidoPrecio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.buttonPrimary,
  },
  pedidoDetalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pedidoAbonado: {
    fontSize: 12,
    color: Colors.light.inputText,
  },
  pedidoPendiente: {
    fontSize: 12,
    color: Colors.light.buttonPrimary,
    fontWeight: 'bold',
  },
  productosResumen: {
    marginTop: 4,
  },
  productosText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 4,
  },
  productoResumen: {
    fontSize: 11,
    color: Colors.light.inputText,
    marginBottom: 2,
  },
  masProductos: {
    fontSize: 11,
    color: Colors.light.buttonPrimary,
    fontStyle: 'italic',
  },
  // Grid styles
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  weekDay: {
    textAlign: 'center',
    color: Colors.light.titleColor,
    fontWeight: 'bold',
  },
  grid: { paddingHorizontal: 8, paddingTop: 8, paddingBottom: 16 },
  gridRow: { flexDirection: 'row' },
  gridWrapper: { flex: 1 },
  cell: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    padding: 6,
    position: 'relative',
    justifyContent: 'flex-start',
  },
  navMonth: { fontSize: 24, color: Colors.light.titleColor, paddingHorizontal: 12 },
  cellEmpty: { backgroundColor: 'transparent' },
  cellFew: { backgroundColor: Colors.light.buttonSecondary },
  cellBusy: { backgroundColor: Colors.light.buttonPrimary },
  cellDate: { color: Colors.light.titleColor, fontWeight: 'bold' },
  cellBadge: {
    position: 'absolute', right: 6, top: 6,
    backgroundColor: Colors.light.buttonPrimary,
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
  },
  cellBadgeText: { color: Colors.light.buttonText, fontSize: 12, fontWeight: 'bold' },
  // Modal
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(94, 51, 111, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: Colors.light.background, borderRadius: 12, width: '100%', maxWidth: 520 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.light.titleColor, textAlign: 'center', marginTop: 16, marginBottom: 8 },
  modalPedido: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  modalPedidoNombre: { color: Colors.light.titleColor, fontWeight: '600' },
  modalPedidoMonto: { color: Colors.light.buttonPrimary, fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: Colors.light.inputBorder },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, borderColor: Colors.light.inputBorder, alignItems: 'center' },
  cancelBtnText: { color: Colors.light.inputText, fontWeight: 'bold' },
  confirmBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: Colors.light.buttonPrimary, alignItems: 'center' },
  confirmBtnText: { color: Colors.light.buttonText, fontWeight: 'bold' },
  // Nuevos estilos para navegación mejorada
  navButton: {
    backgroundColor: Colors.light.buttonSecondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonText: {
    color: Colors.light.buttonText,
    fontSize: 14,
    fontWeight: 'bold',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  dropdownIcon: {
    color: Colors.light.titleColor,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Modal del selector de mes
  monthPickerModal: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    maxWidth: 400,
  },
  monthOptionsList: {
    maxHeight: 300,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  monthOption: {
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
  currentMonthOption: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  monthOptionText: {
    fontSize: 16,
    color: Colors.light.titleColor,
    flex: 1,
  },
  currentMonthOptionText: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
  },
  currentMonthBadge: {
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
}); 