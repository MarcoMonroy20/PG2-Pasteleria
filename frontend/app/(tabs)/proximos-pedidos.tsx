import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
  RefreshControl,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { initDB, obtenerPedidos, eliminarPedido, actualizarPedido, Pedido, Producto, obtenerSabores, obtenerRellenos } from '../../services/db';
import Colors from '../../constants/Colors';

export default function ProximosPedidosScreen() {
  const navigation = useNavigation();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
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

  useEffect(() => {
    cargarPedidos();
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
      const saboresData = await obtenerSabores();
      const rellenosData = await obtenerRellenos();
      setSabores(saboresData);
      setRellenos(rellenosData);
    } catch (error) {
      console.error('Error cargando sabores y rellenos:', error);
    }
  };

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

      await actualizarPedido(pedidoEditando.id!, pedidoActualizado);
      await cargarPedidos();
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
      await eliminarPedido(pedido.id!);
      await cargarPedidos();
      
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

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatearPrecio = (precio: number) => {
    return `$${precio.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  const renderPedido = ({ item }: { item: Pedido }) => (
    <View style={styles.pedidoCard}>
      <View style={styles.pedidoHeader}>
        <View style={styles.pedidoInfo}>
          <Text style={styles.pedidoNombre}>{item.nombre}</Text>
          <Text style={styles.pedidoFecha}>{formatearFecha(item.fecha_entrega)}</Text>
        </View>
        <View style={styles.pedidoAcciones}>
          <TouchableOpacity
            style={styles.editarBtn}
            onPress={() => handleEditarPedido(item)}
          >
            <Text style={styles.editarBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.eliminarBtn}
            onPress={() => handleEliminarPedido(item)}
          >
            <Text style={styles.eliminarBtnText}>🗑️</Text>
          </TouchableOpacity>
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
          <Text style={styles.precioLabel}>Pendiente:</Text>
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
            <Text style={styles.productoTipo}>{producto.tipo.toUpperCase()}</Text>
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
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    marginTop: 8,
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
    backgroundColor: '#ff4444',
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
}); 