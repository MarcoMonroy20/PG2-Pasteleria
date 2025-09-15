import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { initDB, crearPedido, Producto, obtenerSabores, obtenerRellenos, Sabor, Relleno } from '../../services/db';
import Colors from '../../constants/Colors';

export default function NuevoPedidoScreen() {
  const navigation = useNavigation();
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [fechaEntregaDate, setFechaEntregaDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nombrePedido, setNombrePedido] = useState('');
  const [precioFinal, setPrecioFinal] = useState('');
  const [montoAbonado, setMontoAbonado] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState<Partial<Producto>>({
    tipo: 'pastel',
    sabor: '',
    relleno: '',
    tamaño: '',
    cantidad: 1,
    esMinicupcake: false,
    descripcion: '',
  });
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [rellenos, setRellenos] = useState<Relleno[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarSaboresYRellenos = async () => {
    try {
      const [saboresData, rellenosData] = await Promise.all([
        obtenerSabores(),
        obtenerRellenos(),
      ]);
      setSabores(saboresData);
      setRellenos(rellenosData);
    } catch (error) {
      console.error('Error cargando sabores y rellenos:', error);
    }
  };

  useEffect(() => {
    // Inicializar la base de datos y cargar datos
    const initializeData = async () => {
      try {
        await initDB();
        await cargarSaboresYRellenos();
        
        // Establecer fecha por defecto (mañana)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFechaEntregaDate(tomorrow);
        setFechaEntrega(tomorrow.toISOString().split('T')[0]);
      } catch (error) {
        console.error('Error inicializando datos:', error);
      }
    };

    initializeData();
  }, []);

  // Recargar datos cuando la pantalla se enfoque
  useFocusEffect(
    React.useCallback(() => {
      cargarSaboresYRellenos();
    }, [])
  );

  const handleAgregarProducto = () => {
    if (!nuevoProducto.tipo) {
      Alert.alert('Error', 'Selecciona el tipo de producto');
      return;
    }

    const producto: Producto = {
      tipo: nuevoProducto.tipo as 'pastel' | 'cupcakes' | 'otros',
      sabor: nuevoProducto.sabor || '',
      relleno: nuevoProducto.relleno || '',
      tamaño: nuevoProducto.tamaño || '',
      cantidad: nuevoProducto.cantidad || 1,
      esMinicupcake: nuevoProducto.esMinicupcake || false,
      descripcion: nuevoProducto.descripcion || '',
    };

    setProductos([...productos, producto]);
    setNuevoProducto({
      tipo: 'pastel',
      sabor: '',
      relleno: '',
      tamaño: '',
      cantidad: 1,
      esMinicupcake: false,
      descripcion: '',
    });
    setShowProductModal(false);
  };

  const handleEliminarProducto = (index: number) => {
    const nuevosProductos = productos.filter((_, i) => i !== index);
    setProductos(nuevosProductos);
  };

  const handleSeleccionarImagen = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImagen(result.assets[0].uri);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFechaEntregaDate(selectedDate);
      setFechaEntrega(selectedDate.toISOString().split('T')[0]);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleGuardarPedido = async () => {
    if (!fechaEntrega || !nombrePedido || !precioFinal || !montoAbonado) {
      Alert.alert('Error', 'Completa todos los campos obligatorios');
      return;
    }

    // Validar que los campos numéricos sean válidos
    const precio = parseFloat(precioFinal);
    const abonado = parseFloat(montoAbonado);
    
    if (isNaN(precio) || precio <= 0) {
      Alert.alert('Error', 'El precio final debe ser un número válido mayor a 0');
      return;
    }
    
    if (isNaN(abonado) || abonado < 0) {
      Alert.alert('Error', 'El monto abonado debe ser un número válido mayor o igual a 0');
      return;
    }
    
    if (abonado > precio) {
      Alert.alert('Error', 'El monto abonado no puede ser mayor al precio final');
      return;
    }

    if (productos.length === 0) {
      Alert.alert('Error', 'Agrega al menos un producto');
      return;
    }

    setLoading(true);

    try {
      const pedido = {
        fecha_entrega: fechaEntrega,
        nombre: nombrePedido,
        precio_final: parseFloat(precioFinal),
        monto_abonado: parseFloat(montoAbonado),
        descripcion: descripcion || undefined,
        imagen: imagen || undefined,
        productos: productos,
      };

      await crearPedido(pedido);
      
      // Mostrar mensaje de éxito y regresar al inicio
      
      // Usar confirm nativo del navegador para web
      if (Platform.OS === 'web') {
        const confirmado = window.confirm('¡Éxito! Pedido guardado correctamente. ¿Deseas continuar?');
        if (confirmado) {
          // Limpiar formulario
          setNombrePedido('');
          setPrecioFinal('');
          setMontoAbonado('');
          setDescripcion('');
          setImagen(null);
          setProductos([]);
          
          // Regresar al inicio
          try {
            navigation.navigate('index' as never);
          } catch (navError) {
            navigation.goBack();
          }
        }
      } else {
        // Usar Alert para móvil
        setTimeout(() => {
          Alert.alert(
            '¡Éxito!', 
            'Pedido guardado correctamente', 
            [
              { 
                text: 'OK', 
              onPress: () => {
                // Limpiar formulario
                setNombrePedido('');
                setPrecioFinal('');
                setMontoAbonado('');
                setDescripcion('');
                setImagen(null);
                setProductos([]);
                
                // Regresar al inicio
                try {
                  navigation.navigate('index' as never);
                } catch (navError) {
                  navigation.goBack();
                }
              }
              }
            ]
          );
        }, 100);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el pedido');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderProducto = ({ item, index }: { item: Producto; index: number }) => (
    <View style={styles.productoItem}>
      <View style={styles.productoInfo}>
        <Text style={styles.productoTipo}>{item.tipo.toUpperCase()}</Text>
        {item.sabor && <Text style={styles.productoDetalle}>Sabor: {item.sabor}</Text>}
        {item.relleno && <Text style={styles.productoDetalle}>Relleno: {item.relleno}</Text>}
        {item.tamaño && <Text style={styles.productoDetalle}>Tamaño: {item.tamaño}</Text>}
        {item.cantidad && <Text style={styles.productoDetalle}>Cantidad: {item.cantidad}</Text>}
        {item.esMinicupcake && <Text style={styles.productoDetalle}>Minicupcakes</Text>}
        {item.descripcion && <Text style={styles.productoDetalle}>{item.descripcion}</Text>}
      </View>
      <TouchableOpacity
        style={styles.eliminarBtn}
        onPress={() => handleEliminarProducto(index)}
      >
        <Text style={styles.eliminarBtnText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
      <Text style={styles.title}>Nuevo Pedido</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fecha de Entrega *</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => {
                const selectedDate = new Date(e.target.value);
                setFechaEntregaDate(selectedDate);
                setFechaEntrega(e.target.value);
              }}
              min={new Date().toISOString().split('T')[0]}
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
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formatDate(fechaEntregaDate)}
                </Text>
                <Text style={styles.dateButtonIcon}>📅</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={fechaEntregaDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : Platform.OS === 'android' ? 'calendar' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.datePicker}
              />
                  {Platform.OS === 'ios' && (
                    <View style={styles.datePickerButtons}>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.datePickerButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.datePickerButton, styles.datePickerButtonConfirm]}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={[styles.datePickerButtonText, styles.datePickerButtonTextConfirm]}>Confirmar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Pedido *</Text>
          <TextInput
            style={styles.input}
            value={nombrePedido}
            onChangeText={setNombrePedido}
            placeholder="Ej: Cumpleaños María"
            placeholderTextColor={Colors.light.inputText}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Precio Final *</Text>
            <TextInput
              style={styles.input}
              value={precioFinal}
              onChangeText={(text) => {
                // Solo permitir números y un punto decimal
                const numericValue = text.replace(/[^0-9.]/g, '');
                // Evitar múltiples puntos decimales
                const parts = numericValue.split('.');
                if (parts.length > 2) {
                  setPrecioFinal(parts[0] + '.' + parts.slice(1).join(''));
                } else {
                  setPrecioFinal(numericValue);
                }
              }}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor={Colors.light.inputText}
            />
          </View>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Monto Abonado *</Text>
            <TextInput
              style={styles.input}
              value={montoAbonado}
              onChangeText={(text) => {
                // Solo permitir números y un punto decimal
                const numericValue = text.replace(/[^0-9.]/g, '');
                // Evitar múltiples puntos decimales
                const parts = numericValue.split('.');
                if (parts.length > 2) {
                  setMontoAbonado(parts[0] + '.' + parts.slice(1).join(''));
                } else {
                  setMontoAbonado(numericValue);
                }
              }}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor={Colors.light.inputText}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Detalles adicionales del pedido"
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.light.inputText}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Imagen de Referencia</Text>
          <TouchableOpacity style={styles.imageButton} onPress={handleSeleccionarImagen}>
            {imagen ? (
              <Image source={{ uri: imagen }} style={styles.imagePreview} />
            ) : (
              <Text style={styles.imageButtonText}>📷 Seleccionar Imagen</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.productosHeader}>
            <Text style={styles.label}>Productos *</Text>
            <TouchableOpacity
              style={styles.agregarBtn}
              onPress={() => setShowProductModal(true)}
            >
              <Text style={styles.agregarBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={productos}
            renderItem={renderProducto}
            keyExtractor={(_, index) => index.toString()}
            style={styles.productosList}
          />
        </View>

        <TouchableOpacity
          style={[styles.guardarBtn, loading && styles.guardarBtnDisabled]} 
          onPress={handleGuardarPedido}
          disabled={loading}
        >
          <Text style={styles.guardarBtnText}>
            {loading ? 'Guardando...' : 'Guardar Pedido'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal para agregar producto */}
      <Modal visible={showProductModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Producto</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Producto</Text>
              <View style={styles.tipoButtons}>
                {['pastel', 'cupcakes', 'otros'].map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.tipoButton,
                      nuevoProducto.tipo === tipo && styles.tipoButtonActive
                    ]}
                    onPress={() => setNuevoProducto({...nuevoProducto, tipo: tipo as any})}
                  >
                    <Text style={[
                      styles.tipoButtonText,
                      nuevoProducto.tipo === tipo && styles.tipoButtonTextActive
                    ]}>
                      {tipo.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {nuevoProducto.tipo === 'pastel' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Sabor</Text>
                  <View style={styles.comboContainer}>
                    {sabores.filter(s => s.tipo === 'pastel').map((sabor) => (
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
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tamaño</Text>
                  <TextInput
                    style={styles.input}
                    value={nuevoProducto.tamaño}
                    onChangeText={(text) => setNuevoProducto({...nuevoProducto, tamaño: text})}
                    placeholder="Ej: Grande, Mediano, Pequeño"
                    placeholderTextColor={Colors.light.inputText}
                  />
                </View>
              </>
            )}

            {nuevoProducto.tipo === 'cupcakes' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Sabor</Text>
                  <View style={styles.comboContainer}>
                    {sabores.filter(s => s.tipo === 'cupcakes').map((sabor) => (
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
                <View style={styles.row}>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Cantidad</Text>
                    <TextInput
                      style={styles.input}
                      value={nuevoProducto.cantidad?.toString()}
                      onChangeText={(text) => setNuevoProducto({...nuevoProducto, cantidad: parseInt(text) || 1})}
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor={Colors.light.inputText}
                    />
                  </View>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        nuevoProducto.esMinicupcake && styles.checkboxActive
                      ]}
                      onPress={() => setNuevoProducto({...nuevoProducto, esMinicupcake: !nuevoProducto.esMinicupcake})}
                    >
                      <Text style={styles.checkboxText}>Minicupcakes</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {nuevoProducto.tipo === 'otros' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={nuevoProducto.descripcion}
                  onChangeText={(text) => setNuevoProducto({...nuevoProducto, descripcion: text})}
                  placeholder="Ej: Galletas, Espumillas, Trenzas, Cakepops, Paletas"
                  multiline
                  numberOfLines={2}
                  placeholderTextColor={Colors.light.inputText}
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowProductModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleAgregarProducto}
              >
                <Text style={styles.confirmBtnText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
    </View>
      </Modal>
    </ScrollView>
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
  form: {
    padding: 16,
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
  imageButton: {
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.light.inputBackground,
  },
  imageButtonText: {
    fontSize: 16,
    color: Colors.light.inputText,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  productosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agregarBtn: {
    backgroundColor: Colors.light.buttonSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  agregarBtnText: {
    color: Colors.light.buttonSecondaryText,
    fontWeight: 'bold',
  },
  productosList: {
    maxHeight: 200,
  },
  productoItem: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  productoInfo: {
    flex: 1,
  },
  productoTipo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
  },
  productoDetalle: {
    fontSize: 14,
    color: Colors.light.inputText,
    marginTop: 2,
  },
  eliminarBtn: {
    backgroundColor: Colors.light.buttonPrimary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eliminarBtnText: {
    color: Colors.light.buttonText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  guardarBtn: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  guardarBtnText: {
    color: Colors.light.buttonText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 20,
    textAlign: 'center',
  },
  tipoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipoButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    alignItems: 'center',
  },
  tipoButtonActive: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  tipoButtonText: {
    color: Colors.light.inputText,
    fontWeight: 'bold',
  },
  tipoButtonTextActive: {
    color: Colors.light.buttonText,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    borderRadius: 8,
    backgroundColor: Colors.light.inputBackground,
  },
  checkboxActive: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  checkboxText: {
    color: Colors.light.inputText,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.light.inputText,
    fontWeight: 'bold',
  },
  confirmBtn: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.buttonPrimary,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.light.inputBackground,
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.light.inputText,
    flex: 1,
  },
  dateButtonIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  comboContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  comboOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    backgroundColor: Colors.light.inputBackground,
  },
  comboOptionSelected: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  comboOptionText: {
    fontSize: 14,
    color: Colors.light.inputText,
    fontWeight: '500',
  },
  comboOptionTextSelected: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
  },
  guardarBtnDisabled: {
    backgroundColor: Colors.light.inputBorder,
    opacity: 0.6,
  },
  datePickerContainer: {
    marginTop: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
  },
  datePicker: {
    width: '100%',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  datePickerButton: {
    flex: 1,
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    alignItems: 'center',
  },
  datePickerButtonConfirm: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  datePickerButtonText: {
    color: Colors.light.inputText,
    fontWeight: '500',
  },
  datePickerButtonTextConfirm: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
  },
}); 