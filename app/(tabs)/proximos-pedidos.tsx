import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
  RefreshControl,
  Platform,
  ScrollView,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { useNavigation, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated from 'react-native-reanimated';
import hybridDB from '../../services/hybrid-db';
import { Pedido, Producto, getNotificationIdForPedido, setNotificationIdForPedido, clearNotificationForPedido } from '../../services/db';
import { schedulePedidoNotification, cancelNotificationById } from '../../services/notifications';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { useAuth } from '../../contexts/AuthContext';
import OptimizedList from '../../components/OptimizedList';
import OptimizedCard from '../../components/OptimizedCard';
import OptimizedButton from '../../components/OptimizedButton';
import AndroidLoader from '../../components/AndroidLoader';
import { useStaggeredAnimation, PerformanceUtils } from '../../utils/animations';

export default function ProximosPedidosScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const { hasPermission } = useAuth();

  // Animations
  const { animateIn, getAnimatedStyle } = useStaggeredAnimation(10, 50);
  const isNarrow = width < 400;
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [allPedidos, setAllPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState<Pedido | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    precio_final: '',
    monto_abonado: '',
    descripcion: '',
    productos: [] as Producto[],
    fecha_entrega: '',
  });
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editFechaDate, setEditFechaDate] = useState<Date>(new Date());
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);
  const [nuevoProducto, setNuevoProducto] = useState<Partial<Producto>>({
    tipo: 'pastel',
    sabor: '',
    relleno: '',
    tamaño: '',
    cantidad: 1,
    esMinicupcake: false,
    descripcion: '',
  });
  const [sabores, setSabores] = useState<any[]>([]);
  const [rellenos, setRellenos] = useState<any[]>([]);

  // Abonos
  const [showAbonarModal, setShowAbonarModal] = useState(false);
  const [pedidoAbonando, setPedidoAbonando] = useState<Pedido | null>(null);
  const [abonoInput, setAbonoInput] = useState<string>('');

  // Filtros avanzados
  const [searchText, setSearchText] = useState('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);

  // Nuevos filtros avanzados
  const [paymentStatus, setPaymentStatus] = useState<'todos' | 'pendiente' | 'parcial' | 'completo'>('todos');
  const [productType, setProductType] = useState<'todos' | 'pastel' | 'cupcakes' | 'otros'>('todos');
  const [priceRange, setPriceRange] = useState<'todos' | 'bajo' | 'medio' | 'alto'>('todos');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    cargarPedidosPorRango();
    cargarSaboresYRellenos();
  }, []);

  // Recargar datos cuando la pantalla se enfoque
  useFocusEffect(
    React.useCallback(() => {
      cargarSaboresYRellenos();
    }, [])
  );

  const cargarSaboresYRellenos = async () => {
    try {
      const saboresData = await hybridDB.obtenerSabores();
      const rellenosData = await hybridDB.obtenerRellenos();
      setSabores(saboresData);
      setRellenos(rellenosData);
    } catch (error) {
      console.error('Error cargando sabores y rellenos:', error);
    }
  };

  const aplicarFiltroTexto = (lista: Pedido[], texto: string) => {
    const t = texto.trim().toLowerCase();
    if (!t) return lista;
    return lista.filter((p) => {
      const enNombre = p.nombre.toLowerCase().includes(t);
      const enDesc = (p.descripcion || '').toLowerCase().includes(t);
      const enProductos = (p.productos || []).some((prod) => (
        (prod.tipo || '').toLowerCase().includes(t) ||
        (prod.sabor || '').toLowerCase().includes(t) ||
        (prod.relleno || '').toLowerCase().includes(t) ||
        (prod.tamaño || '').toLowerCase().includes(t) ||
        String(prod.cantidad || '').toLowerCase().includes(t) ||
        (prod.descripcion || '').toLowerCase().includes(t)
      ));
      return enNombre || enDesc || enProductos;
    });
  };

  // Función para determinar el estado de pago
  const getPaymentStatus = (pedido: Pedido): 'pendiente' | 'parcial' | 'completo' => {
    const total = pedido.precio_final;
    const abonado = pedido.monto_abonado || 0;

    if (abonado === 0) return 'pendiente';
    if (abonado >= total) return 'completo';
    return 'parcial';
  };

  // Función para determinar el rango de precio
  const getPriceRange = (precio: number): 'bajo' | 'medio' | 'alto' => {
    if (precio < 100) return 'bajo';
    if (precio < 500) return 'medio';
    return 'alto';
  };

  // Función para verificar si el pedido tiene un tipo de producto específico
  const hasProductType = (pedido: Pedido, tipo: string): boolean => {
    return (pedido.productos || []).some(prod => prod.tipo === tipo);
  };

  // Aplicar todos los filtros avanzados
  const aplicarFiltrosAvanzados = (lista: Pedido[]): Pedido[] => {
    return lista.filter(pedido => {
      // Filtro por estado de pago
      if (paymentStatus !== 'todos') {
        const status = getPaymentStatus(pedido);
        if (status !== paymentStatus) return false;
      }

      // Filtro por tipo de producto
      if (productType !== 'todos') {
        if (!hasProductType(pedido, productType)) return false;
      }

      // Filtro por rango de precio
      if (priceRange !== 'todos') {
        const range = getPriceRange(pedido.precio_final);
        if (range !== priceRange) return false;
      }

      return true;
    });
  };

  const cargarPedidosPorRango = async () => {
    try {
      await hybridDB.initialize();
      let base: Pedido[];
      if (dateStart && dateEnd) {
        base = await hybridDB.obtenerPedidosPorFecha(dateStart, dateEnd);
      } else {
        base = await hybridDB.obtenerPedidos();
        if (dateStart) base = base.filter(p => p.fecha_entrega >= dateStart);
        if (dateEnd) base = base.filter(p => p.fecha_entrega <= dateEnd);
      }
      setAllPedidos(base);
      // Aplicar filtros en secuencia: texto -> avanzados
      const filtradosPorTexto = aplicarFiltroTexto(base, searchText);
      setPedidos(aplicarFiltrosAvanzados(filtradosPorTexto));
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);

      // Trigger animations when data is loaded
      setTimeout(() => {
        animateIn();
      }, 100);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarPedidosPorRango();
    setRefreshing(false);
  };

  // Reaplicar filtro de texto cuando cambia el texto o la base
  useEffect(() => {
    // Aplicar filtros en secuencia: texto -> avanzados
    const filtradosPorTexto = aplicarFiltroTexto(allPedidos, searchText);
    setPedidos(aplicarFiltrosAvanzados(filtradosPorTexto));
  }, [searchText, allPedidos, paymentStatus, productType, priceRange]);

  // Calcular si hay filtros avanzados activos
  const hasActiveAdvancedFilters = useMemo(() => {
    return paymentStatus !== 'todos' || productType !== 'todos' || priceRange !== 'todos';
  }, [paymentStatus, productType, priceRange]);

  // Totales de la lista filtrada actual
  const totals = useMemo(() => {
    const totalPrecio = pedidos.reduce((acc, p) => acc + (Number(p.precio_final) || 0), 0);
    const totalAbonado = pedidos.reduce((acc, p) => acc + (Number(p.monto_abonado) || 0), 0);
    const totalPendiente = totalPrecio - totalAbonado;
    return { totalPrecio, totalAbonado, totalPendiente };
  }, [pedidos]);



  const [showSummary, setShowSummary] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleResetFilters = () => {
    setSearchText('');
    setDateStart('');
    setDateEnd('');
    setStartDateObj(null);
    setEndDateObj(null);
    // Resetear filtros avanzados
    setPaymentStatus('todos');
    setProductType('todos');
    setPriceRange('todos');
    setShowAdvancedFilters(false);
    setLoading(true);
    cargarPedidosPorRango();
  };

  const handleEditarPedido = (pedido: Pedido) => {
    setPedidoEditando(pedido);
    setEditForm({
      nombre: pedido.nombre,
      precio_final: pedido.precio_final.toString(),
      monto_abonado: pedido.monto_abonado.toString(),
      descripcion: pedido.descripcion || '',
      productos: pedido.productos || [],
      fecha_entrega: pedido.fecha_entrega,
    });
    setEditFechaDate(new Date(pedido.fecha_entrega));
    setShowEditModal(true);
  };

  const procesarAbono = async (pedido: Pedido, montoAbono: number) => {
    const restante = pedido.precio_final - pedido.monto_abonado;
    if (montoAbono <= 0) {
      Platform.OS === 'web' ? alert('El abono debe ser mayor a 0') : Alert.alert('Error', 'El abono debe ser mayor a 0');
      return;
    }
    if (montoAbono > restante) {
      Platform.OS === 'web' ? alert(`El abono no puede exceder el restante (${restante})`) : Alert.alert('Error', `El abono no puede exceder el restante (${restante})`);
      return;
    }

    try {
      const actualizado: Omit<Pedido, 'id'> = {
        fecha_entrega: pedido.fecha_entrega,
        nombre: pedido.nombre,
        precio_final: pedido.precio_final,
        monto_abonado: pedido.monto_abonado + montoAbono,
        descripcion: pedido.descripcion,
        imagen: pedido.imagen,
        productos: pedido.productos,
      };
      await hybridDB.actualizarPedido(pedido.id!, actualizado);
      await cargarPedidosPorRango();
      Platform.OS === 'web' ? alert('Abono registrado') : Alert.alert('Éxito', 'Abono registrado');
    } catch (e) {
      console.error(e);
      Platform.OS === 'web' ? alert('No se pudo registrar el abono') : Alert.alert('Error', 'No se pudo registrar el abono');
    }
  };

  const handleAbonar = (pedido: Pedido) => {
    if (Platform.OS === 'web') {
      const restante = pedido.precio_final - pedido.monto_abonado;
      const valor = window.prompt(`Ingrese monto a abonar (restante: ${restante})`, '0');
      if (valor == null) return;
      const monto = parseFloat(valor.replace(',', '.'));
      if (isNaN(monto)) {
        alert('Monto inválido');
        return;
      }
      procesarAbono(pedido, monto);
    } else {
      setPedidoAbonando(pedido);
      setAbonoInput('');
      setShowAbonarModal(true);
    }
  };

  const handleGuardarEdicion = async () => {
    if (!pedidoEditando) return;

    try {
      const pedidoActualizado = {
        ...pedidoEditando,
        nombre: editForm.nombre,
        precio_final: parseFloat(editForm.precio_final),
        monto_abonado: parseFloat(editForm.monto_abonado),
        descripcion: editForm.descripcion || undefined,
        productos: editForm.productos,
        fecha_entrega: editForm.fecha_entrega,
      };

      await hybridDB.actualizarPedido(pedidoEditando.id!, pedidoActualizado);
      // Reprogramar notificación si corresponde
      try {
        const settings = await hybridDB.obtenerSettings();
        const existingNotif = await getNotificationIdForPedido(pedidoEditando.id!);
        if (existingNotif) {
          await cancelNotificationById(existingNotif);
          await clearNotificationForPedido(pedidoEditando.id!);
        }
        if (settings.notifications_enabled) {
          const trigger = new Date(pedidoActualizado.fecha_entrega);
          trigger.setDate(trigger.getDate() - (settings.days_before || 0));
          trigger.setHours(9, 0, 0, 0);
          const notifId = await schedulePedidoNotification(
            pedidoEditando.id!,
            'Recordatorio de pedido',
            `${pedidoActualizado.nombre} para ${pedidoActualizado.fecha_entrega}`,
            trigger
          );
          if (notifId) {
            await setNotificationIdForPedido(pedidoEditando.id!, notifId);
          }
        }
      } catch (e) {
        console.log('No se pudo reprogramar notificación:', e);
      }
      await cargarPedidosPorRango();
      setShowEditModal(false);
      setPedidoEditando(null);
      Alert.alert('Éxito', 'Pedido actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el pedido');
      console.error(error);
    }
  };

  const handleEliminarPedido = (pedido: Pedido) => {
    // Usar confirm nativo del navegador para web
    if (Platform.OS === 'web') {
      const confirmado = window.confirm(`¿Estás seguro de que quieres eliminar el pedido "${pedido.nombre}"?`);
      if (confirmado) {
        eliminarPedidoConfirmado(pedido);
      }
    } else {
      // Usar Alert para móvil
      Alert.alert(
        'Confirmar eliminación',
        `¿Estás seguro de que quieres eliminar el pedido "${pedido.nombre}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => eliminarPedidoConfirmado(pedido),
          },
        ]
      );
    }
  };

  const eliminarPedidoConfirmado = async (pedido: Pedido) => {
    try {
      try {
        const existingNotif = await getNotificationIdForPedido(pedido.id!);
        if (existingNotif) {
          await cancelNotificationById(existingNotif);
          await clearNotificationForPedido(pedido.id!);
        }
      } catch (e) {
        console.log('No se pudo cancelar notificación:', e);
      }
      await hybridDB.eliminarPedido(pedido.id!);
      await cargarPedidosPorRango();
      
      // Mostrar mensaje de éxito
      if (Platform.OS === 'web') {
        alert('Pedido eliminado correctamente');
      } else {
        Alert.alert('Éxito', 'Pedido eliminado correctamente');
      }
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      if (Platform.OS === 'web') {
        alert(`Error: No se pudo eliminar el pedido: ${error}`);
      } else {
        Alert.alert('Error', `No se pudo eliminar el pedido: ${error}`);
      }
    }
  };

  const handleAgregarProducto = () => {
    setNuevoProducto({
      tipo: 'pastel',
      sabor: '',
      relleno: '',
      tamaño: '',
      cantidad: 1,
      esMinicupcake: false,
      descripcion: '',
    });
    setShowAddProductModal(true);
  };

  const handleGuardarNuevoProducto = () => {
    const requiereSabor = nuevoProducto.tipo !== 'otros';
    if (!nuevoProducto.tipo || (requiereSabor && !nuevoProducto.sabor)) {
      if (Platform.OS === 'web') {
        alert('Por favor completa el tipo y sabor del producto');
      } else {
        Alert.alert('Error', 'Por favor completa el tipo y sabor del producto');
      }
      return;
    }

    const productoCompleto: Producto = {
      tipo: nuevoProducto.tipo as 'pastel' | 'cupcakes' | 'otros',
      sabor: nuevoProducto.sabor || '',
      relleno: nuevoProducto.relleno || '',
      tamaño: nuevoProducto.tamaño || '',
      cantidad: nuevoProducto.cantidad || 1,
      esMinicupcake: nuevoProducto.esMinicupcake || false,
      descripcion: nuevoProducto.descripcion || '',
    };

    setEditForm({
      ...editForm,
      productos: [...editForm.productos, productoCompleto]
    });

    setShowAddProductModal(false);
  };

  const handleEditarProducto = (index: number) => {
    const producto = editForm.productos[index];
    setNuevoProducto({
      tipo: producto.tipo,
      sabor: producto.sabor,
      relleno: producto.relleno,
      tamaño: producto.tamaño,
      cantidad: producto.cantidad,
      esMinicupcake: producto.esMinicupcake,
      descripcion: producto.descripcion,
    });
    setEditingProductIndex(index);
    setShowEditProductModal(true);
  };

  const handleGuardarEdicionProducto = () => {
    const requiereSabor = nuevoProducto.tipo !== 'otros';
    if (!nuevoProducto.tipo || (requiereSabor && !nuevoProducto.sabor)) {
      if (Platform.OS === 'web') {
        alert('Por favor completa el tipo y sabor del producto');
      } else {
        Alert.alert('Error', 'Por favor completa el tipo y sabor del producto');
      }
      return;
    }

    const productoCompleto: Producto = {
      tipo: nuevoProducto.tipo as 'pastel' | 'cupcakes' | 'otros',
      sabor: nuevoProducto.sabor || '',
      relleno: nuevoProducto.relleno || '',
      tamaño: nuevoProducto.tamaño || '',
      cantidad: nuevoProducto.cantidad || 1,
      esMinicupcake: nuevoProducto.esMinicupcake || false,
      descripcion: nuevoProducto.descripcion || '',
    };

    const nuevosProductos = [...editForm.productos];
    if (editingProductIndex !== null) {
      nuevosProductos[editingProductIndex] = productoCompleto;
    }

    setEditForm({
      ...editForm,
      productos: nuevosProductos
    });

    setShowEditProductModal(false);
    setEditingProductIndex(null);
  };

  // Parse local date (YYYY-MM-DD) para evitar desfases por TZ
  const parseLocalDate = (s: string) => {
    const [y, m, d] = s.split('-').map((n) => parseInt(n, 10));
    return new Date(y, (m || 1) - 1, d || 1);
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

  const formatearPrecio = (precio: number) => {
    return `Q${precio.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  const renderPedido = ({ item }: { item: Pedido }) => (
    <View style={styles.pedidoCard}>
      <View style={styles.pedidoHeader}>
        <View style={styles.pedidoInfo}>
          <Text style={styles.pedidoNombre}>{item.nombre}</Text>
          <Text style={styles.pedidoFecha}>{formatearFecha(item.fecha_entrega)}</Text>
        </View>
        <View style={styles.pedidoAcciones}>
          {hasPermission('edit_pedido') && (
            <TouchableOpacity
              style={styles.editarBtn}
              onPress={() => handleEditarPedido(item)}
            >
              <Text style={styles.editarBtnText}>✏️</Text>
            </TouchableOpacity>
          )}
          {hasPermission('delete_pedido') && (
            <TouchableOpacity
              style={styles.eliminarBtn}
              onPress={() => handleEliminarPedido(item)}
            >
              <Text style={styles.eliminarBtnText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.pedidoDetalles}>
        <View style={styles.precioInfo}>
          <Text style={styles.precioLabel}>Precio Final:</Text>
          <Text style={styles.precioValor}>{formatearPrecio(item.precio_final)}</Text>
        </View>
        <View style={styles.precioInfo}>
          <Text style={styles.precioLabel}>Abonado:</Text>
          <Text style={styles.precioValor}>{formatearPrecio(item.monto_abonado)}</Text>
        </View>
        <View style={styles.precioInfo}>
          <Text style={styles.precioLabel}>Debe:</Text>
          <Text style={[styles.precioValor, styles.pendiente]}>
            {formatearPrecio(item.precio_final - item.monto_abonado)}
          </Text>
        </View>
      </View>

      {item.descripcion && (
        <Text style={styles.descripcion}>{item.descripcion}</Text>
      )}

      <View style={styles.productosContainer}>
        <Text style={styles.productosTitulo}>Productos:</Text>
        {item.productos.map((producto, index) => (
          <View key={index} style={styles.productoItem}>
            <Text style={styles.productoTipo}>{producto.tipo.charAt(0).toUpperCase() + producto.tipo.slice(1)}</Text>
            {producto.sabor && <Text style={styles.productoDetalle}>Sabor: {producto.sabor}</Text>}
            {producto.relleno && <Text style={styles.productoDetalle}>Relleno: {producto.relleno}</Text>}
            {producto.tamaño && <Text style={styles.productoDetalle}>Tamaño: {producto.tamaño}</Text>}
            {producto.cantidad && <Text style={styles.productoDetalle}>Cantidad: {producto.cantidad}</Text>}
            {producto.esMinicupcake && <Text style={styles.productoDetalle}>Minicupcakes</Text>}
            {producto.descripcion && <Text style={styles.productoDetalle}>{producto.descripcion}</Text>}
          </View>
        ))}
      </View>

      {item.imagen && (
        <Image source={{ uri: item.imagen }} style={styles.imagenPedido} />
      )}

      {hasPermission('edit_pedido') && (
        <View style={styles.abonarContainer}>
          <TouchableOpacity style={styles.abonarBtn} onPress={() => handleAbonar(item)}>
            <Text style={styles.abonarBtnText}>Abonar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AndroidLoader
          size="large"
          message="Cargando pedidos..."
          variant="spinner"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
      <Text style={styles.title}>Próximos Pedidos</Text>
      </View>

      {/* Filtros retráctiles */}
      <View style={styles.filtersToggleContainer}>
        <TouchableOpacity style={styles.filtersToggleBtn} onPress={() => setShowFilters(!showFilters)}>
          <Text style={styles.filtersToggleText}>{showFilters ? 'Ocultar filtros ▲' : 'Mostrar filtros ▼'}</Text>
        </TouchableOpacity>
      </View>
      {showFilters && (
        <View style={styles.filtersContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar por nombre o producto"
            placeholderTextColor={Colors.light.inputText}
          />

          {Platform.OS === 'web' ? (
            <View style={[styles.dateRow, isNarrow && styles.dateRowNarrow]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Desde</Text>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDateStart(v);
                    setLoading(true);
                    cargarPedidosPorRango();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${Colors.light.inputBorder}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: Colors.light.background,
                    color: Colors.light.inputText,
                    fontFamily: 'System',
                    marginRight: isNarrow ? 0 : 12,
                  }}
                />
              </View>
              <View style={isNarrow ? { height: 12 } : { width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Hasta</Text>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDateEnd(v);
                    setLoading(true);
                    cargarPedidosPorRango();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${Colors.light.inputBorder}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: Colors.light.background,
                    color: Colors.light.inputText,
                    fontFamily: 'System',
                    marginLeft: isNarrow ? 0 : 12,
                  }}
                />
              </View>
            </View>
          ) : (
            <View style={[styles.dateRow, isNarrow && styles.dateRowNarrow]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Desde</Text>
                <TouchableOpacity
                  style={[styles.dateButton, !isNarrow && { marginRight: 6 }]}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {startDateObj ? startDateObj.toLocaleDateString('es-ES') : 'Seleccione fecha'}
                  </Text>
                  <Text style={styles.dateButtonIcon}>📅</Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <View style={styles.datePickerContainer}>
                    <DateTimePicker
                      value={startDateObj || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : Platform.OS === 'android' ? 'calendar' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowStartPicker(false);
                        const d = selectedDate || null;
                        setStartDateObj(d);
                        setDateStart(d ? d.toISOString().split('T')[0] : '');
                        setLoading(true);
                        cargarPedidosPorRango();
                      }}
                    />
                  </View>
                )}
              </View>
              <View style={isNarrow ? { height: 12 } : { width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Hasta</Text>
                <TouchableOpacity
                  style={[styles.dateButton, !isNarrow && { marginLeft: 6 }]}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {endDateObj ? endDateObj.toLocaleDateString('es-ES') : 'Seleccione fecha'}
                  </Text>
                  <Text style={styles.dateButtonIcon}>📅</Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <View style={styles.datePickerContainer}>
                    <DateTimePicker
                      value={endDateObj || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : Platform.OS === 'android' ? 'calendar' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowEndPicker(false);
                        const d = selectedDate || null;
                        setEndDateObj(d);
                        setDateEnd(d ? d.toISOString().split('T')[0] : '');
                        setLoading(true);
                        cargarPedidosPorRango();
                      }}
                    />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Contenedor de filtros avanzados y reset */}
          <View>
            {/* Filtros Avanzados */}
            <View style={styles.advancedFiltersToggle}>
              <TouchableOpacity
                style={[styles.advancedFiltersBtn, hasActiveAdvancedFilters && styles.advancedFiltersBtnActive]}
                onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Text style={[styles.advancedFiltersText, hasActiveAdvancedFilters && styles.advancedFiltersTextActive]}>
                  {showAdvancedFilters ? 'Ocultar filtros avanzados ▲' : 'Mostrar filtros avanzados ▼'}
                  {hasActiveAdvancedFilters && !showAdvancedFilters && ' (activos)'}
                </Text>
              </TouchableOpacity>
            </View>

            {showAdvancedFilters && (
              <View style={[styles.advancedFiltersContainer, isNarrow && styles.advancedFiltersContainerNarrow]}>
                  {/* Estado de Pago */}
                  <View style={[styles.filterGroup, isNarrow && styles.filterGroupNarrow]}>
                    <Text style={[styles.filterGroupTitle, isNarrow && styles.filterGroupTitleNarrow]}>Estado de Pago</Text>
                    <View style={[styles.filterOptions, isNarrow && styles.filterOptionsNarrow]}>
                      {[
                        { key: 'todos', label: 'Todos' },
                        { key: 'pendiente', label: 'Pendiente' },
                        { key: 'parcial', label: 'Parcial' },
                        { key: 'completo', label: 'Completo' },
                      ].map(option => (
                        <TouchableOpacity
                          key={option.key}
                          style={[
                            styles.filterOption,
                            isNarrow && styles.filterOptionNarrow,
                            paymentStatus === option.key && styles.filterOptionSelected
                          ]}
                          onPress={() => setPaymentStatus(option.key as any)}
                        >
                          <Text style={[
                            styles.filterOptionText,
                            isNarrow && styles.filterOptionTextNarrow,
                            paymentStatus === option.key && styles.filterOptionTextSelected
                          ]} numberOfLines={1}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Tipo de Producto */}
                  <View style={[styles.filterGroup, isNarrow && styles.filterGroupNarrow]}>
                    <Text style={[styles.filterGroupTitle, isNarrow && styles.filterGroupTitleNarrow]}>Tipo de Producto</Text>
                    <View style={[styles.filterOptions, isNarrow && styles.filterOptionsNarrow]}>
                      {[
                        { key: 'todos', label: 'Todos' },
                        { key: 'pastel', label: 'Pasteles' },
                        { key: 'cupcakes', label: 'Cupcakes' },
                        { key: 'otros', label: 'Otros' },
                      ].map(option => (
                        <TouchableOpacity
                          key={option.key}
                          style={[
                            styles.filterOption,
                            isNarrow && styles.filterOptionNarrow,
                            productType === option.key && styles.filterOptionSelected
                          ]}
                          onPress={() => setProductType(option.key as any)}
                        >
                          <Text style={[
                            styles.filterOptionText,
                            isNarrow && styles.filterOptionTextNarrow,
                            productType === option.key && styles.filterOptionTextSelected
                          ]} numberOfLines={1}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Rango de Precio */}
                  <View style={[styles.filterGroup, isNarrow && styles.filterGroupNarrow]}>
                    <Text style={[styles.filterGroupTitle, isNarrow && styles.filterGroupTitleNarrow]}>Rango de Precio</Text>
                    <View style={[styles.filterOptions, isNarrow && styles.filterOptionsNarrow]}>
                      {[
                        { key: 'todos', label: 'Todos' },
                        { key: 'bajo', label: '< Q100' },
                        { key: 'medio', label: 'Q100-Q500' },
                        { key: 'alto', label: '> Q500' },
                      ].map(option => (
                        <TouchableOpacity
                          key={option.key}
                          style={[
                            styles.filterOption,
                            isNarrow && styles.filterOptionNarrow,
                            priceRange === option.key && styles.filterOptionSelected
                          ]}
                          onPress={() => setPriceRange(option.key as any)}
                        >
                          <Text style={[
                            styles.filterOptionText,
                            isNarrow && styles.filterOptionTextNarrow,
                            priceRange === option.key && styles.filterOptionTextSelected
                          ]} numberOfLines={1}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

            <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
              <Text style={styles.resetBtnText}>Limpiar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Barra de totales retráctil */}
      <View style={styles.summaryToggleContainer}>
        <TouchableOpacity style={styles.summaryToggleBtn} onPress={() => setShowSummary(!showSummary)}>
          <Text style={styles.summaryToggleText}>{showSummary ? 'Ocultar resumen ▲' : 'Mostrar resumen ▼'}</Text>
        </TouchableOpacity>
      </View>
      {showSummary && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pedidos</Text>
              <Text style={styles.summaryValue}>{pedidos.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>{formatearPrecio(totals.totalPrecio)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Abonado</Text>
              <Text style={styles.summaryValue}>{formatearPrecio(totals.totalAbonado)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, styles.pendienteLabel]}>Debe</Text>
              <Text style={[styles.summaryValue, styles.pendiente]}>{formatearPrecio(totals.totalPendiente)}</Text>
            </View>
          </View>
        </View>
      )}

      {pedidos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay pedidos registrados</Text>
          <TouchableOpacity
            style={styles.nuevoPedidoBtn}
            onPress={() => navigation.navigate('nuevo-pedido' as never)}
          >
            <Text style={styles.nuevoPedidoBtnText}>Crear Primer Pedido</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderPedido}
          keyExtractor={(item) => item.id!.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Modal de edición */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
            <Text style={styles.modalTitle}>Editar Pedido</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha de Entrega</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={editForm.fecha_entrega}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setEditFechaDate(new Date(e.target.value));
                    setEditForm({...editForm, fecha_entrega: e.target.value});
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${Colors.light.inputBorder}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: Colors.light.background,
                    color: Colors.light.inputText,
                    fontFamily: 'System',
                  }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEditDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>{editFechaDate.toLocaleDateString('es-ES')}</Text>
                    <Text style={styles.dateButtonIcon}>📅</Text>
                  </TouchableOpacity>
                  {showEditDatePicker && (
                    <DateTimePicker
                      value={editFechaDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : Platform.OS === 'android' ? 'calendar' : 'default'}
                      minimumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowEditDatePicker(false);
                        if (selectedDate) {
                          setEditFechaDate(selectedDate);
                          setEditForm({...editForm, fecha_entrega: selectedDate.toISOString().split('T')[0]});
                        }
                      }}
                    />
                  )}
                </>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Pedido</Text>
              <TextInput
                style={styles.input}
                value={editForm.nombre}
                onChangeText={(text) => setEditForm({...editForm, nombre: text})}
                placeholder="Nombre del pedido"
                placeholderTextColor={Colors.light.inputText}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Precio Final</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.precio_final}
                  onChangeText={(text) => setEditForm({...editForm, precio_final: text})}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.light.inputText}
                />
              </View>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Monto Abonado</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.monto_abonado}
                  onChangeText={(text) => setEditForm({...editForm, monto_abonado: text})}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.light.inputText}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.descripcion}
                onChangeText={(text) => setEditForm({...editForm, descripcion: text})}
                placeholder="Descripción del pedido"
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.light.inputText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Productos</Text>
              <FlatList
                data={editForm.productos}
                renderItem={({ item, index }) => (
                  <View style={styles.productoEditItem}>
                    <View style={styles.productoEditInfo}>
                      <Text style={styles.productoEditTipo}>{item.tipo}</Text>
                      {item.sabor && <Text style={styles.productoEditDetalle}>Sabor: {item.sabor}</Text>}
                      {item.relleno && <Text style={styles.productoEditDetalle}>Relleno: {item.relleno}</Text>}
                      {item.tamaño && <Text style={styles.productoEditDetalle}>Tamaño: {item.tamaño}</Text>}
                      {item.cantidad && <Text style={styles.productoEditDetalle}>Cantidad: {item.cantidad}</Text>}
                      {item.esMinicupcake && <Text style={styles.productoEditDetalle}>Minicupcakes</Text>}
                      {item.descripcion && <Text style={styles.productoEditDetalle}>{item.descripcion}</Text>}
                    </View>
                    <View style={styles.productoEditActions}>
                      <TouchableOpacity
                        style={styles.editarProductoBtn}
                        onPress={() => handleEditarProducto(index)}
                      >
                        <Text style={styles.editarProductoBtnText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.eliminarProductoBtn}
                        onPress={() => {
                          const nuevosProductos = editForm.productos.filter((_, i) => i !== index);
                          setEditForm({...editForm, productos: nuevosProductos});
                        }}
                      >
                        <Text style={styles.eliminarProductoBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                keyExtractor={(_, index) => index.toString()}
                style={styles.productosEditList}
              />
              <TouchableOpacity
                style={styles.agregarProductoBtn}
                onPress={handleAgregarProducto}
              >
                <Text style={styles.agregarProductoBtnText}>+ Agregar Producto</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleGuardarEdicion}
              >
                <Text style={styles.confirmBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para agregar producto */}
      <Modal visible={showAddProductModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
            <Text style={styles.modalTitle}>Agregar Producto</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Producto *</Text>
              <View style={styles.comboContainer}>
                {['pastel', 'cupcakes', 'otros'].map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.comboOption,
                      nuevoProducto.tipo === tipo && styles.comboOptionSelected
                    ]}
                    onPress={() => setNuevoProducto({
                      ...nuevoProducto,
                      tipo: tipo as any,
                      // limpiar campos no aplicables cuando es 'otros'
                      sabor: tipo === 'otros' ? '' : nuevoProducto.sabor,
                      relleno: tipo === 'otros' ? '' : nuevoProducto.relleno,
                    })}
                  >
                    <Text style={[
                      styles.comboOptionText,
                      nuevoProducto.tipo === tipo && styles.comboOptionTextSelected
                    ]}>
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {nuevoProducto.tipo !== 'otros' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sabor *</Text>
                <View style={styles.comboContainer}>
                  {sabores.filter(s => s.tipo === nuevoProducto.tipo).map((sabor) => (
                    <TouchableOpacity
                      key={sabor.id}
                      style={[
                        styles.comboOption,
                        nuevoProducto.sabor === sabor.nombre && styles.comboOptionSelected
                      ]}
                      onPress={() => setNuevoProducto({...nuevoProducto, sabor: sabor.nombre})}
                    >
                      <Text style={[
                        styles.comboOptionText,
                        nuevoProducto.sabor === sabor.nombre && styles.comboOptionTextSelected
                      ]}>
                        {sabor.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {nuevoProducto.tipo !== 'otros' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Relleno</Text>
                <View style={styles.comboContainer}>
                  {rellenos.map((relleno) => (
                    <TouchableOpacity
                      key={relleno.id}
                      style={[
                        styles.comboOption,
                        nuevoProducto.relleno === relleno.nombre && styles.comboOptionSelected
                      ]}
                      onPress={() => setNuevoProducto({...nuevoProducto, relleno: relleno.nombre})}
                    >
                      <Text style={[
                        styles.comboOptionText,
                        nuevoProducto.relleno === relleno.nombre && styles.comboOptionTextSelected
                      ]}>
                        {relleno.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {nuevoProducto.tipo !== 'otros' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tamaño</Text>
                <TextInput
                  style={styles.input}
                  value={nuevoProducto.tamaño || ''}
                  onChangeText={(text) => setNuevoProducto({...nuevoProducto, tamaño: text})}
                  placeholder="Ej: Pequeño, Mediano, Grande"
                  placeholderTextColor={Colors.light.inputText}
                />
              </View>
            )}

            {nuevoProducto.tipo !== 'otros' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  style={styles.input}
                  value={nuevoProducto.cantidad?.toString() || ''}
                  onChangeText={(text) => setNuevoProducto({...nuevoProducto, cantidad: parseInt(text) || 1})}
                  placeholder="1"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.light.inputText}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={nuevoProducto.descripcion || ''}
                onChangeText={(text) => setNuevoProducto({...nuevoProducto, descripcion: text})}
                placeholder="Descripción del producto"
                multiline
                numberOfLines={2}
                placeholderTextColor={Colors.light.inputText}
              />
            </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddProductModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleGuardarNuevoProducto}
              >
                <Text style={styles.confirmBtnText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar producto */}
      <Modal visible={showEditProductModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
            <Text style={styles.modalTitle}>Editar Producto</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Producto *</Text>
              <View style={styles.comboContainer}>
                {['pastel', 'cupcakes', 'otros'].map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.comboOption,
                      nuevoProducto.tipo === tipo && styles.comboOptionSelected
                    ]}
                    onPress={() => setNuevoProducto({
                      ...nuevoProducto,
                      tipo: tipo as any,
                      sabor: tipo === 'otros' ? '' : nuevoProducto.sabor,
                      relleno: tipo === 'otros' ? '' : nuevoProducto.relleno,
                    })}
                  >
                    <Text style={[
                      styles.comboOptionText,
                      nuevoProducto.tipo === tipo && styles.comboOptionTextSelected
                    ]}>
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {nuevoProducto.tipo !== 'otros' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sabor *</Text>
              <View style={styles.comboContainer}>
                {sabores.filter(s => s.tipo === nuevoProducto.tipo).map((sabor) => (
                  <TouchableOpacity
                    key={sabor.id}
                    style={[
                      styles.comboOption,
                      nuevoProducto.sabor === sabor.nombre && styles.comboOptionSelected
                    ]}
                    onPress={() => setNuevoProducto({...nuevoProducto, sabor: sabor.nombre})}
                  >
                    <Text style={[
                      styles.comboOptionText,
                      nuevoProducto.sabor === sabor.nombre && styles.comboOptionTextSelected
                    ]}>
                      {sabor.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            )}

            {nuevoProducto.tipo !== 'otros' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relleno</Text>
              <View style={styles.comboContainer}>
                {rellenos.map((relleno) => (
                  <TouchableOpacity
                    key={relleno.id}
                    style={[
                      styles.comboOption,
                      nuevoProducto.relleno === relleno.nombre && styles.comboOptionSelected
                    ]}
                    onPress={() => setNuevoProducto({...nuevoProducto, relleno: relleno.nombre})}
                  >
                    <Text style={[
                      styles.comboOptionText,
                      nuevoProducto.relleno === relleno.nombre && styles.comboOptionTextSelected
                    ]}>
                      {relleno.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            )}

            {nuevoProducto.tipo !== 'otros' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tamaño</Text>
              <TextInput
                style={styles.input}
                value={nuevoProducto.tamaño || ''}
                onChangeText={(text) => setNuevoProducto({...nuevoProducto, tamaño: text})}
                placeholder="Ej: Pequeño, Mediano, Grande"
                placeholderTextColor={Colors.light.inputText}
              />
            </View>
            )}

            {nuevoProducto.tipo !== 'otros' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cantidad</Text>
              <TextInput
                style={styles.input}
                value={nuevoProducto.cantidad?.toString() || ''}
                onChangeText={(text) => setNuevoProducto({...nuevoProducto, cantidad: parseInt(text) || 1})}
                placeholder="1"
                keyboardType="numeric"
                placeholderTextColor={Colors.light.inputText}
              />
            </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={nuevoProducto.descripcion || ''}
                onChangeText={(text) => setNuevoProducto({...nuevoProducto, descripcion: text})}
                placeholder="Descripción del producto"
                multiline
                numberOfLines={2}
                placeholderTextColor={Colors.light.inputText}
              />
            </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowEditProductModal(false);
                  setEditingProductIndex(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleGuardarEdicionProducto}
              >
                <Text style={styles.confirmBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Abonar (móvil) */}
      <Modal visible={showAbonarModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalScrollContent}>
              <Text style={styles.modalTitle}>Registrar Abono</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Monto a abonar</Text>
                <TextInput
                  style={styles.input}
                  value={abonoInput}
                  onChangeText={(t) => {
                    const numeric = t.replace(/[^0-9.]/g, '');
                    const parts = numeric.split('.');
                    setAbonoInput(parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numeric);
                  }}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.light.inputText}
                />
                {pedidoAbonando && (
                  <Text style={{ color: Colors.light.inputText, marginTop: 8 }}>
                    Restante: {formatearPrecio(pedidoAbonando.precio_final - pedidoAbonando.monto_abonado)}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowAbonarModal(false);
                  setPedidoAbonando(null);
                  setAbonoInput('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => {
                  const monto = parseFloat(abonoInput || '0');
                  if (!pedidoAbonando) return;
                  setShowAbonarModal(false);
                  procesarAbono(pedidoAbonando, monto);
                  setPedidoAbonando(null);
                  setAbonoInput('');
                }}
              >
                <Text style={styles.confirmBtnText}>Registrar</Text>
              </TouchableOpacity>
            </View>
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
  filtersContainer: {
    padding: 16,
    gap: 12,
  },
  searchInput: {
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.light.inputBackground,
    color: Colors.light.inputText,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dateRowNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  datePickerContainer: {
    marginTop: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  resetBtn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.light.buttonSecondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  resetBtnText: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.inputBorder,
    gap: 8,
  },
  summaryToggleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: Colors.light.cardBackground,
  },
  summaryToggleBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.buttonSecondary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  summaryToggleText: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
  },
  filtersToggleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: Colors.light.cardBackground,
  },
  filtersToggleBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.buttonSecondary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  filtersToggleText: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.inputText,
    marginBottom: 4,
    fontWeight: '600',
  },
  pendienteLabel: {
    color: Colors.light.buttonPrimary,
  },
  summaryValue: {
    fontSize: 16,
    color: Colors.light.titleColor,
    fontWeight: 'bold',
  },
  copyBtn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.light.buttonSecondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  copyBtnText: {
    color: Colors.light.buttonText,
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
  nuevoPedidoBtn: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nuevoPedidoBtnText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  pedidoCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.buttonSecondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pedidoInfo: {
    flex: 1,
  },
  pedidoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 4,
  },
  pedidoFecha: {
    fontSize: 14,
    color: Colors.light.inputText,
    textTransform: 'capitalize',
  },
  pedidoAcciones: {
    flexDirection: 'row',
    gap: 8,
  },
  editarBtn: {
    backgroundColor: Colors.light.buttonSecondary,
    padding: 8,
    borderRadius: 6,
  },
  editarBtnText: {
    fontSize: 16,
  },
  eliminarBtn: {
    backgroundColor: Colors.light.buttonPrimary,
    padding: 8,
    borderRadius: 6,
  },
  eliminarBtnText: {
    fontSize: 16,
  },
  pedidoDetalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  precioInfo: {
    alignItems: 'center',
  },
  precioLabel: {
    fontSize: 12,
    color: Colors.light.inputText,
    marginBottom: 2,
  },
  precioValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
  },
  pendiente: {
    color: Colors.light.buttonPrimary,
  },
  descripcion: {
    fontSize: 14,
    color: Colors.light.inputText,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  productosContainer: {
    marginBottom: 12,
  },
  productosTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 8,
  },
  productoItem: {
    backgroundColor: Colors.light.background,
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  productoTipo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.light.buttonPrimary,
    marginBottom: 2,
  },
  productoDetalle: {
    fontSize: 12,
    color: Colors.light.inputText,
  },
  imagenPedido: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(94, 51, 111, 0.7)', // Morado oscuro con opacidad
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    width: '100%',
    maxHeight: '90%',
    maxWidth: 500,
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.light.inputBackground,
    color: Colors.light.inputText,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.inputBorder,
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: Colors.light.inputText,
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.buttonPrimary,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.light.inputBackground,
    marginTop: 8,
    flex: 1, // Hace que el botón ocupe el espacio disponible
    minWidth: 120, // Ancho mínimo razonable
  },
  dateButtonText: {
    color: Colors.light.inputText,
    fontSize: 16,
  },
  dateButtonIcon: {
    fontSize: 16,
  },
  productosEditList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  productoEditItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
  },
  productoEditInfo: {
    flex: 1,
  },
  productoEditTipo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 4,
  },
  productoEditDetalle: {
    fontSize: 14,
    color: Colors.light.inputText,
    marginBottom: 2,
  },
  eliminarProductoBtn: {
    backgroundColor: Colors.light.error,
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  eliminarProductoBtnText: {
    color: 'white',
    fontSize: 16,
  },
  agregarProductoBtn: {
    backgroundColor: Colors.light.buttonSecondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  agregarProductoBtnText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  abonarContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  abonarBtn: {
    backgroundColor: Colors.light.buttonSecondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  abonarBtnText: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
    fontSize: 14,
  },
  comboContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    maxHeight: 120,
  },
  comboOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    backgroundColor: Colors.light.background,
    minWidth: 80,
    alignItems: 'center',
  },
  comboOptionSelected: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  comboOptionText: {
    color: Colors.light.inputText,
    fontSize: 14,
  },
  comboOptionTextSelected: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
  },
  productoEditActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editarProductoBtn: {
    backgroundColor: Colors.light.buttonSecondary,
    padding: 8,
    borderRadius: 6,
  },
  editarProductoBtnText: {
    color: Colors.light.buttonText,
    fontSize: 16,
  },

  // Estilos para filtros avanzados
  advancedFiltersToggle: {
    marginTop: 8,
    marginBottom: 4,
  },
  advancedFiltersBtn: {
    backgroundColor: Colors.light.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    alignItems: 'center',
  },
  advancedFiltersBtnActive: {
    borderColor: Colors.light.buttonPrimary,
    backgroundColor: Colors.light.buttonPrimary + '10', // Color de fondo sutil
  },
  advancedFiltersText: {
    color: Colors.light.titleColor,
    fontSize: 14,
    fontWeight: '600',
  },
  advancedFiltersTextActive: {
    color: Colors.light.buttonPrimary,
    fontWeight: '700',
  },
  advancedFiltersContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    maxHeight: 280, // Altura máxima más conservadora
  },
  advancedFiltersContainerNarrow: {
    padding: 8, // Padding aún más reducido para pantallas pequeñas
    maxHeight: 250, // Altura máxima más pequeña en narrow
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterGroupNarrow: {
    marginBottom: 8, // Espacio aún más reducido
  },
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 8,
  },
  filterGroupTitleNarrow: {
    fontSize: 14, // Fuente más pequeña
    marginBottom: 6,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionsNarrow: {
    gap: 6, // Gap más pequeño
    justifyContent: 'flex-start', // Alinear a la izquierda
    flexWrap: 'wrap', // Asegurar que se envuelva
  },
  filterOption: {
    backgroundColor: Colors.light.background,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    minWidth: 70,
    maxWidth: 100, // Ancho máximo más pequeño para mejor ajuste
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32, // Altura mínima más pequeña
    flexShrink: 1, // Permitir encogimiento
    marginHorizontal: 2, // Margen horizontal pequeño
  },
  filterOptionNarrow: {
    minWidth: 60, // Ancho mínimo aún más pequeño
    maxWidth: 85, // Ancho máximo aún más pequeño
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginHorizontal: 1,
  },
  filterOptionSelected: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  filterOptionText: {
    color: Colors.light.inputText,
    fontSize: 14,
    fontWeight: '500',
  },
  filterOptionTextNarrow: {
    fontSize: 12, // Fuente más pequeña
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
  },

}); 